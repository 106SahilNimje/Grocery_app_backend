require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp", // Just in case
    "gemini-pro"
];

async function probe() {
    console.log("Probing models...");
    for (const modelName of candidates) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const resp = await ai.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts: [{ text: "hi" }] }],
            });
            console.log("SUCCESS! ✅");
            console.log("Response snippet:", resp.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 20));
            // Found one, we can stop or continue to see all options
            // let's continue to see all working ones
        } catch (e) {
            console.log(`FAILED ❌ (${e.message.includes('404') ? '404 Not Found' : e.message})`);
        }
    }
}

probe();
