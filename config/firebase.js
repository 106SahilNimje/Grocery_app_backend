const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

// Fix private key newlines if they are double-escaped
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

// Check if app is already initialized to avoid "default app already defined" error
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

module.exports = { admin, db };
