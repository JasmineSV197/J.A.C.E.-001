
document.addEventListener("DOMContentLoaded", () => {
  // -------------------- Bubble background --------------------
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
        this.y = initial
          ? Math.random() * height
          : height + Math.random() * 100;

        this.radius = Math.random() * fxParams.maxSize + 2;
        this.alpha = Math.random() * 0.45 + 0.15;
        this.setSpeed();
      }

      setSpeed() {
        this.speed =
          (Math.random() * 0.5 + 0.2) *
          (fxParams.maxSpeed / 2);
      }

      update() {
        this.y -= this.speed;

        if (this.y < -this.radius) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          this.radius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(183, 139, 233, ${this.alpha})`;

        ctx.shadowBlur = fxParams.glow;
        ctx.shadowColor = "#b78be9";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function resetBubbles(initial = false) {
      bubbles = Array.from(
        { length: fxParams.count },
        () => new Bubble(initial)
      );
    }

    function animateBubbles() {
      ctx.clearRect(0, 0, width, height);

      bubbles.forEach((bubble) => {
        bubble.update();
        bubble.draw();
      });

      requestAnimationFrame(animateBubbles);
    }

    resizeCanvas();
    resetBubbles(true);
    animateBubbles();

    window.addEventListener("resize", resizeCanvas);

    const defaults = {
      count: 50,
      maxSpeed: 3,
      maxSize: 15,
      glow: 25
    };

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

        if (output) {
          output.value = input.value;
        }

        if (key === "count") {
          resetBubbles();
        }

        if (key === "maxSpeed") {
          bubbles.forEach((bubble) => bubble.setSpeed());
        }

        if (key === "maxSize") {
          bubbles.forEach((bubble) => {
            bubble.radius =
              Math.random() * fxParams.maxSize + 2;
          });
        }
      });
    });

    document.getElementById("resetFxBtn")
      ?.addEventListener("click", () => {
        Object.assign(fxParams, defaults);

        sliders.forEach(([id, key, outputId]) => {
          const input = document.getElementById(id);
          const output = document.getElementById(outputId);

          if (input) {
            input.value = defaults[key];
          }

          if (output) {
            output.value = defaults[key];
          }
        });

        resetBubbles();
      });
  }

  // -------------------- FX panel --------------------
  const fxPanel = document.getElementById("fxPanel");
  const toggleFxBtn =
    document.getElementById("toggleFxPanelBtn");

  toggleFxBtn?.addEventListener("click", () => {
    const isHidden = fxPanel.classList.toggle("hidden");

    toggleFxBtn.setAttribute(
      "aria-expanded",
      String(!isHidden)
    );
  });

  // -------------------- Module workspaces --------------------
  const moduleGrid = document.querySelector(".module-grid");
  const activeDomainContainer =
    document.getElementById("activeDomainContainer");
  const greetingHeading =
    document.getElementById("welcomeGreeting");
  const subtitleOutput =
    document.getElementById("subtitleOutput");

  const domainSpecs = {
    mathematics: {
      title: "Mathematics Controller",
      subtitle:
        "Mathematics module selected. Enter a question to begin.",
      placeholder:
        "Enter an equation or mathematical question..."
    },

    quantum: {
      title: "Advanced Quantum Computing Engine",
      subtitle:
        "Quantum Computing module selected. Enter a question to begin.",
      placeholder:
        "Enter a quantum circuit, algorithm, or concept..."
    },

    physics: {
      title: "Physics Mechanics & Dynamics Suite",
      subtitle:
        "Physics module selected. Enter a question to begin.",
      placeholder:
        "Describe the physical system or enter a physics question..."
    },

    chemistry: {
      title: "Chemistry & Molecular Workspace",
      subtitle:
        "Chemistry module selected. Enter a question to begin.",
      placeholder:
        "Enter a chemical reaction, formula, or question..."
    },

    biology: {
      title: "Biology & Genetics Workspace",
      subtitle:
        "Biology module selected. Enter a question to begin.",
      placeholder:
        "Ask about cells, genetics, organisms, or biology..."
    },

    history: {
      title: "Historical Analysis Workspace",
      subtitle:
        "History module selected. Enter a question to begin.",
      placeholder:
        "Enter a historical era, event, or question..."
    },

    psychology: {
      title: "Psychology & Cognitive Science Workspace",
      subtitle:
        "Psychology module selected. Enter a question to begin.",
      placeholder:
        "Enter a psychological concept, study, or question..."
    },

    translation: {
      title: "Multilingual Translation Workspace",
      subtitle:
        "Translation module selected. Enter text to translate.",
      placeholder:
        "Type text to translate..."
    }
  };

  let currentDomain = null;
  let speechTimer = null;

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
          <span class="active-tag">
            MODE: ${domain.toUpperCase()}
          </span>

          <button
            id="backToHomeBtn"
            class="back-btn"
            type="button"
          >
            ← Return to Modules
          </button>
        </div>

        <div class="workspace-body">
          <div
            class="visual-display-panel"
            id="visualDisplayPanel"
          >
            <div class="visual-placeholder">
              <span>Visual Media Display</span>
              <small>
                Example visuals will appear here.
                AI integration is not connected yet.
              </small>
            </div>
          </div>

          <div class="input-console">
            <textarea
              id="domainQueryInput"
              spellcheck="true"
              placeholder="${escapeAttribute(spec.placeholder)}"
              aria-label="Question or text for ${escapeAttribute(spec.title)}"
            ></textarea>

            <button
              id="submitQueryBtn"
              class="execute-btn"
              type="button"
            >
              Execute Query
            </button>
          </div>

          <p class="demo-note">
            Prototype mode: the current output is a
            visual demonstration, not an AI-generated answer.
          </p>
        </div>
      </div>
    `;

    activeDomainContainer.classList.remove("hidden");

    document
      .getElementById("backToHomeBtn")
      .addEventListener("click", returnHome);

    const input =
      document.getElementById("domainQueryInput");

    const submit =
      document.getElementById("submitQueryBtn");

    submit.addEventListener("click", () => {
      submitQuery(domain, input.value);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitQuery(domain, input.value);
      }
    });
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function returnHome() {
    stopSpeech();
    currentDomain = null;

    activeDomainContainer.classList.add("hidden");
    activeDomainContainer.innerHTML = "";

    moduleGrid.classList.remove("hidden");

    greetingHeading.textContent =
      "What can I help you with today?";

    subtitleOutput.textContent =
      '"Hello. I am Selené. Select a specialized module to begin."';
  }

  // -------------------- Query handling --------------------
  function submitQuery(domain, rawInput) {
    const userInput = rawInput.trim();

    if (!userInput) return;

    subtitleOutput.textContent =
      `Processing ${domain.toUpperCase()} request...`;

    renderDemoVisual(domain, userInput);
  }

  function showPlaceholder(panel, message) {
    panel.replaceChildren();

    const wrapper = document.createElement("div");
    wrapper.className = "generic-output-card";

    const heading = document.createElement("h3");
    heading.textContent = "DEMONSTRATION OUTPUT";

    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    wrapper.append(heading, paragraph);
    panel.appendChild(wrapper);
  }

  // -------------------- Demo visuals --------------------
  function renderDemoVisual(domain, userInput) {
    const panel =
      document.getElementById("visualDisplayPanel");

    if (!panel || domain !== currentDomain) return;

    panel.replaceChildren();

    if (
      (domain === "mathematics" || domain === "physics") &&
      window.katex
    ) {
      const box = document.createElement("div");
      box.className = "katex-render-box";
      panel.appendChild(box);

      const formula =
        domain === "mathematics"
          ? "f(x) = \\\\int_{-\\\\infty}^{\\\\infty} \\\\hat{f}(\\\\xi)\\\\,e^{2\\\\pi i x \\\\xi}\\\\,d\\\\xi"
          : "F = ma";

      window.katex.render(formula, box, {
        displayMode: true,
        throwOnError: false
      });

      speakDemo(
        `A sample ${domain} formula is displayed. This is not a solution to your input.`
      );
    }

    else if (domain === "chemistry" && window.$3Dmol) {
      const viewerHost = document.createElement("div");
      viewerHost.id = "moleculeViewer";
      viewerHost.style.cssText =
        "width:100%;height:100%;min-height:220px;";

      panel.appendChild(viewerHost);

      const viewer = window.$3Dmol.createViewer(
        viewerHost,
        { backgroundColor: "#0c0a14" }
      );

      window.$3Dmol.download(
        "pdb:1AINS",
        viewer,
        {},
        () => {
          viewer.setStyle(
            {},
            { cartoon: { color: "spectrum" } }
          );
          viewer.zoomTo();
          viewer.render();
        },
        (error) => {
          console.warn(
            "Molecular example could not be loaded.",
            error
          );

          showPlaceholder(
            panel,
            "The sample molecular structure could not be loaded."
          );
        }
      );

      speakDemo(
        "A sample molecular structure is displayed. It is not based on your input."
      );
    }

    else if (domain === "biology") {
      const wrapper = document.createElement("div");
      wrapper.className = "bio-sequence-view";

      wrapper.innerHTML = `
        <div class="dna-strand">
          5′- A T G C C G T A T G C A T -3′
        </div>

        <div class="dna-pair">
          | | | | | | | | | | | | |
        </div>

        <div class="dna-strand">
          3′- T A C G G C A T A C G T A -5′
        </div>

        <small>Illustrative DNA sequence</small>
      `;

      panel.appendChild(wrapper);
      speakDemo("An illustrative DNA sequence is displayed.");
    }

    else if (domain === "history") {
      const wrapper = document.createElement("div");
      wrapper.className = "history-timeline-view";

      wrapper.innerHTML = `
        <div class="timeline-badge">
          SAMPLE: CLASSICAL ANTIQUITY
        </div>

        <div class="source-card">
          Example timeline placeholder
        </div>
      `;

      panel.appendChild(wrapper);
      speakDemo("A sample history display is shown.");
    }

    else if (domain === "psychology") {
      const wrapper = document.createElement("div");
      wrapper.className = "psych-model-view";

      wrapper.innerHTML = `
        <div class="node-box">Stimulus</div>
        <span>→</span>
        <div class="node-box active-node">
          Cognitive Appraisal
        </div>
        <span>→</span>
        <div class="node-box">Response</div>
      `;

      panel.appendChild(wrapper);
      speakDemo("A sample cognitive model is displayed.");
    }

    else if (domain === "translation") {
      const wrapper = document.createElement("div");
      wrapper.className = "translation-dual-view";

      const source = document.createElement("div");
      source.className = "lang-box";

      const sourceTag = document.createElement("span");
      sourceTag.className = "lang-tag";
      sourceTag.textContent = "INPUT TEXT";

      const sourceText = document.createElement("p");
      sourceText.textContent = userInput;

      source.append(sourceTag, sourceText);

      const target = document.createElement("div");
      target.className = "lang-box highlight-box";

      const targetTag = document.createElement("span");
      targetTag.className = "lang-tag";
      targetTag.textContent = "TRANSLATION";

      const targetText = document.createElement("p");
      targetText.textContent =
        "Translation service is not connected yet.";

      target.append(targetTag, targetText);

      wrapper.append(source, target);
      panel.appendChild(wrapper);

      speakDemo(
        "Your text is displayed. Translation is not connected yet."
      );
    }

    else if (domain === "quantum") {
      const wrapper = document.createElement("div");
      wrapper.className = "quantum-circuit-view";

      wrapper.innerHTML = `
        <div class="qubit-line">
          |q₀⟩ ───[ H ]───■───[ M ]
        </div>

        <div class="qubit-line">
          |q₁⟩ ─────────┼───[ M ]
        </div>

        <small class="circuit-caption">
          Illustrative Bell-state circuit
        </small>
      `;

      panel.appendChild(wrapper);
      speakDemo("An illustrative quantum circuit is displayed.");
    }
  }

  // -------------------- Subtitle animation --------------------
  function stopSpeech() {
    if (speechTimer) {
      clearInterval(speechTimer);
      speechTimer = null;
    }
  }

  function speakDemo(message) {
    stopSpeech();

    const output =
      document.getElementById("subtitleOutput");

    if (!output) return;

    output.textContent = "";

    const avatar =
      document.getElementById("avatarViewport");

    if (avatar) {
      avatar.classList.add("speaking");
    }

    let index = 0;

    speechTimer = setInterval(() => {
      if (index < message.length) {
        output.textContent += message.charAt(index++);
      } else {
        stopSpeech();

        if (avatar) {
          avatar.classList.remove("speaking");
        }
      }
    }, 25);
  }

  // -------------------- 3D avatar --------------------
  const container =
    document.getElementById("avatarViewport");

  const fallback =
    document.getElementById("avatarFallback");

  if (container && window.THREE && THREE.GLTFLoader) {
    try {
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        45,
        1,
        0.1,
        1000
      );

      camera.position.set(0, 1.4, 2.5);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
      });

      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
      );

      container.appendChild(renderer.domElement);

      if (fallback) {
        fallback.hidden = true;
      }

      scene.add(
        new THREE.AmbientLight(0xffffff, 0.8)
      );

      const keyLight = new THREE.PointLight(
        0xb78be9,
        2,
        10
      );

      keyLight.position.set(2, 3, 2);
      scene.add(keyLight);

      const rimLight = new THREE.PointLight(
        0x7000ff,
        1.5,
        10
      );

      rimLight.position.set(-2, 1, -1);
      scene.add(rimLight);

      let avatarModel = null;

      const resizeAvatar = () => {
        const w = Math.max(container.clientWidth, 1);
        const h = Math.max(container.clientHeight, 1);

        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        renderer.setSize(w, h, false);
      };

      resizeAvatar();
      window.addEventListener("resize", resizeAvatar);

      const loader = new THREE.GLTFLoader();

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
          console.warn(
            "Could not load assets/models/selene.glb.",
            error
          );

          if (fallback) {
            fallback.hidden = false;
            fallback.textContent = "AVATAR MODEL NOT FOUND";
          }
        }
      );

      const clock = new THREE.Clock();

      function animateAvatar() {
        requestAnimationFrame(animateAvatar);

        if (avatarModel) {
          const t = clock.getElapsedTime();

          avatarModel.position.y =
            -0.2 + Math.sin(t * 1.5) * 0.03;

          avatarModel.rotation.y =
            Math.sin(t * 0.5) * 0.05;
        }

        renderer.render(scene, camera);
      }

      animateAvatar();

    } catch (error) {
      console.warn(
        "3D avatar initialization failed.",
        error
      );
    }
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const executeBtn = document.querySelector('.execute-btn');
  const textarea = document.querySelector('.input-console textarea');

  if (executeBtn && textarea) {
    executeBtn.addEventListener('click', () => {
      const userQuery = textarea.value.trim();
      
      if (!userQuery) {
        alert('Please enter a query or command first.');
        return;
      }

      console.log('Executing command:', userQuery);
      
      // Clear input after execution
      textarea.value = '';
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const executeBtn = document.querySelector('.execute-btn');
  const textarea = document.querySelector('.input-console textarea');
  const subtitleOutput = document.getElementById('subtitleOutput');

  // Insert your Gemini API key here for direct web testing
  const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';

  if (executeBtn && textarea) {
    executeBtn.addEventListener('click', async () => {
      const userQuery = textarea.value.trim();
      if (!userQuery) return;

      if (subtitleOutput) {
        subtitleOutput.textContent = '"Processing query..."';
      }

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are Selené Vesperiine, an AI companion in the J.A.C.E. 001 interface. Keep your response brief and in-character. User says: ${userQuery}`
                }]
              }]
            })
          }
        );

        const data = await response.json();
        const aiReply = data.candidates[0].content.parts[0].text;

        // Display response in the subtitle bar
        if (subtitleOutput) {
          subtitleOutput.textContent = `"${aiReply}"`;
        }

        // Voice output
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(aiReply);
          utterance.pitch = 1.1;
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
        }

      } catch (err) {
        console.error(err);
        if (subtitleOutput) {
          subtitleOutput.textContent = '"Core module connection failed."';
        }
      }

      textarea.value = '';
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const executeBtn = document.querySelector('.execute-btn');
  const textarea = document.querySelector('.input-console textarea');
  const subtitleOutput = document.getElementById('subtitleOutput');

  // Replace this with your actual Cloudflare Worker URL from Step 1
  const WORKER_URL = 'https://selene-proxy.sanamyasharma110911.workers.dev';

  if (executeBtn && textarea) {
    executeBtn.addEventListener('click', async () => {
      const userQuery = textarea.value.trim();
      if (!userQuery) return;

      if (subtitleOutput) {
        subtitleOutput.textContent = '"Processing query..."';
      }

      try {
        const res = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userQuery })
        });

        const data = await res.json();
        const reply = data.response || "System connection error.";

        // Render AI response in subtitle bar
        if (subtitleOutput) {
          subtitleOutput.textContent = `"${reply}"`;
        }

        // Voice output
        if ('speechSynthesis' in window) {
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

      textarea.value = '';
    });
  }
});
/* =========================================================
   SELENÉ VESPERIINE — 3D AVATAR
   ========================================================= */

const seleneContainer = document.getElementById("selene3D");

if (seleneContainer && window.THREE) {

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    35,
    seleneContainer.clientWidth / seleneContainer.clientHeight,
    0.1,
    100
  );

  camera.position.set(0, 1.35, 3.2);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    seleneContainer.clientWidth,
    seleneContainer.clientHeight
  );

  renderer.outputEncoding = THREE.sRGBEncoding;

  seleneContainer.appendChild(renderer.domElement);


  /* LIGHTING */

  const ambientLight = new THREE.AmbientLight(
    0xffffff,
    1.5
  );

  scene.add(ambientLight);


  const keyLight = new THREE.DirectionalLight(
    0xffffff,
    2
  );

  keyLight.position.set(2, 3, 4);

  scene.add(keyLight);


  const purpleLight = new THREE.PointLight(
    0xb77cff,
    2,
    8
  );

  purpleLight.position.set(-2, 2, 2);

  scene.add(purpleLight);


  /* LOAD SELENÉ */

  const loader = new THREE.GLTFLoader();

  loader.load(
    "assets/models/selene.glb",

    function (gltf) {

      const selene = gltf.scene;

      selene.position.set(0, -1.1, 0);

      selene.scale.set(
        1.25,
        1.25,
        1.25
      );

      scene.add(selene);

      document
        .getElementById("avatarLoading")
        ?.remove();


      /* SAVE MODEL FOR FUTURE ANIMATION */

      window.SELENE_AVATAR = selene;

      /*
       * If the GLB contains animations,
       * prepare them here.
       */

      if (
        gltf.animations &&
        gltf.animations.length > 0
      ) {

        const mixer =
          new THREE.AnimationMixer(selene);

        window.SELENE_MIXER = mixer;

        window.SELENE_ANIMATIONS =
          gltf.animations;

        console.log(
          "Selené animations:",
          gltf.animations.map(
            animation => animation.name
          )
        );
      }

      console.log(
        "Selené 3D avatar loaded successfully."
      );
    },


    function (progress) {

      if (progress.total) {

        const percent =
          (progress.loaded /
           progress.total) * 100;

        const loading =
          document.getElementById(
            "avatarLoading"
          );

        if (loading) {
          loading.textContent =
            `Loading Selené... ${Math.round(percent)}%`;
        }
      }
    },


    function (error) {

      console.error(
        "Selené 3D model failed to load:",
        error
      );

      const loading =
        document.getElementById(
          "avatarLoading"
        );

      if (loading) {
        loading.textContent =
          "Selené 3D model not found.";
      }
    }
  );


  /* ANIMATION */

  const clock = new THREE.Clock();

  function animateSelene() {

    requestAnimationFrame(
      animateSelene
    );

    const delta =
      clock.getDelta();

    if (window.SELENE_MIXER) {

      window.SELENE_MIXER.update(
        delta
      );
    }

    /*
     * Very subtle natural idle movement.
     */

    if (window.SELENE_AVATAR) {

      const time =
        performance.now() * 0.001;

      window.SELENE_AVATAR.rotation.y =
        Math.sin(time * 0.35) * 0.025;

      window.SELENE_AVATAR.position.y =
        -1.1 +
        Math.sin(time * 1.2) * 0.008;
    }

    renderer.render(
      scene,
      camera
    );
  }

  animateSelene();


  /* RESPONSIVE */

  window.addEventListener(
    "resize",
    () => {

      const width =
        seleneContainer.clientWidth;

      const height =
        seleneContainer.clientHeight;

      camera.aspect =
        width / height;

      camera.updateProjectionMatrix();

      renderer.setSize(
        width,
        height
      );
    }
  );
}
