const composer = document.querySelector("#composer");
const promptInput = document.querySelector("#prompt");
const messages = document.querySelector("#messages");
const matPanel = document.querySelector(".mat-panel");
const centerEmpty = document.querySelector(".center-empty");
const spawnState = document.querySelector("#spawn-state");
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
const ANALYSIS_DELAY_RANGE = [1600, 2400];
const NORMAL_DELAY_RANGE = [900, 1400];

const shortcuts = {
  openMat: { ctrlKey: true, key: "m" },
  spawnDummies: { ctrlKey: true, key: "d" },
  shareMove: { ctrlKey: true, shiftKey: true, key: "s" },
  openInbox: { ctrlKey: true, shiftKey: true, key: "i" },
};

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

  sendMessage(text);
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

  sendAnalysisMessage(`Analyze ${item.dataset.attach.toLowerCase()}`);
  attachMenu.classList.remove("is-open");
  attachMenu.setAttribute("aria-hidden", "true");
});

shareMove.addEventListener("click", () => {
  toggleSharePopover();
});

communityToggle.addEventListener("click", () => {
  toggleDrawer();
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

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const inTypingField = target.closest("input, textarea");

  if (matchesShortcut(event, shortcuts.openMat)) {
    event.preventDefault();
    openMat();
    return;
  }

  if (!inTypingField && matchesShortcut(event, shortcuts.spawnDummies)) {
    event.preventDefault();
    spawnDummies();
    return;
  }

  if (matchesShortcut(event, shortcuts.shareMove)) {
    event.preventDefault();
    toggleSharePopover(true);
    return;
  }

  if (matchesShortcut(event, shortcuts.openInbox)) {
    event.preventDefault();
    toggleDrawer(true);
  }
});

function matchesShortcut(event, shortcut) {
  return event.key.toLowerCase() === shortcut.key
    && Boolean(event.ctrlKey || event.metaKey) === Boolean(shortcut.ctrlKey)
    && Boolean(event.shiftKey) === Boolean(shortcut.shiftKey)
    && Boolean(event.altKey) === Boolean(shortcut.altKey);
}

function openMat() {
  matPanel.classList.add("is-open");
  centerEmpty.classList.add("is-muted");
}

function spawnDummies() {
  openMat();
  spawnState.classList.add("is-active");
  spawnState.setAttribute("aria-hidden", "false");
}

function toggleSharePopover(forceOpen) {
  const open = forceOpen ?? !sharePopover.classList.contains("is-open");
  sharePopover.classList.toggle("is-open", open);
  sharePopover.setAttribute("aria-hidden", String(!open));
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  attachMenu.classList.remove("is-open");
  attachMenu.setAttribute("aria-hidden", "true");

  if (open) {
    shareRecipient.focus();
  }
}

function toggleDrawer(forceOpen) {
  const open = forceOpen ?? !drawer.classList.contains("is-open");
  drawer.classList.toggle("is-open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  sharePopover.classList.remove("is-open");
  sharePopover.setAttribute("aria-hidden", "true");
}

async function sendMessage(text) {
  addMessage(text, "user");
  promptInput.value = "";
  promptInput.blur();

  const thinking = addMessage("Thinking", "assistant thinking");
  const stopThinking = animateThinking(thinking);
  const thinkingMs = randomBetween(...(isAnalysisRequest(text) ? ANALYSIS_DELAY_RANGE : NORMAL_DELAY_RANGE));

  const [reply] = await Promise.all([
    getAssistantReply(text),
    wait(thinkingMs),
  ]);

  stopThinking();
  await typeAssistantMessage(thinking, reply);
}

async function sendAnalysisMessage(text) {
  const thinking = addMessage("Thinking", "assistant thinking");
  const stopThinking = animateThinking(thinking);
  const [reply] = await Promise.all([
    getAssistantReply(text),
    wait(randomBetween(...ANALYSIS_DELAY_RANGE)),
  ]);

  stopThinking();
  await typeAssistantMessage(thinking, reply);
}

function getAssistantReply(text) {
  const analysis = isAnalysisRequest(text);
  const reply = analysis
    ? "I'll treat that as source material, extract the key positions, identify grips and pressure points, then stage the move for simulation review."
    : "Got it. I would map the athletes first, then check the pressure direction before calling it legal.";

  return Promise.resolve(reply);
}

function isAnalysisRequest(text) {
  return /analy[sz]e|video|youtube|upload|attach|image|reference|import|breakdown|clip|match/i.test(text);
}

function animateThinking(element) {
  let tick = 0;
  element.textContent = "Thinking";

  const timer = window.setInterval(() => {
    tick = (tick + 1) % 4;
    element.textContent = `Thinking${tick ? ` ${".".repeat(tick)}` : ""}`;
  }, 340);

  return () => window.clearInterval(timer);
}

async function typeAssistantMessage(element, fullText) {
  element.className = "message assistant typing";
  element.textContent = "";

  const chars = Array.from(fullText);
  const long = chars.length > 220;
  const baseDelay = long ? 15 : 27;
  const chunkSize = long ? 2 : 1;
  const estimated = Math.ceil(chars.length / chunkSize) * baseDelay;
  const targetDuration = clamp(estimated, 700, long ? 9000 : 7000);
  const delay = targetDuration / Math.ceil(chars.length / chunkSize);

  let index = 0;

  while (index < chars.length) {
    index = Math.min(index + chunkSize, chars.length);
    element.textContent = chars.slice(0, index).join("");
    messages.scrollTop = messages.scrollHeight;
    await wait(delay + randomBetween(-4, 6));
  }

  element.textContent = fullText;
  element.className = "message assistant done";
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, ms));
  });
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function addMessage(text, type) {
  const message = document.createElement("p");
  message.className = `message ${type}`;
  message.textContent = text;
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
  return message;
}
