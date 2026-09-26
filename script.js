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

// Expanded Domain Rules & Specifications Matrix
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
      title: "Physics Mechanics & Dynamics Suite",
      subtitle: '"Physics module active. Ready for kinematics, thermodynamics, and vector field analysis."',
      placeholder: "Describe the physical system or mechanics query..."
    },
    chemistry: {
      title: "Chemistry & Molecular Simulation",
      subtitle: '"Chemical analysis online. Molecular orbital display and stoichiometry ready."',
      placeholder: "Input chemical reaction, molecular formula, or synthesis query..."
    },
    biology: {
      title: "Biology & Genetics Workspace",
      subtitle: '"Bioinformatics active. DNA sequence analysis and biological diagrams ready."',
      placeholder: "Ask about genetic sequences, cellular biology, or organisms..."
    },
    history: {
      title: "Historical Analysis & Archival Matrix",
      subtitle: '"Historical matrix connected. Primary source evaluation and timeline mapping active."',
      placeholder: "Specify historical era, event, or archival query..."
    },
    psychology: {
      title: "Psychology & Cognitive Science Engine",
      subtitle: '"Cognitive framework loaded. Behavioral models and neural network analogies ready."',
      placeholder: "Describe cognitive phenomenon, psychological framework, or study..."
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
// ==========================================
// 4. SELENÉ 3D AVATAR & SUBTITLE SYNCHRONIZER
// ==========================================
let scene, camera, renderer, avatarModel;

function initAvatarViewport() {
  const container = document.getElementById("avatarViewport");
  if (!container) return;

  // Clear existing static placeholder elements
  container.innerHTML = "";

  const width = container.clientWidth || 180;
  const height = container.clientHeight || 180;

  // 1. Scene Setup
  scene = new THREE.Scene();

  // 2. Camera Setup
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 1.4, 2.5); // Focus on upper torso / head

  // 3. Renderer Setup
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // 4. Custom Selené Purple Ambient & Key Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const purpleKeyLight = new THREE.PointLight(0xb78be9, 2, 10);
  purpleKeyLight.position.set(2, 3, 2);
  scene.add(purpleKeyLight);

  const cyanRimLight = new THREE.PointLight(0x7000ff, 1.5, 10);
  cyanRimLight.position.set(-2, 1, -1);
  scene.add(cyanRimLight);

  // 5. Load GLTF / GLB Model
  const loader = new THREE.GLTFLoader();
  
  // Place your model file at: assets/models/selene.glb
  loader.load(
    "assets/models/selene.glb",
    (gltf) => {
      avatarModel = gltf.scene;
      avatarModel.position.set(0, -0.2, 0);
      avatarModel.scale.set(1, 1, 1);
      scene.add(avatarModel);
    },
    undefined,
    (error) => {
      console.warn("Avatar model not found at assets/models/selene.glb — running ambient light viewport placeholder.", error);
    }
  );

  // 6. Idle Floating Animation Loop
  let clock = new THREE.Clock();
  function animateAvatar() {
    requestAnimationFrame(animateAvatar);

    const elapsedTime = clock.getElapsedTime();

    if (avatarModel) {
      // Gentle floating breathing motion
      avatarModel.position.y = -0.2 + Math.sin(elapsedTime * 1.5) * 0.03;
      avatarModel.rotation.y = Math.sin(elapsedTime * 0.5) * 0.05;
    }

    renderer.render(scene, camera);
  }

  animateAvatar();
}

// Subtitle Typewriter Effect for Selené's Voice Overlays
function triggerSeleneSpeech(text) {
  const subtitleElem = document.getElementById("subtitleOutput");
  if (!subtitleElem) return;

  subtitleElem.textContent = "";
  let index = 0;

  // Pulse effect on avatar frame while speaking
  const avatarFrame = document.querySelector(".avatar-viewport");
  if (avatarFrame) avatarFrame.style.boxShadow = "0 0 45px rgba(183, 139, 233, 0.8)";

  const typeInterval = setInterval(() => {
    if (index < text.length) {
      subtitleElem.textContent += text.charAt(index);
      index++;
    } else {
      clearInterval(typeInterval);
      if (avatarFrame) avatarFrame.style.boxShadow = "0 0 35px var(--purple-glow)";
    }
  }, 25);
}

// Initialize avatar once DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  initAvatarViewport();
});
// ==========================================
// 5. DOMAIN VISUAL MEDIA RENDER ENGINE
// ==========================================
function executeDomainVisuals(domainKey, userInput) {
  const displayPanel = document.getElementById("visualDisplayPanel");
  if (!displayPanel) return;

  displayPanel.innerHTML = ""; // Clear existing visual placeholder

  switch (domainKey) {
    case "mathematics":
    case "physics":
      // Render dynamic LaTeX equations
      const latexContainer = document.createElement("div");
      latexContainer.className = "katex-render-box";
      displayPanel.appendChild(latexContainer);

      // Example LaTeX formula output (e.g., Schrödinger or Calculus)
      const formula = userInput.includes("quantum") 
        ? "i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)"
        : "f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2\\pi i x \\xi}\\,d\\xi";

      katex.render(formula, latexContainer, { displayMode: true, throwOnError: false });
      triggerSeleneSpeech(`"LaTeX proof rendered for ${domainKey.toUpperCase()} workspace."`);
      break;

    case "chemistry":
    case "biology":
      // Render interactive 3D Molecule using 3Dmol.js
      const molViewer = document.createElement("div");
      molViewer.id = "3dmolViewer";
      molViewer.style.width = "100%";
      molViewer.style.height = "100%";
      molViewer.style.position = "relative";
      displayPanel.appendChild(molViewer);

      // Initialize 3Dmol Viewer (e.g., Caffeine molecule structure)
      let viewer = $3Dmol.createViewer("3dmolViewer", { backgroundColor: "0x0c0a14" });
      $3Dmol.download("pdb:1AINS", viewer, { multimodel: true, frames: true }, function () {
        viewer.setStyle({}, { cartoon: { color: "spectrum" } });
        viewer.zoomTo();
        viewer.render();
        viewer.animate({ loop: "backAndForth" });
      });

      triggerSeleneSpeech(`"3D macromolecular structure loaded into ${domainKey.toUpperCase()} viewer."`);
      break;

    case "quantum":
      // Render Quantum Circuit State Diagram
      displayPanel.innerHTML = `
        <div class="quantum-circuit-view">
          <div class="qubit-line"><span>|q₀⟩</span> ───[ H ]───■───[ M ]</div>
          <div class="qubit-line"><span>|q₁⟩</span> ─────────┼───[ M ]</div>
          <small class="circuit-caption">Bell State Generator | ⟨Ψ⁺⟩ = (|00⟩ + |11⟩) / √2</small>
        </div>
      `;
      triggerSeleneSpeech('"Quantum logic gate state verified."');
      break;

    default:
      // General Analytical Output Box
      displayPanel.innerHTML = `
        <div class="generic-output-card">
          <h4>${domainKey.toUpperCase()} ANALYSIS COMPLETE</h4>
          <p>"${userInput}" processed under Selené Vesperiine system parameters.</p>
        </div>
      `;
      triggerSeleneSpeech(`"Output generated for ${domainKey.toUpperCase()} request."`);
      break;
  }
}
case "biology":
      // Interactive DNA / Bioinformatics Viewer
      displayPanel.innerHTML = `
        <div class="bio-sequence-view">
          <div class="dna-strand">5'- A T G C C G T A T G C A T -3'</div>
          <div class="dna-pair">   | | | | | | | | | | | | |</div>
          <div class="dna-strand">3'- T A C G G C A T A C G T A -5'</div>
          <small class="bio-caption">Codon Sequence | Translation: Met - Pro - Tyr - Ala</small>
        </div>
      `;
      triggerSeleneSpeech('"Bioinformatics sequence mapped for BIOLOGY module."');
      break;

    case "history":
      // Historical Chronology & Primary Source Card
      displayPanel.innerHTML = `
        <div class="history-timeline-view">
          <div class="timeline-badge">ERA: CLASSICAL ANTIQUITY</div>
          <div class="source-card">
            <p><i>"Primary source record loaded into archival matrix."</i></p>
            <small>Contextual Cross-Reference: ACTIVE</small>
          </div>
        </div>
      `;
      triggerSeleneSpeech('"Archival timeline index updated for HISTORY matrix."');
      break;

    case "psychology":
      // Cognitive Architecture Model
      displayPanel.innerHTML = `
        <div class="psych-model-view">
          <div class="node-box">Stimulus</div>
          <span class="arrow">→</span>
          <div class="node-box active-node">Cognitive Appraisal</div>
          <span class="arrow">→</span>
          <div class="node-box">Behavioral Response</div>
        </div>
      `;
      triggerSeleneSpeech('"Cognitive framework mapped for PSYCHOLOGY engine."');
      break;

    case "translation":
      // Real-time Parallel Language Cards
      displayPanel.innerHTML = `
        <div class="translation-dual-view">
          <div class="lang-box">
            <span class="lang-tag">INPUT [ENGLISH]</span>
            <p>"${userInput}"</p>
          </div>
          <div class="lang-box highlight-box">
            <span class="lang-tag">TARGET [LATIN]</span>
            <p><i>"Verba volant, scripta manent."</i></p>
          </div>
        </div>
      `;
      triggerSeleneSpeech('"Multilingual conversion active for TRANSLATION module."');
      break;
// ==========================================
// 5. DOMAIN VISUAL MEDIA RENDER ENGINE
// ==========================================
function executeDomainVisuals(domainKey, userInput) {
  const displayPanel = document.getElementById("visualDisplayPanel");
  if (!displayPanel) return;

  displayPanel.innerHTML = ""; // Clear existing visual placeholder

  switch (domainKey) {
    case "mathematics":
    case "physics":
      // Render dynamic LaTeX equations
      const latexContainer = document.createElement("div");
      latexContainer.className = "katex-render-box";
      displayPanel.appendChild(latexContainer);

      // Example LaTeX formula output (e.g., Schrödinger or Calculus)
      const formula = userInput.includes("quantum") 
        ? "i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)"
        : "f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2\\pi i x \\xi}\\,d\\xi";

      katex.render(formula, latexContainer, { displayMode: true, throwOnError: false });
      triggerSeleneSpeech(`"LaTeX proof rendered for ${domainKey.toUpperCase()} workspace."`);
      break;

    case "chemistry":
    case "biology":
      // Render interactive 3D Molecule using 3Dmol.js
      const molViewer = document.createElement("div");
      molViewer.id = "3dmolViewer";
      molViewer.style.width = "100%";
      molViewer.style.height = "100%";
      molViewer.style.position = "relative";
      displayPanel.appendChild(molViewer);

      // Initialize 3Dmol Viewer (e.g., Caffeine molecule structure)
      let viewer = $3Dmol.createViewer("3dmolViewer", { backgroundColor: "0x0c0a14" });
      $3Dmol.download("pdb:1AINS", viewer, { multimodel: true, frames: true }, function () {
        viewer.setStyle({}, { cartoon: { color: "spectrum" } });
        viewer.zoomTo();
        viewer.render();
        viewer.animate({ loop: "backAndForth" });
      });

      triggerSeleneSpeech(`"3D macromolecular structure loaded into ${domainKey.toUpperCase()} viewer."`);
      break;

    case "quantum":
      // Render Quantum Circuit State Diagram
      displayPanel.innerHTML = `
        <div class="quantum-circuit-view">
          <div class="qubit-line"><span>|q₀⟩</span> ───[ H ]───■───[ M ]</div>
          <div class="qubit-line"><span>|q₁⟩</span> ─────────┼───[ M ]</div>
          <small class="circuit-caption">Bell State Generator | ⟨Ψ⁺⟩ = (|00⟩ + |11⟩) / √2</small>
        </div>
      `;
      triggerSeleneSpeech('"Quantum logic gate state verified."');
      break;

    default:
      // General Analytical Output Box
      displayPanel.innerHTML = `
        <div class="generic-output-card">
          <h4>${domainKey.toUpperCase()} ANALYSIS COMPLETE</h4>
          <p>"${userInput}" processed under Selené Vesperiine system parameters.</p>
        </div>
      `;
      triggerSeleneSpeech(`"Output generated for ${domainKey.toUpperCase()} request."`);
      break;
  }
}
