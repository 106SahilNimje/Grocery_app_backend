require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function testFix() {
    console.log("Testing gemini-1.5-flash-latest...");
    try {
        const resp = await ai.models.generateContent({
            model: "gemini-1.5-flash-latest",
            contents: [
                {
                    role: "user",
                    parts: [{ text: "Hello Gemini" }],
                },
            ],
        });

        console.log("SUCCESS with latest! Response:");
        console.log(resp.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("Latest failed:", error.message);

        console.log("\nTesting gemini-1.5-flash-001...");
        try {
            const resp2 = await ai.models.generateContent({
                model: "gemini-1.5-flash-001",
                contents: [{ role: "user", parts: [{ text: "Hello" }] }],
            });
            console.log("SUCCESS with 001! Response:");
            console.log(resp2.candidates[0].content.parts[0].text);
        } catch (err2) {
            console.error("001 failed:", err2.message);
        }
    }
}

testFix();
