importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// IMPORTANTE: Debe ser la misma config que usas en el resto de tu app
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDpC7nL90nEUjooE6tN6lxLVleddzvhKf8",
  authDomain: "compraya-d0760.firebaseapp.com",
  databaseURL: "https://compraya-d0760-default-rtdb.firebaseio.com",
  projectId: "compraya-d0760",
  storageBucket: "compraya-d0760.firebasestorage.app",
  messagingSenderId: "741576296960",
  appId: "1:741576296960:web:46714b2a883293bc7d26e5",
  measurementId: "G-FXQZVDH85F"
};
const messaging = firebase.messaging();

// Maneja notificaciones cuando la app está en segundo plano o cerrada
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensaje en background:', payload);

  const title = payload?.notification?.title || payload?.data?.title || 'Compra Ya';
  const body = payload?.notification?.body || payload?.data?.body || 'Tienes una nueva notificación';
  const url = payload?.data?.url || '/notificaciones.html';

  self.registration.showNotification(title, {
    body,
    icon: '/assets/logo-compraya.png',
    badge: '/assets/badge.png',
    data: { url },
    vibrate: [200, 100, 200]
  });
});

// Al hacer click en la notificación background abre la URL correcta
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});