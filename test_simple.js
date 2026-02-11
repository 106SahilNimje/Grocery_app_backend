const { GoogleGenAI } = require('@google/genai');
console.log('SDK imported successfully');
const ai = new GoogleGenAI({ apiKey: 'test' });
console.log('SDK initialized');
async function test() {
    console.log('Starting test...');
    try {
        // Just checking if models property exists
        console.log('Models property:', !!ai.models);
    } catch (e) {
        console.error('Test failed:', e.message);
    }
}
test();
