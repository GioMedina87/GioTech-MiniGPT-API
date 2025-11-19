// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ----- OpenAI client -----
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Optional SerpAPI key for web search
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;

// ----- Helpers -----

function stripWebPrefix(message) {
  if (!message) return "";
  const lower = message.toLowerCase();
  if (lower.startsWith("web:")) {
    return message.slice(4).trim();
  }
  if (lower.startsWith("search:")) {
    return message.slice(7).trim();
  }
  return message.trim();
}

async function runWebSearch(query) {
  if (!SERPAPI_API_KEY) {
    return (
      "Web search is not configured yet. Ask Gio to add a SERPAPI_API_KEY " +
      "environment variable on Render to enable live web search."
    );
  }

  const url =
    "https://serpapi.com/search.json?q=" +
    encodeURIComponent(query) +
    "&engine=google&num=5&api_key=" +
    SERPAPI_API_KEY;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`SerpAPI error: ${res.status}`);
  }

  const data = await res.json();
  const results = data.organic_results || [];
  if (!results.length) {
    return "I searched the web but couldn't find much for that query.";
  }

  const top = results.slice(0, 3);
  let summary = "Here’s a quick web summary:\n\n";
  top.forEach((r, idx) => {
    const title = r.title || "Result";
    const snippet = r.snippet || r.snippet_highlighted_words?.join(" ") || "";
    const link = r.link || "";
    summary += `${idx + 1}. ${title}\n`;
    if (snippet) summary += `   ${snippet}\n`;
    if (link) summary += `   ${link}\n\n`;
  });

  summary +=
    "Tip: Always double-check important info by opening the links directly.";

  return summary;
}

function formatDateTimeForSanJose() {
  const options = {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };

  const dt = new Date();
  const formatted = new Intl.DateTimeFormat("en-US", options).format(dt);
  return formatted;
}

// ----- Routes -----

// Simple health check
app.get("/", (req, res) => {
  res.send("GioTech MiniGPT backend is running. Use POST /chat or /weather.");
});

// Chat route (with optional web: search)
app.post("/chat", async (req, res) => {
  const userMessage = (req.body && req.body.message) || "";
  if (!userMessage) {
    return res.status(400).json({ error: "Missing message field" });
  }

  try {
    const trimmedQuery = stripWebPrefix(userMessage);
    const isWebSearch =
      userMessage.trim().toLowerCase().startsWith("web:") ||
      userMessage.trim().toLowerCase().startsWith("search:");

    // Web search path (SerpAPI)
    if (isWebSearch && trimmedQuery) {
      const webReply = await runWebSearch(trimmedQuery);
      return res.json({ reply: webReply });
    }

    // Normal OpenAI chat
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are GioTech MiniGPT, a helpful assistant for HVAC, BAS, " +
            "tech, and general questions. You DO NOT have direct internet " +
            "access. If the user asks for current weather, date, or time, " +
            "you can answer based on general knowledge, but also suggest " +
            "using the dedicated weather button in the UI for live info.",
        },
        { role: "user", content: userMessage },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

// Weather + date/time route (uses free wttr.in API)
app.post("/weather", async (req, res) => {
  try {
    const { city = "San Jose", state = "California", country = "USA" } =
      req.body || {};

    const locationStr = [city, state, country].filter(Boolean).join(", ");
    const locationQuery = encodeURIComponent(locationStr);

    const url = `https://wttr.in/${locationQuery}?format=j1`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather provider error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current_condition?.[0];

    if (!current) {
      throw new Error("No current weather data returned");
    }

    const tempF = current.temp_F;
    const desc = current.weatherDesc?.[0]?.value || "Unknown conditions";
    const feelsF = current.FeelsLikeF;
    const humidity = current.humidity;
    const wind = current.windspeedMiles;

    const formattedDT = formatDateTimeForSanJose();

    const reply =
      `Here’s the current snapshot for ${locationStr}:\n\n` +
      `📅 Local date & time: ${formattedDT}\n` +
      `🌡️ Temperature: ${tempF}°F (feels like ${feelsF}°F)\n` +
      `☁️ Conditions: ${desc}\n` +
      `💧 Humidity: ${humidity}%\n` +
      `💨 Wind: ${wind} mph\n\n` +
      "If you need more detail (hourly or weekly), try a dedicated weather app too.";

    res.json({ reply });
  } catch (error) {
    console.error("Weather Error:", error);
    res.status(500).json({
      error: "Weather request failed",
    });
  }
});

// Render requires using process.env.PORT only
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});


