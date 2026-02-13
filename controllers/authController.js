const { admin, db } = require("../config/firebase");
const axios = require("axios");
const nodemailer = require("nodemailer");
const User = require("../models/User"); // Import User model

// Nodemailer Transporter
// NOTE: Use environment variables for real credentials
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.signup = async (req, res) => {
    const { email, password, displayName } = req.body;
    try {
        // DIRECT SIGNUP - NO OTP VERIFICATION

        // Proceed with signup
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });

        // Create user profile in Firestore (optional but recommended)
        await db.collection("users").doc(userRecord.uid).set({
            email,
            displayName,
            createdAt: new Date().toISOString(),
        });

        // Create user in MongoDB
        const newUser = new User({
            name: displayName || email.split('@')[0],
            email: email,
            password: "managed_by_firebase", // Placeholder since auth is via Firebase
            createdAt: new Date(),
        });
        await newUser.save();

        res.status(201).json({
            message: "User created successfully",
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            _id: newUser._id
        });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(400).json({ error: error.message });
    }
};

exports.sendSignupOTP = async (req, res) => {
    const { email } = req.body;
    try {
        // Check if user already exists in Firebase
        try {
            await admin.auth().getUserByEmail(email);
            return res.status(400).json({ error: "Email already registered" });
        } catch (error) {
            // User not found in Firebase, proceed
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP in Firestore
        await db.collection("signup_otps").doc(email).set({
            otp,
            expiresAt,
        });

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your email - Smart Grocery Market",
            text: `Your verification code for Smart Grocery Market is: ${otp}. It expires in 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Authenticate using Firebase REST API
        const apiKey = process.env.FIREBASE_API_KEY;
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

        const response = await axios.post(url, {
            email,
            password,
            returnSecureToken: true,
        });

        // Fetch MongoDB user ID
        let user = await User.findOne({ email });

        if (!user) {
            console.log("User missing in MongoDB, creating now...");
            // Auto-create user in MongoDB if missing (Sync with Firebase)
            user = new User({
                name: response.data.displayName || email.split('@')[0],
                email: email,
                password: "managed_by_firebase",
                createdAt: new Date(),
            });
            await user.save();
        }

        res.status(200).json({
            ...response.data,
            _id: user._id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        res.status(400).json({ error: error.response?.data?.error?.message || error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log(`[Auth] Forgot Password requested for: ${email}`);

    try {
        if (!email) {
            console.log("[Auth] Error: Email is missing in request body");
            return res.status(400).json({ error: "Email is required" });
        }

        // Verify user exists
        console.log(`[Auth] Checking if user ${email} exists in Firebase...`);
        await admin.auth().getUserByEmail(email);
        console.log(`[Auth] User ${email} found in Firebase`);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        console.log(`[Auth] Generated OTP for ${email}`);

        // Store OTP in Firestore
        console.log(`[Auth] Saving OTP to Firestore for ${email}...`);
        await db.collection("otps").doc(email).set({
            otp,
            expiresAt,
        });
        console.log(`[Auth] OTP saved to Firestore`);

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset OTP - Smart Grocery Market",
            text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`,
        };

        console.log(`[Auth] Sending email to ${email}...`);
        await transporter.sendMail(mailOptions);
        console.log(`[Auth] Email sent successfully to ${email}`);

        res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
        console.error(`[Auth] Forgot Password Error for ${email}:`, error);

        if (error.code === 'auth/user-not-found') {
            console.log(`[Auth] User ${email} not found in Firebase`);
            return res.status(404).json({ error: "User not found" });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const doc = await db.collection("otps").doc(email).get();

        if (!doc.exists) {
            return res.status(400).json({ error: "OTP not found or expired" });
        }

        const data = doc.data();
        if (data.otp !== otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        if (Date.now() > data.expiresAt) {
            return res.status(400).json({ error: "OTP expired" });
        }

        res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        // Re-verify OTP one last time for security before changing password
        const doc = await db.collection("otps").doc(email).get();

        if (!doc.exists) {
            return res.status(400).json({ error: "OTP session invalid" });
        }
        const data = doc.data();
        if (data.otp !== otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, {
            password: newPassword,
        });

        // Delete used OTP
        await db.collection("otps").doc(email).delete();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const email = decodedToken.email;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Auth Error:", error);
        res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};
