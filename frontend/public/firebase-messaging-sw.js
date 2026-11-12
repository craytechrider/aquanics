importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js",
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyDQxJNdNHW4eU3k2j62zAHD_ZVbmqBGeAA",
  authDomain: "aquanics-b0760.firebaseapp.com",
  projectId: "aquanics-b0760",
  storageBucket: "aquanics-b0760.firebasestorage.app",
  messagingSenderId: "1062837814375",
  appId: "1:1062837814375:web:31c60d54a49cf0056d00c2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const title =
    payload.notification?.title || payload.data?.title || "Aquanics Alert";

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    "Aquanics has detected an alert.";

  self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
    data: payload.data || {},
  });
});
