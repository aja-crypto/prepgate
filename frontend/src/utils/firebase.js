// Firebase Cloud Messaging — optional push notifications when configured
import { authService } from '../services/api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId);
}

let messagingInstance = null;

async function getMessaging() {
  if (!isFirebaseConfigured()) return null;
  if (messagingInstance) return messagingInstance;
  try {
    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
    const app = initializeApp(firebaseConfig);
    messagingInstance = { messaging: getMessaging(app), getToken, onMessage };
    return messagingInstance;
  } catch {
    return null;
  }
}

export async function initFirebasePush(onForegroundMessage) {
  if (!isFirebaseConfigured()) return false;
  if (!('Notification' in window)) return false;

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;

  const fb = await getMessaging();
  if (!fb) return false;

  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await fb.getToken(fb.messaging, { vapidKey });
    if (token) await authService.registerFcmToken(token);

    fb.onMessage(fb.messaging, (payload) => {
      const title = payload.notification?.title || 'GATE 2027';
      const body = payload.notification?.body || '';
      if (onForegroundMessage) onForegroundMessage(title, body);
      else new Notification(title, { body, icon: '/favicon.ico' });
    });
    return true;
  } catch {
    return false;
  }
}
