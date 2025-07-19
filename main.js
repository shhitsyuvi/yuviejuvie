import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
const upload = multer();
app.use(cors());
app.use(express.static("public"));

app.post("/ask", upload.single("img"), async (req, res) => {
    if (!req.file || !req.body.text) {
        return res.status(400).json({ error: "Missing image or prompt." });
    }

    const mimeType = req.file.mimetype || "image/jpeg";
    const image = req.file.buffer.toString("base64");
    const prompt = req.body.text;

    const input = [
        {
            inlineData: {
                mimeType,
                data: image,
            },
        },
        {
            text: prompt,
        },
    ];

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: input,
        });

        const reply = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            return res.status(500).json({ error: "Empty AI response." });
        }

        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: "AI error", details: err.message });
    }
});

app.listen(3000, () => console.log("3000"));
