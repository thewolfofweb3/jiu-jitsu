const composer = document.querySelector("#composer");
const command = document.querySelector("#command");
const messages = document.querySelector("#messages");
const positionTitle = document.querySelector(".position-card h2");
const positionCopy = document.querySelector(".position-card p:last-child");
const statusLabel = document.querySelector(".status-strip strong");

const quickReads = [
  {
    title: "Foot lock review",
    copy: "Potential straight ankle setup detected. Add foot angle and knee line to scan for toe-hold or twisting pressure.",
    status: "Needs angle detail",
  },
  {
    title: "Grip map updated",
    copy: "Blue is controlling the foot. The next step is identifying whether pressure is linear through the ankle or rotational.",
    status: "Rule scan pending",
  },
  {
    title: "White belt caution",
    copy: "Sideways foot pressure may leave straight ankle territory. Slow it down and verify with a coach before live drilling.",
    status: "Caution flagged",
  },
];

let readIndex = 0;

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = command.value.trim();

  if (!text) {
    command.focus();
    return;
  }

  addMessage("You", text, "user");

  const read = quickReads[readIndex % quickReads.length];
  readIndex += 1;
  positionTitle.textContent = read.title;
  positionCopy.textContent = read.copy;
  statusLabel.textContent = read.status;

  window.setTimeout(() => {
    addMessage("AI", `${read.copy} I would ask: is the opponent's knee pinned, and are you bending the foot sideways or arching straight back?`, "assistant warning");
  }, 240);

  command.value = "";
});

function addMessage(author, text, type) {
  const article = document.createElement("article");
  article.className = `message ${type}`;

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.textContent = author;

  const body = document.createElement("div");
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  body.append(paragraph);

  article.append(avatar, body);
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
}
