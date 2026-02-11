require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-latest",
    "gemini-1.0-pro",
    "gemini-pro"
];

async function probe() {
    console.log("Starting Model Probe...");
    console.log("--------------------------------");

    for (const model of modelsToTest) {
        process.stdout.write(`Testing '${model}'... `);
        try {
            const resp = await ai.models.generateContent({
                model: model,
                contents: [{ role: "user", parts: [{ text: "hi" }] }],
            });
            console.log("✅ WORKING");
        } catch (e) {
            if (e.message.includes("404")) {
                console.log("❌ 404 Not Found");
            } else {
                console.log(`❌ Error: ${e.message.split('\n')[0]}`); // Print first line of error
            }
        }
    }
    console.log("--------------------------------");
    console.log("Probe Complete.");
}

probe();
