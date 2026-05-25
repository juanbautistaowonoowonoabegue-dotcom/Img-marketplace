/* ══════════════════════════════════════════════════════
   Compra Ya – Firebase Messaging Service Worker
   Place this file at the ROOT of your website (same level as index.html)
   File: firebase-messaging-sw.js
══════════════════════════════════════════════════════ */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// ── Firebase config (must match chats.html) ──
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

// ── Background message handler ──
// This fires when the app is in the background / closed
messaging.onBackgroundMessage(payload => {
  const { title, body, image } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || '📩 Nuevo Mensaje – Compra Ya', {
    body:    body || 'Tienes un mensaje nuevo',
    icon:    '/favicon.ico',
    badge:   '/favicon.ico',
    image:   image || undefined,
    tag:     data.chatId || 'cy-msg',
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      { action: 'open',   title: '💬 Abrir chat' },
      { action: 'dismiss',title: '✖ Ignorar'     }
    ],
    data: {
      url:    data.url    || '/chats.html',
      chatId: data.chatId || null
    }
  });
});

// ── Notification click handler ──
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/chats.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes('chats.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ── Push event fallback ──
self.addEventListener('push', event => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const { title, body } = payload.notification || {};
    event.waitUntil(
      self.registration.showNotification(title || 'Compra Ya', {
        body:    body || 'Nuevo mensaje',
        icon:    '/favicon.ico',
        vibrate: [200, 100, 200],
        data:    { url: '/chats.html' }
      })
    );
  } catch(e) {}
});