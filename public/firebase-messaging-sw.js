// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDpC7nL90nEUjooE6tN6lxLVleddzvhKf8",
  authDomain: "compraya-d0760.firebaseapp.com",
  projectId: "compraya-d0760",
  storageBucket: "compraya-d0760.firebasestorage.app",
  messagingSenderId: "741576296960",
  appId: "1:741576296960:web:46714b2a883293bc7d26e5"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Manejo de notificaciones en segundo plano / app cerrada
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en background:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || "Compra Ya";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "Tienes un nuevo mensaje",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    image: payload.notification?.image || payload.data?.image,
    vibrate: [200, 100, 200, 100, 200],
    tag: "compra-ya-msg",
    renotify: true,
    requireInteraction: false,
    data: {
      url: payload.data?.url || payload.notification?.click_action || "/notificaciones.html"
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Al hacer clic en la notificación (incluso en background)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/notificaciones.html";

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si la app ya está abierta, enfoca esa ventana
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});