/* ===========================
   GioTech MiniGPT - Frontend
   =========================== */

const API_BASE = "https://giotech-mini-gpt.onrender.com";

const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const weatherBtn = document.getElementById("weather-btn");
const statusPill = document.getElementById("status-pill");
const statusText = document.getElementById("status-text");
const bootScreen = document.getElementById("boot-screen");
const appShell = document.getElementById("app-shell");
const bootLines = [
  document.getElementById("boot-line-1"),
  document.getElementById("boot-line-2"),
  document.getElementById("boot-line-3"),
  document.getElementById("boot-line-4"),
];
const bootBarFill = document.querySelector(".boot-bar-fill");

/* ----- Helpers ----- */

function addMessage(text, sender = "bot") {
  const row = document.createElement("div");
  row.className = `message ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setStatus(mode, text) {
  statusPill.classList.remove("ready", "error");
  if (mode === "ready") statusPill.classList.add("ready");
  if (mode === "error") statusPill.classList.add("error");
  statusText.textContent = text;
}

function setBusy(isBusy) {
  sendBtn.disabled = isBusy;
  weatherBtn.disabled = isBusy;
  input.disabled = isBusy;
}

/* ----- Boot sequence ----- */

function runBootSequence() {
  let step = 0;
  const totalSteps = bootLines.length;

  bootLines.forEach((l) => l.classList.remove("active"));
  bootBarFill.style.width = "0%";

  const interval = setInterval(() => {
    if (step < totalSteps) {
      bootLines.forEach((l, idx) => {
        l.classList.toggle("active", idx === step);
      });
      const pct = ((step + 1) / totalSteps) * 100;
      bootBarFill.style.width = `${pct}%`;
      step += 1;
    } else {
      clearInterval(interval);
      // quick delay then show app
      setTimeout(() => {
        bootScreen.style.display = "none";
        appShell.hidden = false;
        setStatus("ready", "API ready");
      }, 400);
    }
  }, 600);
}

/* ----- API calls ----- */

async function callChatAPI(message) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}

async function callWeatherAPI() {
  // You can change these to another default city if you want
  const payload = {
    city: "San Jose",
    state: "California",
    country: "USA",
  };

  const res = await fetch(`${API_BASE}/weather`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}

/* ----- Form submit ----- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  setBusy(true);
  setStatus("ready", "Talking to MiniGPT...");

  try {
    const reply = await callChatAPI(text);
    addMessage(reply, "bot");
    setStatus("ready", "API ready");
  } catch (err) {
    console.error(err);
    addMessage(
      "I couldn't reach the GioTech API. Please check that the backend is awake on Render.",
      "bot"
    );
    setStatus("error", "Connection error");
  } finally {
    setBusy(false);
  }
});

/* ----- Weather button ----- */

weatherBtn.addEventListener("click", async () => {
  const prompt = weatherBtn.dataset.prompt;
  addMessage(prompt, "user");

  setBusy(true);
  setStatus("ready", "Checking date, time & weather...");

  try {
    const reply = await callWeatherAPI();
    addMessage(reply, "bot");
    setStatus("ready", "API ready");
  } catch (err) {
    console.error(err);
    addMessage(
      "I'm having trouble fetching live weather right now. You can still ask me other questions!",
      "bot"
    );
    setStatus("error", "Weather error");
  } finally {
    setBusy(false);
  }
});

/* ----- Init ----- */

document.addEventListener("DOMContentLoaded", () => {
  runBootSequence();
});



