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
    const userMessage = req.body.message || "";

    // 1) Try web search, but don't crash if it fails
    let webContext = null;
    try {
      webContext = await googleSearch(userMessage);
    } catch (err) {
      console.warn("googleSearch threw an error (ignored):", err.message);
    }

    // 2) Build system prompt
    const baseSystemPrompt =
      "You are GioTech MiniGPT, a helpful HVAC/tech assistant created by Gio Medina. " +
      "Explain things clearly like you’re talking to a friend who’s new to the topic.";

    const systemPrompt = webContext
      ? `${baseSystemPrompt}\n\nYou also have the following live web search results. Use them to answer the question, but if they look wrong or incomplete, say so and answer as best you can.\n\n${webContext}`
      : baseSystemPrompt;

    // 3) Ask OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 400,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response.";

    res.json({ reply });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Server error" });
  }
});




