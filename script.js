document.addEventListener("DOMContentLoaded", () => {
  // =========================================================
  // 1. BUBBLE BACKGROUND & FX CONTROLS
  // =========================================================
  const canvas = document.getElementById("bubbleCanvas");
  const ctx = canvas?.getContext("2d");

  if (canvas && ctx) {
    let width = 0;
    let height = 0;

    const fxParams = {
      count: 50,
      maxSpeed: 3,
      maxSize: 15,
      glow: 25
    };

    let bubbles = [];

    function resizeCanvas() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    class Bubble {
      constructor(initial = false) {
        this.reset(initial);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + Math.random() * 100;
        this.radius = Math.random() * fxParams.maxSize + 2;
        this.alpha = Math.random() * 0.45 + 0.15;
        this.setSpeed();
      }

      setSpeed() {
        this.speed = (Math.random() * 0.5 + 0.2) * (fxParams.maxSpeed / 2);
      }

      update() {
        this.y -= this.speed;
        if (this.y < -this.radius) this.reset();
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(183, 139, 233, ${this.alpha})`;
        ctx.shadowBlur = fxParams.glow;
        ctx.shadowColor = "#b78be9";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function resetBubbles(initial = false) {
      bubbles = Array.from({ length: fxParams.count }, () => new Bubble(initial));
    }

    function animateBubbles() {
      ctx.clearRect(0, 0, width, height);
      bubbles.forEach((b) => {
        b.update();
        b.draw();
      });
      requestAnimationFrame(animateBubbles);
    }

    resizeCanvas();
    resetBubbles(true);
    animateBubbles();

    window.addEventListener("resize", resizeCanvas);

    const defaults = { count: 50, maxSpeed: 3, maxSize: 15, glow: 25 };
    const sliders = [
      ["bubbleCount", "count", "bubbleCountValue"],
      ["bubbleSpeed", "maxSpeed", "bubbleSpeedValue"],
      ["bubbleSize", "maxSize", "bubbleSizeValue"],
      ["glowIntensity", "glow", "glowIntensityValue"]
    ];

    sliders.forEach(([id, key, outputId]) => {
      const input = document.getElementById(id);
      const output = document.getElementById(outputId);

      input?.addEventListener("input", () => {
        fxParams[key] = Number(input.value);
        if (output) output.value = input.value;
        if (key === "count") resetBubbles();
        if (key === "maxSpeed") bubbles.forEach((b) => b.setSpeed());
        if (key === "maxSize") {
          bubbles.forEach((b) => {
            b.radius = Math.random() * fxParams.maxSize + 2;
          });
        }
      });
    });

    document.getElementById("resetFxBtn")?.addEventListener("click", () => {
      Object.assign(fxParams, defaults);
      sliders.forEach(([id, key, outputId]) => {
        const input = document.getElementById(id);
        const output = document.getElementById(outputId);
        if (input) input.value = defaults[key];
        if (output) output.value = defaults[key];
      });
      resetBubbles();
    });
  }

  // FX Panel Toggle
  const fxPanel = document.getElementById("fxPanel");
  const toggleFxBtn = document.getElementById("toggleFxPanelBtn");
  toggleFxBtn?.addEventListener("click", () => {
    const isHidden = fxPanel.classList.toggle("hidden");
    toggleFxBtn.setAttribute("aria-expanded", String(!isHidden));
  });

  // =========================================================
  // 2. MODULE WORKSPACES & NAVIGATION
  // =========================================================
  const moduleGrid = document.querySelector(".module-grid");
  const activeDomainContainer = document.getElementById("activeDomainContainer");
  const greetingHeading = document.getElementById("welcomeGreeting");
  const subtitleOutput = document.getElementById("subtitleOutput");

  const domainSpecs = {
    mathematics: { title: "Mathematics Controller", subtitle: "Mathematics module selected.", placeholder: "Enter an equation..." },
    quantum: { title: "Advanced Quantum Computing Engine", subtitle: "Quantum Computing module selected.", placeholder: "Enter a quantum circuit or concept..." },
    physics: { title: "Physics Mechanics Suite", subtitle: "Physics module selected.", placeholder: "Describe the physical system..." },
    chemistry: { title: "Chemistry Workspace", subtitle: "Chemistry module selected.", placeholder: "Enter a chemical formula..." },
    biology: { title: "Biology Workspace", subtitle: "Biology module selected.", placeholder: "Ask about biological systems..." },
    history: { title: "Historical Analysis Workspace", subtitle: "History module selected.", placeholder: "Enter a historical era..." },
    psychology: { title: "Psychology Workspace", subtitle: "Psychology module selected.", placeholder: "Enter a psychological concept..." },
    translation: { title: "Multilingual Translation", subtitle: "Translation module selected.", placeholder: "Type text to translate..." }
  };

  let currentDomain = null;

  document.querySelectorAll(".module-card").forEach((card) => {
    card.addEventListener("click", () => {
      const domain = card.dataset.domain;
      const spec = domainSpecs[domain];
      if (!spec) return;

      currentDomain = domain;
      moduleGrid.classList.add("hidden");
      greetingHeading.textContent = spec.title;
      subtitleOutput.textContent = spec.subtitle;

      renderWorkspace(domain, spec);
    });
  });

  function renderWorkspace(domain, spec) {
    activeDomainContainer.innerHTML = `
      <div class="workspace-panel">
        <div class="workspace-header">
          <span class="active-tag">MODE: ${domain.toUpperCase()}</span>
          <button id="backToHomeBtn" class="back-btn" type="button">← Return to Modules</button>
        </div>
        <div class="workspace-body">
          <div class="visual-display-panel" id="visualDisplayPanel">
            <div class="visual-placeholder">
              <span>Visual Media Display</span>
            </div>
          </div>
          <div class="input-console">
            <textarea id="domainQueryInput" rows="2" placeholder="${escapeAttribute(spec.placeholder)}"></textarea>
            <button id="submitQueryBtn" class="execute-btn" type="button">Execute Query</button>
          </div>
        </div>
      </div>
    `;

    activeDomainContainer.classList.remove("hidden");

    document.getElementById("backToHomeBtn").addEventListener("click", returnHome);
    const input = document.getElementById("domainQueryInput");
    const submit = document.getElementById("submitQueryBtn");

    submit.addEventListener("click", () => handleAiQuery(input.value));
  }

  function escapeAttribute(val) {
    return String(val).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function returnHome() {
    currentDomain = null;
    activeDomainContainer.classList.add("hidden");
    activeDomainContainer.innerHTML = "";
    moduleGrid.classList.remove("hidden");
    greetingHeading.textContent = "What can I help you with today?";
    subtitleOutput.textContent = '"Hello. I am Selené. Select a specialized module to begin."';
  }

  // =========================================================
  // 3. SECURE AI EXECUTION ENGINE (Cloudflare Worker Proxy)
  // =========================================================
  const WORKER_URL = "https://selene-proxy.sanamyasharma110911.workers.dev";
  const mainExecuteBtn = document.querySelector(".input-console-container .execute-btn");
  const mainTextarea = document.querySelector(".input-console-container textarea");

  mainExecuteBtn?.addEventListener("click", () => {
    handleAiQuery(mainTextarea.value);
    mainTextarea.value = "";
  });

  async function handleAiQuery(userQuery) {
    const query = userQuery.trim();
    if (!query) return;

    if (subtitleOutput) {
      subtitleOutput.textContent = '"Processing query..."';
    }

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query })
      });

      const data = await res.json();
      const reply = data.response || "System connection error.";

      if (subtitleOutput) {
        subtitleOutput.textContent = `"${reply}"`;
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel(); // Stop any active speech
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.pitch = 1.1;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      if (subtitleOutput) {
        subtitleOutput.textContent = '"Core system offline."';
      }
    }
  }

  // =========================================================
  // 4. THREE.JS 3D AVATAR INITIALIZATION
  // =========================================================
  const seleneContainer = document.getElementById("selene3D");
  if (seleneContainer && window.THREE && THREE.GLTFLoader) {
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, seleneContainer.clientWidth / seleneContainer.clientHeight, 0.1, 100);
      camera.position.set(0, 1.35, 3.2);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(seleneContainer.clientWidth, seleneContainer.clientHeight);
      seleneContainer.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2);
      keyLight.position.set(2, 3, 4);
      scene.add(keyLight);

      let model = null;
      const loader = new THREE.GLTFLoader();
      loader.load(
        "assets/models/selene.glb",
        (gltf) => {
          model = gltf.scene;
          model.position.set(0, -1.1, 0);
          model.scale.set(1.25, 1.25, 1.25);
          scene.add(model);

          const loadingEl = document.getElementById("avatarLoading");
          if (loadingEl) loadingEl.style.display = "none";
        },
        undefined,
        (err) => console.warn("Avatar model failed to load:", err)
      );

      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        if (model) {
          const t = clock.getElapsedTime();
          model.position.y = -1.1 + Math.sin(t * 1.5) * 0.03;
          model.rotation.y = Math.sin(t * 0.5) * 0.05;
        }
        renderer.render(scene, camera);
      }
      animate();
    } catch (e) {
      console.warn("Three.js setup error:", e);
    }
  }
});
