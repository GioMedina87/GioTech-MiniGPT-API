/* ===========================
   GioTech MiniGPT - Frontend
=========================== */

const API_URL = "https://giotech-mini-gpt.onrender.com/chat";

const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const statusPill = document.getElementById("status-pill");

/* ===========================
   Add chat message
=========================== */
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

/* ===========================
   Status indicator
=========================== */
function setStatus(connected, text) {
    const dot = statusPill.querySelector(".status-dot");
    const t = statusPill.querySelector(".status-text");

    dot.style.background = connected ? "#27ff84" : "#ff4455";
    t.textContent = text;
}

/* ===========================
   Typing indicator
=========================== */
function typingIndicator() {
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

/* ===========================
   Form Submission
=========================== */
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userText = input.value.trim();
    if (!userText) return;

    addMessage(userText, "user");
    input.value = "";
    sendBtn.disabled = true;

    const typingRow = typingIndicator();

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userText })
        });

        if (!res.ok) throw new Error("API down");

        const data = await res.json();
        messagesEl.removeChild(typingRow);

        setStatus(true, "API ready");
        addMessage(data.reply, "bot");
    } catch (err) {
        messagesEl.removeChild(typingRow);
        setStatus(false, "Connection error");
        addMessage("Oops… I couldn't reach the GioTech API 😅", "bot");
    } finally {
        sendBtn.disabled = false;
        input.focus();
    }
});

/* ===========================
   BOOT SCREEN ANIMATION
=========================== */
window.addEventListener("DOMContentLoaded", () => {
    const steps = [
        "Starting core systems…",
        "Linking to OpenAI…",
        "Warming up Render server…",
        "Preparing chat interface…"
    ];

    steps.forEach((msg, i) => {
        setTimeout(() => {
            const line = document.getElementById(`boot-line-${i + 1}`);
            if (line) line.classList.add("active");

            // Fill loading bar
            document.querySelector(".boot-bar-fill").style.width = `${(i + 1) * 25}%`;
        }, i * 1200);
    });

    // Hide boot screen + show app after animation
    setTimeout(() => {
        document.getElementById("boot-screen").style.opacity = 0;

        setTimeout(() => {
            document.getElementById("boot-screen").style.display = "none";
            document.querySelector(".app-shell").classList.remove("hidden");
        }, 400);
    }, steps.length * 1200 + 500);
});

