import {
  getMessaging,
  getToken,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

import app from "./firebase";
import { pushNotificationApi } from "./app/lib/api";

const messaging = getMessaging(app);

// ============================================================
// REQUEST NOTIFICATION PERMISSION
// ============================================================

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications.");

      return null;
    }

    // Ask the user for notification permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Notification permission was not granted.");

      return null;
    }

    // Get Firebase VAPID public key
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error("VITE_FIREBASE_VAPID_KEY is missing from frontend/.env");

      return null;
    }

    // Register Firebase Messaging service worker
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );

    console.log("Firebase service worker registered:", registration.scope);

    // Generate Firebase Cloud Messaging token
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("Firebase did not return an FCM token.");

      return null;
    }

    console.log("FCM token generated successfully:", token);

    return token;
  } catch (error) {
    console.error("Failed to get FCM token:", error);

    return null;
  }
}

// ============================================================
// REGISTER FCM TOKEN WITH LARAVEL
// ============================================================

export async function registerPushToken(): Promise<string | null> {
  try {
    // Generate/get FCM token
    const token = await requestNotificationPermission();

    if (!token) {
      return null;
    }

    // Send token to Laravel.
    //
    // The api.ts interceptor automatically adds:
    //
    // Authorization: Bearer <auth_token>
    //
    // Therefore Laravel knows which user is currently logged in.
    await pushNotificationApi.registerToken({
      token,
      device_name: navigator.userAgent,
    });

    console.log("FCM token successfully saved to Aquanics backend.");

    return token;
  } catch (error) {
    console.error("Failed to register push token:", error);

    return null;
  }
}

// ============================================================
// FOREGROUND MESSAGES
// ============================================================

export function listenForForegroundMessages(
  callback: (payload: MessagePayload) => void,
) {
  return onMessage(messaging, callback);
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default messaging;
