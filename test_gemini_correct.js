require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function test() {
    console.log("Starting test with gemini-1.5-flash...");
    try {
        const resp = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [{ text: "Hello Gemini" }],
                },
            ],
        });

        console.log("Success! Response:");
        console.log(resp.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("Test Error:", error);
    }
}

test();
