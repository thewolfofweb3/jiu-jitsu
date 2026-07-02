const composer = document.querySelector("#composer");
const promptInput = document.querySelector("#prompt");
const messages = document.querySelector("#messages");
const attachToggle = document.querySelector("#attach-toggle");
const attachMenu = document.querySelector("#attach-menu");
const voiceToggle = document.querySelector("#voice-toggle");
const shareMove = document.querySelector("#share-move");
const communityToggle = document.querySelector("#community-toggle");
const drawer = document.querySelector("#community-drawer");
const drawerClose = document.querySelector("#drawer-close");
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

  window.setTimeout(() => {
    addMessage("Got it. I would map the athletes first, then check the pressure direction before calling it legal.", "assistant");
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

  addMessage(`${item.dataset.attach} queued for move analysis.`, "assistant");
  attachMenu.classList.remove("is-open");
  attachMenu.setAttribute("aria-hidden", "true");
});

shareMove.addEventListener("click", () => {
  const packageSummary = [
    "Move package ready:",
    "move name, dummy positions, grips, pressure points, timing steps, AI notes, simulation state, optional source video/reference.",
  ].join(" ");

  addMessage(packageSummary, "assistant");
});

communityToggle.addEventListener("click", () => {
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
});

drawerClose.addEventListener("click", () => {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
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

function addMessage(text, type) {
  const message = document.createElement("p");
  message.className = `message ${type}`;
  message.textContent = text;
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}
