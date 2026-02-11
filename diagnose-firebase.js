const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

console.log("--- Firebase Diagnostic ---");
console.log("Project ID:", serviceAccount.project_id);
console.log("Client Email:", serviceAccount.client_email);
console.log("Private Key starts with:", serviceAccount.private_key ? serviceAccount.private_key.substring(0, 30) : "MISSING");
console.log("Private Key ends with:", serviceAccount.private_key ? serviceAccount.private_key.substring(serviceAccount.private_key.length - 30) : "MISSING");

const hasActualNewlines = serviceAccount.private_key && serviceAccount.private_key.includes('\n');
const hasLiteralSlashN = serviceAccount.private_key && serviceAccount.private_key.includes('\\n');

console.log("Has actual newlines:", hasActualNewlines);
console.log("Has literal \\n:", hasLiteralSlashN);

console.log("Current System Time:", new Date().toISOString());

// Test initialization
try {
    if (!admin.apps.length) {
        // Apply the same fix as in firebase.js
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    console.log("Firebase Admin initialized successfully in test.");

    // Check token fetching
    admin.credential.cert(serviceAccount).getAccessToken()
        .then(token => {
            console.log("Access token fetched successfully!");
            process.exit(0);
        })
        .catch(err => {
            console.error("Failed to fetch access token:", err.message);
            if (err.message.includes("invalid_grant")) {
                console.log("CONFIRMED: invalid_grant error.");
            }
            process.exit(1);
        });
} catch (err) {
    console.error("Initialization Failed:", err.message);
    process.exit(1);
}
