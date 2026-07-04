const composer = document.querySelector("#composer");
const promptInput = document.querySelector("#prompt");
const messages = document.querySelector("#messages");
const matPanel = document.querySelector(".mat-panel");
const centerEmpty = document.querySelector(".center-empty");
const shortcutList = document.querySelector(".shortcuts");
const spawnState = document.querySelector("#spawn-state");
const matRoom = document.querySelector("#mat-room");
const threeRoom = document.querySelector("#three-room");
const threeStatus = document.querySelector("#three-status");
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
const DOJO_MODEL_URL = "assets/dojo-room.glb";
const THREE_VERSION = "0.166.1";
const LOAD_DISPLAY_MINIMUM_MS = 650;

const threeStage = {
  animationId: null,
  camera: null,
  controls: null,
  initialized: false,
  loadingPromise: null,
  renderer: null,
  scene: null,
};

const moveKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);

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

shortcutList.addEventListener("click", (event) => {
  const command = event.target.closest("[data-command]")?.dataset.command;

  if (command === "openMat") {
    openMat();
  }

  if (command === "spawnDummies") {
    spawnDummies();
  }

  if (command === "shareMove") {
    toggleSharePopover(true);
  }

  if (command === "openInbox") {
    toggleDrawer(true);
  }
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
  const key = event.key.toLowerCase();

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
    return;
  }

  if (!inTypingField && threeStage.controls && moveKeys.has(key)) {
    event.preventDefault();
    threeStage.controls.keys.add(key);
  }
});

document.addEventListener("keyup", (event) => {
  threeStage.controls?.keys.delete(event.key.toLowerCase());
});

window.addEventListener("load", () => {
  window.setTimeout(initThreeRoom, 700);
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
  matRoom.classList.add("is-open");
  matRoom.setAttribute("aria-hidden", "false");
  initThreeRoom();
}

function spawnDummies() {
  openMat();
  spawnState.classList.add("is-active");
  spawnState.setAttribute("aria-hidden", "false");
}

function initThreeRoom() {
  if (threeStage.initialized || threeStage.loadingPromise) {
    resizeThreeRoom();
    return;
  }

  threeStatus.textContent = `Loading ${DOJO_MODEL_URL}`;
  threeStatus.classList.remove("is-error");
  threeStage.loadingPromise = setupThreeRoom();
}

async function setupThreeRoom() {
  try {
    const startedAt = performance.now();
    const [
      THREE,
      { GLTFLoader },
    ] = await Promise.all([
      import(`https://esm.sh/three@${THREE_VERSION}`),
      import(`https://esm.sh/three@${THREE_VERSION}/examples/jsm/loaders/GLTFLoader.js`),
    ]);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.42;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    threeRoom.append(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "Interactive dojo room. Drag to look. Use W A S D or arrow keys to move.");
    renderer.domElement.setAttribute("role", "application");
    renderer.domElement.setAttribute("tabindex", "0");
    renderer.domElement.style.pointerEvents = "auto";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070707);

    const camera = new THREE.PerspectiveCamera(49, 1, 0.01, 200);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    scene.add(new THREE.HemisphereLight(0xf3eee7, 0x1b1b1b, 2.25));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.15);
    keyLight.position.set(-2.8, 5.8, 2.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdce8ff, 1.05);
    fillLight.position.set(3.5, 2.8, -3.2);
    scene.add(fillLight);

    threeStage.camera = camera;
    threeStage.renderer = renderer;
    threeStage.scene = scene;
    threeStage.initialized = true;

    resizeThreeRoom();
    await loadDojoModel({ THREE, GLTFLoader, scene, camera, renderer });
    threeStatus.textContent = "Loading dojo 100%";
    const elapsed = performance.now() - startedAt;
    await wait(Math.max(0, LOAD_DISPLAY_MINIMUM_MS - elapsed));
    threeStatus.textContent = "";
    animateThreeRoom();
    window.addEventListener("resize", resizeThreeRoom);
  } catch (error) {
    showThreeError("3D room failed to load. Add assets/dojo-room.glb and refresh.");
    console.error(error);
  }
}

function loadDojoModel({ THREE, GLTFLoader, scene, camera, renderer }) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      DOJO_MODEL_URL,
      (gltf) => {
        const model = gltf.scene;
        prepareDojoModel(THREE, model, renderer);
        scene.add(model);
        threeStage.controls = createDojoControls(THREE, model, camera, renderer.domElement);
        resolve(model);
      },
      (event) => {
        if (event.total > 0) {
          const actualPercent = Math.round((event.loaded / event.total) * 100);
          const percent = Math.min(99, Math.max(actualPercent, Math.round(actualPercent * 1.18)));
          threeStatus.textContent = `Loading dojo ${percent}%`;
        }
      },
      reject,
    );
  });
}

function prepareDojoModel(THREE, model, renderer) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = 8 / maxAxis;

  model.position.sub(center);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  model.traverse((object) => {
    if (!object.isMesh) {
      return;
    }

    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!material) {
        return;
      }

      material.roughness = Math.max(material.roughness ?? 0.75, 0.56);
      material.metalness = Math.min(material.metalness ?? 0.05, 0.18);
      material.envMapIntensity = Math.max(material.envMapIntensity ?? 0, 0.7);

      [material.map, material.normalMap, material.roughnessMap, material.aoMap].forEach((texture) => {
        if (!texture) {
          return;
        }

        texture.anisotropy = maxAnisotropy;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
      });
    });
  });
}

function frameDojoCamera(THREE, model, camera) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());

  const roomWidth = Math.max(size.x, 1);
  const roomDepth = Math.max(size.z, 1);
  const roomHeight = Math.max(size.y, 1);
  const viewSpan = Math.max(roomWidth, roomDepth);

  camera.near = 0.01;
  camera.far = Math.max(viewSpan * 6, 80);
  camera.position.set(
    center.x + roomWidth * 0.27,
    center.y + roomHeight * 0.085,
    center.z,
  );

  camera.lookAt(
    center.x - roomWidth * 0.36,
    center.y + roomHeight * 0.045,
    center.z,
  );

  camera.fov = 47;
  camera.updateProjectionMatrix();
}

function createDojoControls(THREE, model, camera, canvas) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const roomWidth = Math.max(size.x, 1);
  const roomDepth = Math.max(size.z, 1);
  const roomHeight = Math.max(size.y, 1);
  const baseYaw = Math.PI;
  const controls = {
    baseYaw,
    bounds: {
      minX: center.x - roomWidth * 0.38,
      maxX: center.x + roomWidth * 0.32,
      minZ: center.z - roomDepth * 0.29,
      maxZ: center.z + roomDepth * 0.29,
    },
    cameraHeight: center.y + roomHeight * 0.082,
    dragging: false,
    keys: new Set(),
    lastFrame: performance.now(),
    pitch: -0.06,
    pointerX: 0,
    pointerY: 0,
    speed: Math.max(roomWidth, roomDepth) * 0.32,
    Vector3: THREE.Vector3,
    yaw: baseYaw,
  };

  camera.near = 0.01;
  camera.far = Math.max(Math.max(roomWidth, roomDepth) * 6, 80);
  camera.fov = 47;
  camera.position.set(center.x + roomWidth * 0.24, controls.cameraHeight, center.z);
  camera.updateProjectionMatrix();
  applyDojoCamera(camera, controls);

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    controls.dragging = true;
    controls.pointerX = event.clientX;
    controls.pointerY = event.clientY;
    canvas.classList.add("is-dragging");
    canvas.focus();
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!controls.dragging) {
      return;
    }

    const dx = event.clientX - controls.pointerX;
    const dy = event.clientY - controls.pointerY;
    controls.pointerX = event.clientX;
    controls.pointerY = event.clientY;
    controls.yaw = clamp(controls.yaw - dx * 0.003, controls.baseYaw - 0.58, controls.baseYaw + 0.58);
    controls.pitch = clamp(controls.pitch - dy * 0.0024, -0.26, 0.11);
    applyDojoCamera(camera, controls);
  });

  canvas.addEventListener("pointerup", (event) => {
    controls.dragging = false;
    canvas.classList.remove("is-dragging");
    canvas.releasePointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointercancel", () => {
    controls.dragging = false;
    canvas.classList.remove("is-dragging");
  });

  return controls;
}

function updateDojoControls(camera, controls) {
  const now = performance.now();
  const delta = Math.min((now - controls.lastFrame) / 1000, 0.05);
  controls.lastFrame = now;

  if (!controls.keys.size) {
    return;
  }

  const forward = new controls.Vector3(Math.cos(controls.yaw), 0, Math.sin(controls.yaw)).normalize();
  const right = new controls.Vector3(-forward.z, 0, forward.x).normalize();
  const movement = new controls.Vector3();

  if (controls.keys.has("w") || controls.keys.has("arrowup")) {
    movement.add(forward);
  }

  if (controls.keys.has("s") || controls.keys.has("arrowdown")) {
    movement.sub(forward);
  }

  if (controls.keys.has("d") || controls.keys.has("arrowright")) {
    movement.add(right);
  }

  if (controls.keys.has("a") || controls.keys.has("arrowleft")) {
    movement.sub(right);
  }

  if (movement.lengthSq() === 0) {
    return;
  }

  movement.normalize().multiplyScalar(controls.speed * delta);
  camera.position.x = clamp(camera.position.x + movement.x, controls.bounds.minX, controls.bounds.maxX);
  camera.position.z = clamp(camera.position.z + movement.z, controls.bounds.minZ, controls.bounds.maxZ);
  camera.position.y = controls.cameraHeight;
  applyDojoCamera(camera, controls);
}

function applyDojoCamera(camera, controls) {
  const direction = new controls.Vector3(
    Math.cos(controls.pitch) * Math.cos(controls.yaw),
    Math.sin(controls.pitch),
    Math.cos(controls.pitch) * Math.sin(controls.yaw),
  );

  camera.lookAt(camera.position.clone().add(direction));
}

function animateThreeRoom() {
  const { renderer, scene, camera, controls } = threeStage;

  if (!renderer || !scene || !camera) {
    return;
  }

  if (controls) {
    updateDojoControls(camera, controls);
  }

  renderer.render(scene, camera);
  threeStage.animationId = window.requestAnimationFrame(animateThreeRoom);
}

function resizeThreeRoom() {
  const { camera, renderer } = threeStage;

  if (!camera || !renderer) {
    return;
  }

  const rect = threeRoom.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function showThreeError(message) {
  threeStatus.textContent = message;
  threeStatus.classList.add("is-error");
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
