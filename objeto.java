// ================================================
// UsuarioService.java
// Servicio profesional con Firebase Admin SDK
// Compra Ya Marketplace
// ================================================

package com.example.demo.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserUpdateRequest;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class UsuarioService {

    private final Firestore db;
    private final FirebaseAuth auth;

    @Autowired
    public UsuarioService(Firestore db, FirebaseAuth auth) {
        this.db = db;
        this.auth = auth;
    }

    // ==================== ACTUALIZAR FOTO DE PERFIL ====================
    public void actualizarFotoPerfil(String uid, String photoUrl) 
            throws FirebaseAuthException, ExecutionException, InterruptedException {
        
        // Actualizar en Firebase Authentication
        UserUpdateRequest request = new UserUpdateRequest().setPhotoUrl(photoUrl);
        auth.updateUser(uid, request);

        // Actualizar en Firestore
        DocumentReference userRef = db.collection("usuarios").document(uid);
        userRef.set(Map.of("avatar", photoUrl, "ultimaActualizacion", FieldValue.serverTimestamp()), 
                    SetOptions.merge());

        System.out.println("📸 Foto de perfil actualizada para UID: " + uid);
    }

    // ==================== REGISTRAR VISTA DIARIA ====================
    public void registrarVistaPerfil(String uid) throws ExecutionException, InterruptedException {
        String hoy = LocalDate.now().toString();

        DocumentReference vistasRef = db.collection("vistasPerfil").document(uid);
        vistasRef.set(Map.of(
                hoy, FieldValue.increment(1),
                "ultimaVista", FieldValue.serverTimestamp()
        ), SetOptions.merge());
    }

    // ==================== OBTENER ESTADÍSTICAS ====================
    public Map<String, Object> obtenerEstadisticas(String uid) 
            throws ExecutionException, InterruptedException {
        
        DocumentSnapshot userDoc = db.collection("usuarios").document(uid).get().get();
        Map<String, Object> stats = userDoc.exists() ? userDoc.getData() : new HashMap<>();

        // Vistas
        DocumentSnapshot vistasDoc = db.collection("vistasPerfil").document(uid).get().get();
        int vistasHoy = 0;
        long vistasTotales = 0;

        if (vistasDoc.exists()) {
            Map<String, Object> map = vistasDoc.getData();
            String hoy = LocalDate.now().toString();
            vistasHoy = ((Number) map.getOrDefault(hoy, 0)).intValue();

            for (Object v : map.values()) {
                if (v instanceof Number) vistasTotales += ((Number) v).longValue();
            }
        }

        stats.put("vistasHoy", vistasHoy);
        stats.put("vistasTotales", vistasTotales);
        return stats;
    }

    // ==================== ENVIAR MENSAJE SEGURO ====================
    public String enviarMensaje(String deUid, String paraUid, String texto, boolean esComunidad) 
            throws ExecutionException, InterruptedException {

        Map<String, Object> mensaje = new HashMap<>();
        mensaje.put("de", deUid);
        mensaje.put("para", paraUid);
        mensaje.put("texto", texto);
        mensaje.put("esComunidad", esComunidad);
        mensaje.put("leido", false);
        mensaje.put("fecha", FieldValue.serverTimestamp());

        DocumentReference ref = db.collection("mensajes").add(mensaje).get();
        return ref.getId();
    }

    package com.compraya.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.admin-sdk-path}")
    private String firebaseAdminSdkPath;

    @PostConstruct
    public void initialize() {
        try {
            InputStream serviceAccount = getClass().getClassLoader()
                    .getResourceAsStream("firebase-service-account.json");

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("✅ Firebase Admin SDK inicializado correctamente");
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("❌ Error al inicializar Firebase: " + e.getMessage());
        }
    }
}
}