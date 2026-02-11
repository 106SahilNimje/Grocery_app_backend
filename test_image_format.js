require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Create a dummy 1x1 pixel JPEG structure in base64
// This is a minimal valid JPEG header
const minimalJpeg = "MO/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/DT/2Q==";

async function testImageFormat() {
    console.log("Testing CamelCase (inlineData)...");
    try {
        const resp = await ai.models.generateContent({
            model: "gemini-1.5-flash-latest",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "What is this?" },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: minimalJpeg,
                            },
                        },
                    ],
                },
            ],
        });
        console.log("CamelCase SUCCESS");
    } catch (error) {
        console.error("CamelCase Failed:", error.message);
    }

    console.log("\nTesting SnakeCase (inline_data)...");
    try {
        const resp = await ai.models.generateContent({
            model: "gemini-1.5-flash-latest",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "What is this?" },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: minimalJpeg,
                            },
                        },
                    ],
                },
            ],
        });
        console.log("SnakeCase SUCCESS");
    } catch (error) {
        console.error("SnakeCase Failed:", error.message);
    }
}

testImageFormat();
