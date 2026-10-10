import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
  throw new Error('Firebase config is missing. Copy frontend/.env.example to frontend/.env and fill it in.')
}

// Only Firebase Auth is used. Everything else (services, files, questions) goes through the management API.
export const auth = getAuth(initializeApp(config))
