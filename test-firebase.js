const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

try {
    console.log("Initializing Firebase Admin...");
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    console.log("Firebase initialized.");

    const db = admin.firestore();
    console.log("Attempting to write to Firestore...");

    // Attempt a write
    db.collection("test_connection").doc("ping").set({
        message: "Hello from backend",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        console.log("Successfully wrote to Firestore!");
        console.log("Connection verified.");
        process.exit(0);
    }).catch((error) => {
        console.error("Error writing to Firestore:", error);
        process.exit(1);
    });

} catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
}
