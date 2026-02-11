require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function listModels() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // The new SDK might not have a direct listModels property on the instance in the same way.
        // Let's try a simple content generation to test if 'gemini-2.0-flash' works.
        try {
            const resp = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{ role: 'user', parts: [{ text: 'hi' }] }]
            });
            console.log('Gemini 1.5 Flash test success:', resp.candidates[0].content.parts[0].text);
        } catch (e) {
            console.error('Gemini 1.5 Flash failed:', e.message);
        }

        try {
            const resp = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: 'hi' }] }]
            });
            console.log('Gemini 2.0 Flash test success:', resp.candidates[0].content.parts[0].text);
        } catch (e) {
            console.error('Gemini 2.0 Flash failed:', e.message);
        }
    } catch (err) {
        console.error('Global Error:', err);
    }
}

listModels();
