import express from "express"
import dotenv from "dotenv"
import multer from "multer"
import cors from "cors"
import fs from "node:fs"
import { GoogleGenAI } from "@google/genai"

dotenv.config()
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const app = express()
const upload = multer()
app.use(cors())
app.use(express.static("public"))

app.post("/ask", upload.single("img"), async (req, res) => {
    const image = req.file.buffer.toString("base64")
    const prompt = req.body.text

    const input = [
        {
            inlineData: {
                mimeType: "image/jpeg",
                data: image
            }
        },
        {
            text: prompt
        }
    ]

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: input
    })

    const reply = result.candidates[0].content.parts[0].text
    res.json({ reply })
})

app.listen(3000, () => console.log("Server running"))
