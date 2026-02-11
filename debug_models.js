require('dotenv').config();

// Debug script to list models using raw fetch (bypassing SDK quirks)
// This will tell us exactly what models are available for this API key.

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log("Checking available models for API Key...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
        } else if (data.models) {
            console.log("Successfully retrieved models. Filtering for 'flash' and 'pro':");
            const relevant = data.models
                .filter(m => m.name.includes('flash') || m.name.includes('pro'))
                .map(m => ` - ${m.name.replace('models/', '')} (${m.supportedGenerationMethods.join(', ')})`);

            console.log(relevant.join('\n'));
        } else {
            console.log("Unexpected response format:", data);
        }
    } catch (error) {
        console.error("Network/System Error:", error.message);
    }
}

listModels();
