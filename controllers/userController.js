const { db } = require("../config/firebase");

exports.saveAddress = async (req, res) => {
    const { uid, address } = req.body;

    if (!uid || !address) {
        return res.status(400).json({ error: "Missing uid or address" });
    }

    try {
        await db.collection("users").doc(uid).set({ address }, { merge: true });
        res.status(200).json({ message: "Address saved successfully" });
    } catch (error) {
        console.error("Error saving address:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAddress = async (req, res) => {
    const { uid } = req.params;

    if (!uid) {
        return res.status(400).json({ error: "Missing uid" });
    }

    try {
        const doc = await db.collection("users").doc(uid).get();
        if (!doc.exists) {
            return res.status(404).json({ error: "User not found" });
        }
        const data = doc.data();
        res.status(200).json({ address: data.address || null });
    } catch (error) {
        console.error("Error fetching address:", error);
        res.status(500).json({ error: error.message });
    }
};
