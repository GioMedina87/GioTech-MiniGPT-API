// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());



// ---- Google Custom Search helper ----
async function googleSearch(query) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error("Google Search error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const items = data.items || [];
  return items.slice(0, 3).map((item) => ({
    title: item.title,
    snippet: item.snippet,
    link: item.link,
  }));
}

// ---- /chat endpoint for GioTech mini GPT ----
// ---- Simple /chat endpoint WITHOUT Google Search ----
app.post("/chat", async (req, res) => {
  try {
    const userMessage = (req.body.message || "").trim();
    if (!userMessage) {
      return res.status(400).json({ error: "Message is required." });
    }

    const systemPrompt = `
You are GioTech Mini GPT, an assistant created by Gio.
Answer the user's questions clearly and helpfully.
If you don't know something, say you don't know instead of making it up.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 400,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response.";

    res.json({ reply });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Server error" });
  }
});


