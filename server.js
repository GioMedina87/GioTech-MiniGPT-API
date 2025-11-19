import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client (2024 format)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat route
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are GioTech MiniGPT." },
        { role: "user", content: userMessage }
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

// Render requires using process.env.PORT only
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});



