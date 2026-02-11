const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Fix private key newlines if they are double-escaped
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const email = "admin@smartgrocery.com";
const password = "admin123";

async function manageUser() {
    try {
        console.log(`Checking for user: ${email}...`);
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            console.log(`User found: ${userRecord.uid}`);

            console.log("Updating password...");
            await admin.auth().updateUser(userRecord.uid, {
                password: password
            });
            console.log(`Password updated to: ${password}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log("User not found. Creating user...");
                const userRecord = await admin.auth().createUser({
                    email: email,
                    password: password,
                    displayName: "Admin User"
                });
                console.log(`User created with UID: ${userRecord.uid}`);
            } else {
                throw error;
            }
        }
        console.log("Done.");
        process.exit(0);
    } catch (error) {
        console.error("Error managing user:", error);
        process.exit(1);
    }
}

manageUser();
