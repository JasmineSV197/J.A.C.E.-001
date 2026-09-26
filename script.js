document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. DYNAMIC PURPLE BUBBLE CANVAS ENGINE
  // ==========================================
  const canvas = document.getElementById("bubbleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Default Particle Effect Parameters
  const fxParams = {
    count: 50,
    maxSpeed: 3,
    maxSize: 15,
    glow: 25
  };

  class Bubble {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 100;
      this.radius = Math.random() * fxParams.maxSize + 2;
      this.speed = (Math.random() * 0.5 + 0.2) * (fxParams.maxSpeed / 2);
      this.alpha = Math.random() * 0.6 + 0.2;
    }

    update() {
      this.y -= this.speed;
      if (this.y < -this.radius) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(183, 139, 233, ${this.alpha})`;
      ctx.shadowBlur = fxParams.glow;
      ctx.shadowColor = "#b78be9";
      ctx.fill();
      ctx.shadowBlur = 0; // Optimization reset
    }
  }

  let bubbles = Array.from({ length: fxParams.count }, () => new Bubble());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    bubbles.forEach((b) => {
      b.update();
      b.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();

  // ==========================================
  // 2. CUSTOMIZABLE FX CONTROL PANEL HANDLERS
  // ==========================================
  const fxPanel = document.getElementById("fxPanel");
  const toggleFxBtn = document.getElementById("toggleFxPanelBtn");

  if (toggleFxBtn && fxPanel) {
    toggleFxBtn.addEventListener("click", () => {
      fxPanel.classList.toggle("hidden");
    });
  }

  const bindSlider = (id, callback) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.addEventListener("input", (e) => callback(parseInt(e.target.value)));
    }
  };

  bindSlider("bubbleCount", (val) => {
    fxParams.count = val;
    bubbles = Array.from({ length: fxParams.count }, () => new Bubble());
  });

  bindSlider("bubbleSpeed", (val) => {
    fxParams.maxSpeed = val;
    bubbles.forEach((b) => (b.speed = (Math.random() * 0.5 + 0.2) * (fxParams.maxSpeed / 2)));
  });

  bindSlider("bubbleSize", (val) => {
    fxParams.maxSize = val;
  });

  bindSlider("glowIntensity", (val) => {
    fxParams.glow = val;
  });

  const resetFxBtn = document.getElementById("resetFxBtn");
  if (resetFxBtn) {
    resetFxBtn.addEventListener("click", () => {
      fxParams.count = 50;
      fxParams.maxSpeed = 3;
      fxParams.maxSize = 15;
      fxParams.glow = 25;

      const countInput = document.getElementById("bubbleCount");
      const speedInput = document.getElementById("bubbleSpeed");
      const sizeInput = document.getElementById("bubbleSize");
      const glowInput = document.getElementById("glowIntensity");

      if (countInput) countInput.value = 50;
      if (speedInput) speedInput.value = 3;
      if (sizeInput) sizeInput.value = 15;
      if (glowInput) glowInput.value = 25;

      bubbles = Array.from({ length: fxParams.count }, () => new Bubble());
    });
  }

  // ==========================================
  // 3. SPA MODULE SWITCHING & REDIRECT LOGIC
  // ==========================================
  const moduleCards = document.querySelectorAll(".module-card");
  const subtitleOutput = document.getElementById("subtitleOutput");
  const greetingHeading = document.getElementById("welcomeGreeting");
  const moduleGrid = document.querySelector(".module-grid");

  // Create Workspace Container dynamically if missing
  let activeDomainContainer = document.getElementById("activeDomainContainer");
  if (!activeDomainContainer) {
    activeDomainContainer = document.createElement("div");
    activeDomainContainer.id = "activeDomainContainer";
    activeDomainContainer.className = "domain-view hidden";
    const parent = document.querySelector(".welcome-container");
    if (parent) parent.appendChild(activeDomainContainer);
  }

  // Domain Rules & Specifications Matrix
  const domainSpecs = {
    mathematics: {
      title: "Mathematics Controller",
      subtitle: '"Mathematics module online. Ready for proof verification, calculus, and LaTeX rendering."',
      placeholder: "Enter an equation or mathematical proof query..."
    },
    quantum: {
      title: "Advanced Quantum Computing Engine",
      subtitle: '"Quantum logic active. Circuit state verification and qubit optimization ready."',
      placeholder: "Input quantum circuit parameters or algorithm query..."
    },
    physics: {
      title: "Physics & Chemistry Suite",
      subtitle: '"Physical systems initialized. Ready for molecular and mechanics simulation analysis."',
      placeholder: "Describe the physical system or chemical reaction..."
    },
    biology: {
      title: "Biology & Genetics Workspace",
      subtitle: '"Bioinformatics active. DNA sequence analysis and biological diagrams ready."',
      placeholder: "Ask about genetic sequences, cellular biology, or organisms..."
    },
    history: {
      title: "History & Psychology Matrix",
      subtitle: '"Contextual humanities matrix connected. Primary source analysis active."',
      placeholder: "Specify historical era, cognitive model, or research topic..."
    },
    translation: {
      title: "Real-Time Multilingual Translation",
      subtitle: '"Translation engine active. Automatic voice and text conversion ready."',
      placeholder: "Type or speak text to translate..."
    }
  };

  moduleCards.forEach((card) => {
    card.addEventListener("click", () => {
      const domainKey = card.getAttribute("data-domain");
      const spec = domainSpecs[domainKey];

      if (spec) {
        if (subtitleOutput) subtitleOutput.textContent = spec.subtitle;
        if (greetingHeading) greetingHeading.textContent = spec.title;
        if (moduleGrid) moduleGrid.style.display = "none";

        renderDomainWorkspace(domainKey, spec);
      }
    });
  });

  function renderDomainWorkspace(domainKey, spec) {
    activeDomainContainer.innerHTML = `
      <div class="workspace-panel">
        <div class="workspace-header">
          <span class="active-tag">MODE: ${domainKey.toUpperCase()}</span>
          <button id="backToHomeBtn" class="back-btn">← Return to Modules</button>
        </div>

        <div class="workspace-body">
          <div class="visual-display-panel" id="visualDisplayPanel">
            <div class="visual-placeholder">
              <span>Visual Media Display</span>
              <small>Diagrams & real-time web media will render here</small>
            </div>
          </div>

          <div class="input-console">
            <textarea id="domainQueryInput" placeholder="${spec.placeholder}"></textarea>
            <button id="submitQueryBtn" class="execute-btn">Execute Query</button>
          </div>
        </div>
      </div>
    `;

    activeDomainContainer.classList.remove("hidden");

    // "Return to Modules" Button Handler
    const backBtn = document.getElementById("backToHomeBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        activeDomainContainer.classList.add("hidden");
        if (moduleGrid) moduleGrid.style.display = "grid";
        if (greetingHeading) greetingHeading.textContent = "What can I help you with today?";
        if (subtitleOutput) {
          subtitleOutput.textContent = '"Hello. I am Selené. Select a specialized module to begin execution."';
        }
      });
    }

    // Query Submission & Domain Isolation Intercept
    const submitBtn = document.getElementById("submitQueryBtn");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const queryInput = document.getElementById("domainQueryInput");
        if (!queryInput || !queryInput.value.trim()) return;

        if (subtitleOutput) {
          subtitleOutput.textContent = `"Processing ${domainKey.toUpperCase()} request..."`;
        }
      });
    }
  }
});
