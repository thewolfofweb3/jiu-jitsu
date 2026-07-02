const composer = document.querySelector("#composer");
const promptInput = document.querySelector("#prompt");
const messages = document.querySelector("#messages");
const attachToggle = document.querySelector("#attach-toggle");
const attachMenu = document.querySelector("#attach-menu");
const voiceToggle = document.querySelector("#voice-toggle");
const shareMove = document.querySelector("#share-move");
const sharePopover = document.querySelector("#share-popover");
const shareRecipient = document.querySelector("#share-recipient");
const shareNote = document.querySelector("#share-note");
const sendMove = document.querySelector("#send-move");
const shareStatus = document.querySelector("#share-status");
const communityToggle = document.querySelector("#community-toggle");
const drawer = document.querySelector("#community-drawer");
const drawerTabs = document.querySelector(".drawer-tabs");
const drawerContent = document.querySelector("#drawer-content");

const drawerCopy = {
  inbox: {
    kicker: "Inbox",
    title: "No move packages yet",
    body: "Shared moves will appear here with positions, grips, pressure points, timing steps, AI notes, simulation state, and source references.",
  },
  friends: {
    kicker: "Friends",
    title: "Training circle",
    body: "Send a move package to a coach, teammate, or drilling partner without exposing the rest of your workspace.",
  },
  community: {
    kicker: "Community",
    title: "Public move feed",
    body: "Publish a move package for review, remixing, or discussion once the simulation state is ready.",
  },
  saved: {
    kicker: "Saved",
    title: "Saved packages",
    body: "Pinned move packages and imported references will live here for later study.",
  },
};

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

  const pending = addMessage("Thinking...", "assistant thinking");
  window.setTimeout(() => {
    pending.className = "message assistant";
    pending.textContent = "Got it. I would map the athletes first, then check the pressure direction before calling it legal.";
  }, 180);
});

attachToggle.addEventListener("click", () => {
  const open = attachMenu.classList.toggle("is-open");
  attachMenu.setAttribute("aria-hidden", String(!open));
});

voiceToggle.addEventListener("click", () => {
  const listening = voiceToggle.classList.toggle("is-listening");
  voiceToggle.setAttribute("aria-label", listening ? "Voice input listening" : "Voice input");
});

attachMenu.addEventListener("click", (event) => {
  const item = event.target.closest("button");

  if (!item) {
    return;
  }

  addMessage(`Analyzing ${item.dataset.attach.toLowerCase()}...`, "assistant thinking");
  attachMenu.classList.remove("is-open");
  attachMenu.setAttribute("aria-hidden", "true");
});

shareMove.addEventListener("click", () => {
  const open = sharePopover.classList.toggle("is-open");
  sharePopover.setAttribute("aria-hidden", String(!open));
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  attachMenu.classList.remove("is-open");
  attachMenu.setAttribute("aria-hidden", "true");

  if (open) {
    shareRecipient.focus();
  }
});

communityToggle.addEventListener("click", () => {
  const open = drawer.classList.toggle("is-open");
  drawer.setAttribute("aria-hidden", String(!open));
  sharePopover.classList.remove("is-open");
  sharePopover.setAttribute("aria-hidden", "true");
});

drawerTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("button");

  if (!tab) {
    return;
  }

  drawerTabs.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button === tab);
  });

  const copy = drawerCopy[tab.dataset.tab];
  drawerContent.innerHTML = `
    <p class="drawer-kicker">${copy.kicker}</p>
    <h2>${copy.title}</h2>
    <p>${copy.body}</p>
  `;
});

sendMove.addEventListener("click", () => {
  const recipient = shareRecipient.value.trim();

  if (!recipient) {
    shareStatus.textContent = "Add a recipient name, username, or email.";
    shareRecipient.focus();
    return;
  }

  shareStatus.textContent = `Move package staged for ${recipient}. Email notification can be sent when accounts are connected.`;
  shareNote.value = "";
});

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!sharePopover.contains(target) && !shareMove.contains(target)) {
    sharePopover.classList.remove("is-open");
    sharePopover.setAttribute("aria-hidden", "true");
  }

  if (!drawer.contains(target) && !communityToggle.contains(target)) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }

  if (!attachMenu.contains(target) && !attachToggle.contains(target)) {
    attachMenu.classList.remove("is-open");
    attachMenu.setAttribute("aria-hidden", "true");
  }
});

function addMessage(text, type) {
  const message = document.createElement("p");
  message.className = `message ${type}`;
  message.textContent = text;
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
  return message;
}
