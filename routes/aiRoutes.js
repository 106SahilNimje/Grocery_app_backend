const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

const upload = multer({ storage: multer.memoryStorage() });

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Endpoint 1: Extract ONLY raw text from image (OCR)
router.post("/ocr-image", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        const prompt = `Extract all written or printed text from this grocery list image. 
        It could be in English, Hindi, or Marathi. 
        Return ONLY the extracted text as a plain string. 
        Do not format it, just give me the raw text.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: req.file.mimetype,
                                data: req.file.buffer.toString("base64"),
                            }
                        }
                    ]
                }
            ]
        });

        const text = response.candidates[0].content.parts[0].text;
        console.log("Raw OCR Response:", text);
        res.json({ raw_text: text.trim() });
    } catch (error) {
        console.error("OCR Error:", error);
        res.status(500).json({ error: "Failed to extract text from image", details: error.message });
    }
});

// Endpoint 2: Analyze text to extract structured items
router.post("/analyze-text", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "No text provided" });
        }

        const prompt = `
            Analyze this grocery list text.
            Identify grocery items and their quantities.
            Return a JSON object with one field:
               - "items": An array of objects, each with "item_name", "quantity", and "unit".
            
            Example Format:
            {
              "items": [
                {"item_name": "Milk", "quantity": "2", "unit": "packets"},
                {"item_name": "Aata", "quantity": "5", "unit": "kg"},
                {"item_name": "Sugar", "quantity": "1", "unit": "kg"}
              ]
            }
            
            Text to analyze: "${text}"
            
            Return ONLY the raw JSON.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const aiText = response.candidates[0].content.parts[0].text;
        console.log("Analysis Response:", aiText);

        const cleanJson = aiText.replace(/```json|```/g, "").trim();

        try {
            const data = JSON.parse(cleanJson);
            res.json(data);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            res.status(500).json({ error: "Failed to parse analysis result" });
        }
    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze text", details: error.message });
    }
});

module.exports = router;
