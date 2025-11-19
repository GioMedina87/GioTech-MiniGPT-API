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

// ---- (optional) Old Google Custom Search helper ----
// You can delete this whole function later if you want, it's not used now.
async function googleSearch(query) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  if (!apiKey || !cx) {
    console.warn("Missing GOOGLE_API_KEY or GOOGLE_CX");
    return [];
  }

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

// ---- Simple web search helper using SerpAPI ----
async function webSearch(query) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.warn("SERPAPI_KEY is missing");
    return "No web search available (missing SERPAPI_KEY).";
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("engine", "google");
  url.searchParams.set("api_key", apiKey);

  let res;
  try {
    res = await fetch(url.toString());
  } catch (err) {
    console.error("SerpAPI fetch error:", err);
    return "Web search failed.";
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("SerpAPI error:", res.status, text);
    return "Web search failed.";
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error("SerpAPI JSON error:", err);
    return "Web search failed.";
  }

  // Take a few top results and squash into a short text snippet
  const snippets = [];
  const results = data.organic_results || [];
  for (const r of results.slice(0, 3)) {
    const title = r.title || "";
    const snippet = r.snippet || "";
    const link = r.link || "";
    snippets.push(`Title: ${title}\nSnippet: ${snippet}\nLink: ${link}`);
  }

  if (!snippets.length) {
    return "No web results found.";
  }

  return snippets.join("\n\n");
}

// ---- /chat endpoint for GioTech MiniGPT ----
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "";

    // 1) Try web search, but don't crash if it fails
    let webContext = "";
    try {
      webContext = await webSearch(userMessage);
    } catch (err) {
      console.warn("webSearch threw an error (ignored):", err.message);
      webContext = "";
    }

    // 2) Build system prompt
    const baseSystemPrompt =
      "You are GioTech MiniGPT, a helpful HVAC/tech assistant created by Gio Medina. " +
      "Explain things clearly like you're talking to a friend who's new to the topic.";

    const systemPrompt = webContext
      ? `${baseSystemPrompt}\n\nYou also have the following live web search results. Use them to answer the question when relevant:\n\n${webContext}`
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
      completion.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response.";

    res.json({ reply });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`GioTech mini GPT backend running on port ${port}`);
});




