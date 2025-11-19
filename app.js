const API_URL = "https://giotech-mini-gpt.onrender.com/chat";

const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const statusPill = document.getElementById("status-pill");

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

function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message bot";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const dots = document.createElement("div");
  dots.className = "typing";
  dots.innerHTML = "<span></span><span></span><span></span>";

  bubble.appendChild(dots);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return row;
}

function setStatus(ok, text) {
  const label = statusPill.querySelector(".status-text");
  if (!ok) {
    statusPill.classList.add("error");
    label.textContent = text || "API error";
  } else {
    statusPill.classList.remove("error");
    label.textContent = text || "API ready";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  // show user message
  addMessage(message, "user");
  input.value = "";

  // UI state
  sendBtn.disabled = true;
  setStatus(true, "Talking to Medina OpenAI…");

  const typingRow = addTypingIndicator();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    // remove typing
    messagesEl.removeChild(typingRow);

    if (!res.ok || !data.reply) {
      console.error("API error:", data);
      setStatus(false, "API error – check console");
      addMessage("Hmm, something went wrong talking to the API.", "bot");
      return;
    }

    setStatus(true, "API ready");
    addMessage(data.reply, "bot");
  } catch (err) {
    console.error("Network error:", err);
    setStatus(false, "Connection error");
    messagesEl.removeChild(typingRow);
    addMessage("I couldn't reach the GioTech API. Is the server running?", "bot");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});
