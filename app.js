const composer = document.querySelector("#composer");
const promptInput = document.querySelector("#prompt");
const messages = document.querySelector("#messages");
const newChat = document.querySelector("#new-chat");
const historyToggle = document.querySelector("#history-toggle");
const historyPanel = document.querySelector("#history-panel");
const voiceToggle = document.querySelector("#voice-toggle");

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = promptInput.value.trim();

  if (!text) {
    promptInput.focus();
    return;
  }

  addMessage(text, "user");
  promptInput.value = "";
  promptInput.blur();

  window.setTimeout(() => {
    addMessage("Got it. I would map the athletes first, then check the pressure direction before calling it legal.", "assistant");
  }, 180);
});

newChat.addEventListener("click", () => {
  messages.replaceChildren();
  promptInput.value = "";
  promptInput.focus();
  historyPanel.classList.remove("is-open");
  historyPanel.setAttribute("aria-hidden", "true");
});

historyToggle.addEventListener("click", () => {
  const open = historyPanel.classList.toggle("is-open");
  historyPanel.setAttribute("aria-hidden", String(!open));
});

voiceToggle.addEventListener("click", () => {
  const listening = voiceToggle.classList.toggle("is-listening");
  voiceToggle.setAttribute("aria-label", listening ? "Voice input listening" : "Voice input");
});

historyPanel.addEventListener("click", (event) => {
  const item = event.target.closest("button");

  if (!item) {
    return;
  }

  promptInput.value = item.textContent.trim();
  historyPanel.classList.remove("is-open");
  historyPanel.setAttribute("aria-hidden", "true");
  promptInput.focus();
});

function addMessage(text, type) {
  const message = document.createElement("p");
  message.className = `message ${type}`;
  message.textContent = text;
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}
