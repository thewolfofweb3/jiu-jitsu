const composer = document.querySelector("#composer");
const promptInput = document.querySelector("#prompt");

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  promptInput.blur();
});
