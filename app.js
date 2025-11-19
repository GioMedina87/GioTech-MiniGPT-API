/* ===========================
   GioTech MiniGPT – Frontend
=========================== */

const API_URL = "https://giotech-mini-gpt.onrender.com/chat";

const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const statusPill = document.getElementById("status-pill");
const statusDot = statusPill.querySelector(".status-dot");
const statusText = statusPill.querySelector(".status-text");

/* Quick suggestion buttons -> fill input */
document.querySelectorAll(".suggestion-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = btn.dataset.prompt || btn.textContent.trim();
    input.value = prompt;
    input.focus();
  });
});

/* Add a message bubble */
function addMessage(text, sender = "bot") {
  const row = document.createElement("div");
  row.className = `message ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

/* Typing indicator */
function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message bot";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = "…";

  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

/* Status pill updates */
function setStatus(ok, text) {
  statusDot.style.background = ok ? "#22c55e" : "#f97373";
  statusDot.style.boxShadow = ok
    ? "0 0 7px rgba(34,197,94,0.9)"
    : "0 0 7px rgba(248,113,113,0.9)";
  if (text) statusText.textContent = text;
}

/* Form submit -> talk to backend */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  input.value = "";
  sendBtn.disabled = true;
  setStatus(true, "Talking to Medina OpenAI…");

  const typingRow = addTypingIndicator();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json().catch(() => null);

    messagesEl.removeChild(typingRow);

    if (!res.ok || !data || !data.reply) {
      console.error("API error:", data);
      setStatus(false, "API error – check backend");
      addMessage(
        "Hmm, something went wrong talking to the GioTech API. Please try again in a moment.",
        "bot"
      );
      return;
    }

    setStatus(true, "API ready");
    addMessage(data.reply, "bot");
  } catch (err) {
    console.error("Network error:", err);
    messagesEl.removeChild(typingRow);
    setStatus(false, "Connection error");
    addMessage(
      "I couldn’t reach the GioTech API. The Render server might still be waking up or offline.",
      "bot"
    );
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});

/* ===========================
   Boot Screen Logic
=========================== */

async function warmupBackend() {
  try {
    // Light ping to wake up Render/OpenAI
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "warmup" }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.reply) {
      return true;
    }
  } catch (err) {
    console.warn("Warmup ping failed (probably just sleeping server):", err);
  }
  return false;
}

window.addEventListener("DOMContentLoaded", async () => {
  const bootScreen = document.getElementById("boot-screen");
  const appShell = document.querySelector(".app-shell");
  const bootLines = [
    document.getElementById("boot-line-1"),
    document.getElementById("boot-line-2"),
    document.getElementById("boot-line-3"),
    document.getElementById("boot-line-4"),
  ];
  const barFill = document.querySelector(".boot-bar-fill");

  // Step text animation
  bootLines.forEach((line, i) => {
    setTimeout(() => {
      if (line) line.classList.add("active");
      // progress bar step
      if (barFill) {
        barFill.style.width = `${((i + 1) / bootLines.length) * 100}%`;
      }
    }, i * 1000);
  });

  // Start backend warmup in parallel
  let backendReady = false;
  warmupBackend().then((ok) => {
    backendReady = ok;
  });

  // After ~4.5s, fade out boot screen & show app
  setTimeout(() => {
    bootScreen.style.opacity = "0";
    bootScreen.style.transition = "opacity 0.6s ease";

    setTimeout(() => {
      bootScreen.classList.add("hidden");
      appShell.classList.remove("hidden");
      setStatus(
        backendReady,
        backendReady ? "API ready" : "Waiting for first response…"
      );
    }, 650);
  }, 4200);
});


