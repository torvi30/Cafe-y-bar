import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Inicialización flexible: si no hay credencial física, inicializa con defaults o mock de entorno
const serviceAccountKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './serviceAccountKey.json';
const resolvedPath = path.resolve(process.cwd(), serviceAccountKeyPath);

if (!admin.apps.length) {
  if (fs.existsSync(resolvedPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin inicializado con serviceAccountKey');
  } else {
    // Modo de desarrollo/emulador
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'demo-nightlife-pos',
    });
    console.log('ℹ️ Firebase Admin inicializado en modo default/emulador');
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;

