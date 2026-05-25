"use strict";

const { setGlobalOptions } = require("firebase-functions");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const logger = require("firebase-functions/logger");

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// ─────────────────────────────────────────
// CONFIGURACIÓN EMAIL (desde .env)
// ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─────────────────────────────────────────
// HELPER: Formatear moneda
// ─────────────────────────────────────────
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-GQ", {
    minimumFractionDigits: 0
  }).format(amount) + " XAF";
};

// ─────────────────────────────────────────
// HELPER: Email HTML base
// ─────────────────────────────────────────
const emailBase = (contenido) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f6fa; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white;
                 border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
    .header { background: #1A3A5C; padding: 28px; text-align: center; }
    .header h1 { color: #C9A84C; margin: 0; font-size: 26px; letter-spacing: 2px; }
    .header p { color: #ffffff99; margin: 6px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .detail-row { display: flex; justify-content: space-between;
                  padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    .amount { font-size: 36px; font-weight: bold; color: #1A3A5C;
              text-align: center; padding: 20px; background: #f5f6fa;
              border-radius: 8px; margin: 16px 0; }
    .btn { display: inline-block; background: #C9A84C; color: #0A0E1A;
           padding: 14px 32px; border-radius: 8px; text-decoration: none;
           font-weight: bold; margin: 16px 0; }
    .badge-ok { background: #e8f5e9; border: 1px solid #2ECC71; border-radius: 8px;
                padding: 10px 14px; font-size: 13px; color: #1a6e33; margin: 12px 0; }
    .badge-warn { background: #fff3e0; border: 1px solid #F39C12; border-radius: 8px;
                  padding: 10px 14px; font-size: 13px; color: #7a4f00; margin: 12px 0; }
    .footer { background: #f5f6fa; padding: 16px; text-align: center;
              font-size: 11px; color: #9AA3B2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>COMPRA YA</h1>
      <p>Plataforma de comercio — Guinea Ecuatorial</p>
    </div>
    <div class="body">${contenido}</div>
    <div class="footer">
      © Compra Ya — Si no realizaste esta acción contáctanos inmediatamente.<br>
      Nunca compartimos tu PIN ni contraseñas bancarias.
    </div>
  </div>
</body>
</html>`;

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN 1 — Pago iniciado (nueva transacción en Firestore)
// ═══════════════════════════════════════════════════════════════
exports.onPaymentInitiated = onDocumentCreated(
  "transacciones/{transId}",
  async (event) => {
    const trans = event.data.data();
    const transId = event.params.transId;

    try {
      // 1. Escribir en Realtime Database para Delivery
      await admin.database().ref(`delivery/pending/${transId}`).set({
        pedidoId: trans.pedidoId || transId,
        compradorNombre: trans.compradorNombre || "Comprador",
        compradorId: trans.compradorId || "",
        vendedorNombre: trans.vendedorNombre || "Vendedor",
        vendedorId: trans.vendedorId || "",
        direccionEntrega: trans.direccionEntrega || "No especificada",
        monto: trans.monto || 0,
        banco: trans.banco || "No especificado",
        status: "esperando_pago",
        timestamp: admin.database.ServerValue.TIMESTAMP
      });

      // 2. Notificar al vendedor por FCM
      const vendedorDoc = await admin.firestore()
        .collection("users").doc(trans.vendedorId).get();

      if (vendedorDoc.exists) {
        const fcmToken = vendedorDoc.data().fcmToken;
        if (fcmToken) {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: "💰 Nuevo pago iniciado",
              body: `${trans.compradorNombre} está pagando ${formatCurrency(trans.monto)}`
            },
            data: { pedidoId: trans.pedidoId || transId, tipo: "pago_iniciado" }
          });
        }
      }

      // 3. Email al comprador
      if (trans.compradorEmail) {
        const contenido = `
          <p>Hola <strong>${trans.compradorNombre}</strong>,</p>
          <p>Tu pago ha sido iniciado correctamente.</p>
          <div class="amount">${formatCurrency(trans.monto)}</div>
          <div class="detail-row"><span>Pedido</span><strong>#${trans.pedidoId || transId}</strong></div>
          <div class="detail-row"><span>Banco</span><strong>${(trans.banco || "").toUpperCase()}</strong></div>
          <div class="detail-row"><span>Vendedor</span><strong>${trans.vendedorNombre}</strong></div>
          <div class="detail-row"><span>Estado</span><strong>⏳ Pendiente de confirmación</strong></div>
          <div class="badge-ok">🔒 Pago protegido con SSL. Nunca compartas tu PIN.</div>
          <p>Te avisaremos cuando el vendedor confirme la recepción.</p>
          <center>
            <a class="btn" href="https://compraya.web.app/pedido-detalle.html?id=${trans.pedidoId || transId}">
              Ver estado de mi pedido
            </a>
          </center>`;

        await transporter.sendMail({
          from: '"Compra Ya" <noreply@compraya.com>',
          to: trans.compradorEmail,
          subject: `⏳ Pago iniciado — Pedido #${trans.pedidoId || transId}`,
          html: emailBase(contenido)
        });
      }

      // 4. Email al admin
      await transporter.sendMail({
        from: '"CY Sistema" <noreply@compraya.com>',
        to: process.env.EMAIL_USER,
        subject: `📢 Nueva transacción — ${formatCurrency(trans.monto)} — ${trans.banco}`,
        html: emailBase(`
          <p>Nueva transacción registrada en la plataforma.</p>
          <div class="detail-row"><span>ID</span><strong>${transId}</strong></div>
          <div class="detail-row"><span>Comprador</span><strong>${trans.compradorNombre}</strong></div>
          <div class="detail-row"><span>Vendedor</span><strong>${trans.vendedorNombre}</strong></div>
          <div class="detail-row"><span>Monto</span><strong>${formatCurrency(trans.monto)}</strong></div>
          <div class="detail-row"><span>Banco</span><strong>${trans.banco}</strong></div>`)
      });

      logger.info(`✅ onPaymentInitiated completado para transacción ${transId}`);

    } catch (error) {
      logger.error("❌ Error en onPaymentInitiated:", error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN 2 — Pago confirmado (status cambia a 'confirmado')
// ═══════════════════════════════════════════════════════════════
exports.onPaymentConfirmed = onDocumentUpdated(
  "transacciones/{transId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const transId = event.params.transId;

    if (before.status === after.status) return null;
    if (after.status !== "confirmado") return null;

    try {
      // 1. Actualizar pedido en Firestore
      if (after.pedidoId) {
        await admin.firestore().collection("pedidos").doc(after.pedidoId).update({
          status: "pago_confirmado",
          fechaConfirmacion: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 2. Mover en Realtime Database de pending a confirmed
      const pendingRef = admin.database().ref(`delivery/pending/${transId}`);
      const snap = await pendingRef.get();

      if (snap.exists()) {
        await admin.database().ref(`delivery/confirmed/${transId}`).set({
          ...snap.val(),
          status: "pago_confirmado",
          readyForPickup: true,
          confirmedAt: admin.database.ServerValue.TIMESTAMP
        });
        await pendingRef.remove();
      }

      // 3. Notificar al comprador por FCM
      const compradorDoc = await admin.firestore()
        .collection("users").doc(after.compradorId).get();

      if (compradorDoc.exists) {
        const fcmToken = compradorDoc.data().fcmToken;
        if (fcmToken) {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: "✅ Pago confirmado",
              body: "Tu pago fue confirmado. Tu pedido está siendo preparado."
            },
            data: { pedidoId: after.pedidoId || transId, tipo: "pago_confirmado" }
          });
        }
      }

      // 4. Email de confirmación al comprador
      if (after.compradorEmail) {
        const contenido = `
          <p>Hola <strong>${after.compradorNombre}</strong>,</p>
          <p>¡Tu pago ha sido <strong>confirmado</strong>! 🎉</p>
          <div class="amount">${formatCurrency(after.monto)}</div>
          <div class="detail-row"><span>Pedido</span><strong>#${after.pedidoId || transId}</strong></div>
          <div class="detail-row"><span>Banco</span><strong>${(after.banco || "").toUpperCase()}</strong></div>
          <div class="detail-row"><span>Estado</span><strong>✅ Confirmado</strong></div>
          <div class="badge-ok">✅ Pago verificado y procesado correctamente.</div>
          <p>Tu pedido está siendo preparado para entrega.</p>
          <center>
            <a class="btn" href="https://compraya.web.app/pedido-detalle.html?id=${after.pedidoId || transId}">
              Seguir mi pedido
            </a>
          </center>`;

        await transporter.sendMail({
          from: '"Compra Ya" <noreply@compraya.com>',
          to: after.compradorEmail,
          subject: `✅ Pago confirmado — Pedido #${after.pedidoId || transId}`,
          html: emailBase(contenido)
        });
      }

      logger.info(`✅ onPaymentConfirmed completado para ${transId}`);
      return null;

    } catch (error) {
      logger.error("❌ Error en onPaymentConfirmed:", error);
      return null;
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN 3 — Enviar código de verificación por email
// ═══════════════════════════════════════════════════════════════
exports.sendVerificationCode = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("No autenticado");
  }

  const { email, pedidoId } = request.data;
  const uid = request.auth.uid;

  // Generar código de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const expira = Date.now() + 10 * 60 * 1000; // 10 minutos

  // Guardar en Realtime Database
  await admin.database().ref(`verification_codes/${uid}`).set({
    codigo,
    pedidoId,
    expira,
    usado: false
  });

  // Enviar email con el código
  const contenido = `
    <p>Usa este código para confirmar tu pago del pedido <strong>#${pedidoId}</strong>:</p>
    <div style="font-size:52px;font-weight:bold;letter-spacing:14px;color:#1A3A5C;
                text-align:center;padding:28px;background:#f5f6fa;
                border-radius:12px;margin:20px 0;">
      ${codigo}
    </div>
    <div class="badge-warn">⏱ Este código expira en <strong>10 minutos</strong>.</div>
    <p style="color:#9AA3B2;font-size:12px;">
      Si no solicitaste este código ignora este mensaje.
      Nunca compartas este código con nadie, ni con el equipo de Compra Ya.
    </p>`;

  await transporter.sendMail({
    from: '"Compra Ya — Seguridad" <noreply@compraya.com>',
    to: email,
    subject: `🔐 Tu código de verificación: ${codigo}`,
    html: emailBase(contenido)
  });

  return { enviado: true, expiraEn: 600 };
});

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN 4 — Verificar código de pago
// ═══════════════════════════════════════════════════════════════
exports.verifyPaymentCode = onCall(async (request) => {
  if (!request.auth) throw new Error("No autenticado");

  const { codigo, pedidoId } = request.data;
  const uid = request.auth.uid;

  const snap = await admin.database().ref(`verification_codes/${uid}`).get();

  if (!snap.exists()) throw new Error("Código no encontrado. Solicita uno nuevo.");

  const stored = snap.val();

  if (stored.usado) throw new Error("Este código ya fue utilizado.");
  if (Date.now() > stored.expira) throw new Error("El código ha expirado. Solicita uno nuevo.");
  if (stored.codigo !== codigo) throw new Error("Código incorrecto. Verifica e intenta de nuevo.");
  if (stored.pedidoId !== pedidoId) throw new Error("El código no corresponde a este pedido.");

  // Marcar como usado
  await admin.database().ref(`verification_codes/${uid}`).update({ usado: true });

  // Confirmar transacción
  const transSnap = await admin.firestore().collection("transacciones")
    .where("pedidoId", "==", pedidoId)
    .where("compradorId", "==", uid)
    .get();

  for (const doc of transSnap.docs) {
    await doc.ref.update({ status: "confirmado" });
  }

  return { verificado: true };
});

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN 5 — Enviar notificación masiva de ofertas (solo admin)
// ═══════════════════════════════════════════════════════════════
exports.sendOfferNotification = onCall(async (request) => {
  if (!request.auth) throw new Error("No autenticado");

  // Verificar que es superadmin
  const callerDoc = await admin.firestore()
    .collection("users").doc(request.auth.uid).get();

  if (!callerDoc.exists || callerDoc.data().role !== "superadmin") {
    throw new Error("Solo administradores pueden enviar notificaciones masivas.");
  }

  const { titulo, mensaje, urlDestino, segmento } = request.data;

  // Obtener usuarios según segmento
  let query = admin.firestore().collection("users");
  if (segmento === "premium") query = query.where("premium", "==", true);
  if (segmento === "vendedores") query = query.where("esVendedor", "==", true);
  if (segmento === "compradores") query = query.where("esVendedor", "==", false);

  const usersSnap = await query.get();
  const tokens = usersSnap.docs
    .map(d => d.data().fcmToken)
    .filter(Boolean);

  if (tokens.length === 0) return { enviados: 0 };

  // Enviar en lotes de 500
  let totalEnviados = 0;
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    const result = await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: { title: titulo, body: mensaje },
      data: { url: urlDestino || "", tipo: "oferta" },
      webpush: {
        fcmOptions: { link: urlDestino || "https://compraya.web.app" }
      }
    });
    totalEnviados += result.successCount;
  }

  // Guardar historial
  await admin.firestore().collection("notificaciones_masivas").add({
    titulo,
    mensaje,
    segmento: segmento || "todos",
    urlDestino: urlDestino || "",
    totalEnviados,
    enviadoPor: request.auth.uid,
    fecha: admin.firestore.FieldValue.serverTimestamp()
  });

  return { enviados: totalEnviados };
});

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN 6 — Notificar admin de nuevo servicio publicado
// ═══════════════════════════════════════════════════════════════
exports.onNuevoServicio = onDocumentCreated(
  "servicios/{servicioId}",
  async (event) => {
    const servicio = event.data.data();
    const servicioId = event.params.servicioId;

    try {
      const contenido = `
        <p>Un nuevo servicio ha sido publicado y está esperando revisión.</p>
        <div class="detail-row"><span>Título</span><strong>${servicio.titulo}</strong></div>
        <div class="detail-row"><span>Vendedor</span><strong>${servicio.vendedorNombre}</strong></div>
        <div class="detail-row"><span>Categoría</span><strong>${servicio.categoria}</strong></div>
        <div class="detail-row"><span>Precio</span><strong>${formatCurrency(servicio.precio)}</strong></div>
        <div class="detail-row"><span>Estado</span><strong>⏳ Pendiente de aprobación</strong></div>
        <center>
          <a class="btn" href="https://compraya.web.app/1234.html">
            Revisar en el panel admin
          </a>
        </center>`;

      await transporter.sendMail({
        from: '"CY Sistema" <noreply@compraya.com>',
        to: process.env.EMAIL_USER,
        subject: `📢 Nuevo servicio pendiente: ${servicio.titulo}`,
        html: emailBase(contenido)
      });

      logger.info(`✅ Admin notificado del nuevo servicio ${servicioId}`);
    } catch (error) {
      logger.error("❌ Error en onNuevoServicio:", error);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN 7 — Reporte mensual automático (día 1 de cada mes)
// ═══════════════════════════════════════════════════════════════
exports.reporteMensual = onSchedule("0 8 1 * *", async (event) => {
  try {
    const ahora = new Date();
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

    // Contar transacciones del mes anterior
    const transSnap = await admin.firestore().collection("transacciones")
      .where("status", "==", "confirmado")
      .get();

    const serviciosSnap = await admin.firestore().collection("servicios")
      .where("status", "==", "activo")
      .get();

    const usersSnap = await admin.firestore().collection("users").get();

    const totalMonto = transSnap.docs.reduce((acc, d) => acc + (d.data().monto || 0), 0);

    const contenido = `
      <h2 style="color:#1A3A5C;">📊 Reporte Mensual — ${mesAnterior.toLocaleString("es-GQ", { month: "long", year: "numeric" })}</h2>
      <div class="detail-row"><span>Total transacciones confirmadas</span><strong>${transSnap.size}</strong></div>
      <div class="detail-row"><span>Volumen total procesado</span><strong>${formatCurrency(totalMonto)}</strong></div>
      <div class="detail-row"><span>Servicios activos</span><strong>${serviciosSnap.size}</strong></div>
      <div class="detail-row"><span>Usuarios registrados</span><strong>${usersSnap.size}</strong></div>
      <div class="badge-ok">✅ Reporte generado automáticamente por CY Sistema.</div>
      <center>
        <a class="btn" href="https://compraya.web.app/1234.html">
          Ver panel completo
        </a>
      </center>`;

    await transporter.sendMail({
      from: '"CY Sistema — Reportes" <noreply@compraya.com>',
      to: process.env.EMAIL_USER,
      subject: `📊 Reporte Mensual Compra Ya — ${mesAnterior.toLocaleString("es-GQ", { month: "long" })}`,
      html: emailBase(contenido)
    });

    logger.info("✅ Reporte mensual enviado correctamente");
  } catch (error) {
    logger.error("❌ Error en reporteMensual:", error);
  }
});