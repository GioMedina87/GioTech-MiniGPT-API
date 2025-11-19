/* ==========================
   GioTech MiniGPT – Frontend
   ========================== */

const API_URL = "https://giotech-mini-gpt.onrender.com/chat";

const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const statusPill = document.getElementById("status-pill");
const statusText = document.getElementById("status-text");
const suggestionButtons = document.querySelectorAll(".suggestion-btn");

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

function setStatus(isReady, text) {
  statusPill.classList.toggle("ready", isReady);
  statusPill.classList.toggle("connecting", !isReady);
  statusText.textContent = text;
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "message bot";
  row.id = "typing-row";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const dots = document.createElement("div");
  dots.className = "typing-dots";
  dots.innerHTML = "<span></span><span></span><span></span>";

  bubble.appendChild(dots);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const row = document.getElementById("typing-row");
  if (row && row.parentNode) {
    row.parentNode.removeChild(row);
  }
}

/* ----- Form submit ----- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  sendBtn.disabled = true;

  showTyping();
  setStatus(false, "Talking to Medina OpenAI…");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    removeTyping();

    if (!res.ok) {
      console.error("API error:", res.status);
      setStatus(false, "API error – check backend");
      addMessage("Hmm, something went wrong talking to the API.", "bot");
      return;
    }

    const data = await res.json();
    const reply = data.reply || "I couldn't generate a response.";
    setStatus(true, "API ready");
    addMessage(reply, "bot");
  } catch (err) {
    console.error("Network error:", err);
    removeTyping();
    setStatus(false, "Connection error");
    addMessage(
      "I couldn't reach the GioTech API. Is the backend awake on Render?",
      "bot"
    );
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});

/* ----- Suggestion button (auto-send) ----- */

suggestionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = btn.getAttribute("data-prompt") || "";
    if (!prompt) return;

    input.value = prompt;
    // Auto-submit as if you typed it
    form.requestSubmit();
  });
});

/* ----- Boot screen animation ----- */

window.addEventListener("load", () => {
  const boot = document.getElementById("boot-screen");
  const app = document.getElementById("app-shell");

  const steps = [
    "Starting core systems...",
    "Linking to OpenAI...",
    "Warming up Render server...",
    "Preparing chat interface...",
  ];

  steps.forEach((msg, i) => {
    const line = document.getElementById(`boot-line-${i + 1}`);
    if (!line) return;

    setTimeout(() => {
      line.textContent = msg;
      line.classList.add("active");
    }, i * 800);
  });

  // Show main app after ~3.5s
  setTimeout(() => {
    boot.classList.add("hidden");
    app.hidden = false;
    input.focus();
    setStatus(false, "Connecting…");
  }, 3500);
});




