
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  // =========================================================
// 🌍 SELENÉ — WORLD CLOCK
// =========================================================

const WORLD_TIME_ZONES = {
    "india": "Asia/Kolkata",
    "indore": "Asia/Kolkata",
    "new delhi": "Asia/Kolkata",
    "london": "Europe/London",
    "united kingdom": "Europe/London",
    "paris": "Europe/Paris",
    "france": "Europe/Paris",
    "berlin": "Europe/Berlin",
    "tokyo": "Asia/Tokyo",
    "japan": "Asia/Tokyo",
    "singapore": "Asia/Singapore",
    "dubai": "Asia/Dubai",
    "uae": "Asia/Dubai",
    "sydney": "Australia/Sydney",
    "new york": "America/New_York",
    "los angeles": "America/Los_Angeles",
    "chicago": "America/Chicago",
    "toronto": "America/Toronto",
    "vancouver": "America/Vancouver",
    "moscow": "Europe/Moscow",
    "seoul": "Asia/Seoul",
    "beijing": "Asia/Shanghai",
    "china": "Asia/Shanghai",
    "bangkok": "Asia/Bangkok",
    "nepal": "Asia/Kathmandu"
};

function getWorldTime(location) {
    const place = location.trim().toLowerCase();

    const timeZone =
        WORLD_TIME_ZONES[place] || location.trim();

    try {
        const now = new Date();

        const formatted = new Intl.DateTimeFormat("en-IN", {
            timeZone,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZoneName: "long"
        }).format(now);

        return `Current local date and time in ${location}: ${formatted}.
        Time zone: ${timeZone}.`;

    } catch (error) {
        return `I could not identify the time zone for ${location}.
        Please specify a city or an IANA time zone, such as
        America/New_York or Europe/London.`;
    }
}

  // =========================================================
  // 1. BUBBLE BACKGROUND & FX CONTROLS
  // =========================================================

  const canvas = document.getElementById("bubbleCanvas");
  const ctx = canvas?.getContext("2d");

  if (canvas && ctx) {
    let width = 0;
    let height = 0;
    let animationFrame = null;

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

      animationFrame = requestAnimationFrame(animateBubbles);
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

  // =========================================================
  // 2. FX PANEL
  // =========================================================

  const fxPanel = document.getElementById("fxPanel");
  const toggleFxBtn =
    document.getElementById("toggleFxPanelBtn");

  toggleFxBtn?.addEventListener("click", () => {
    if (!fxPanel) return;

    const isHidden = fxPanel.classList.toggle("hidden");

    toggleFxBtn.setAttribute(
      "aria-expanded",
      String(!isHidden)
    );
  });

  // =========================================================
  // 3. MODULE WORKSPACES
  // =========================================================

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
  let activeWorkspaceButton = null;
  let activeWorkspaceInput = null;

  document.querySelectorAll(".module-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (isAiProcessing) return;

      const domain = card.dataset.domain;
      const spec = domainSpecs[domain];

      if (!spec) return;

      currentDomain = domain;

      moduleGrid?.classList.add("hidden");

      if (greetingHeading) {
        greetingHeading.textContent = spec.title;
      }

      if (subtitleOutput) {
        subtitleOutput.textContent = spec.subtitle;
      }

      renderWorkspace(domain, spec);
    });
  });

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

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
                AI integration is connected via Ollama.
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
            Workspace active: Selené AI engine connected.
          </p>

        </div>

      </div>
    `;

    activeDomainContainer.classList.remove("hidden");

    document
      .getElementById("backToHomeBtn")
      ?.addEventListener("click", returnHome);

    activeWorkspaceInput =
      document.getElementById("domainQueryInput");

    activeWorkspaceButton =
      document.getElementById("submitQueryBtn");

    activeWorkspaceButton?.addEventListener("click", () => {
      submitQuery(domain, activeWorkspaceInput.value);
    });

    activeWorkspaceInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        submitQuery(domain, activeWorkspaceInput.value);
      }
    });
  }

  function returnHome() {
    if (isAiProcessing) return;

    stopSpeech();

    currentDomain = null;
    activeWorkspaceButton = null;
    activeWorkspaceInput = null;

    activeDomainContainer?.classList.add("hidden");

    if (activeDomainContainer) {
      activeDomainContainer.innerHTML = "";
    }

    moduleGrid?.classList.remove("hidden");

    if (greetingHeading) {
      greetingHeading.textContent =
        "What can I help you with today?";
    }

    if (subtitleOutput) {
      subtitleOutput.textContent =
        '"Hello. I am Selené. Select a specialized module to begin."';
    }
  }

  // =========================================================
  // 4. QUERY HANDLING
  // =========================================================

  function submitQuery(domain, rawInput) {
    const userInput = (rawInput || "").trim();

    if (!userInput || isAiProcessing) return;

    if (domain !== currentDomain) return;

    renderDemoVisual(domain, userInput);

    handleAiQuery(userInput, domain);
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

  // =========================================================
  // 5. DEMONSTRATION VISUALS
  // =========================================================

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
        `A sample ${domain} formula is displayed.`
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
        "A sample molecular structure is displayed."
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
      targetText.textContent = "Translation will appear here.";

      target.append(targetTag, targetText);

      wrapper.append(source, target);

      panel.appendChild(wrapper);

      speakDemo(
        "Your text is submitted for translation."
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

      speakDemo(
        "An illustrative quantum circuit is displayed."
      );
    }
  }

  // =========================================================
  // 6. SUBTITLE ANIMATION
  // =========================================================

  function stopSpeech() {
    if (speechTimer) {
      clearInterval(speechTimer);
      speechTimer = null;
    }

    const avatar =
      document.getElementById("avatarViewport");

    avatar?.classList.remove("speaking");
  }

  function speakDemo(message) {
    stopSpeech();

    const output =
      document.getElementById("subtitleOutput");

    if (!output) return;

    output.textContent = "";

    const avatar =
      document.getElementById("avatarViewport");

    avatar?.classList.add("speaking");

    let index = 0;

    speechTimer = setInterval(() => {
      if (index < message.length) {
        output.textContent += message.charAt(index++);
      } else {
        stopSpeech();
      }
    }, 25);
  }

  // =========================================================
  // 7. SELENÉ'S AI ENGINE — OLLAMA
  // =========================================================

  const OLLAMA_URL = "http://localhost:11434/api/chat";
  const OLLAMA_MODEL = "qwen2.5:1.5b";

  // Tuned for the user's 8 GB RAM computer.
  const AI_OPTIONS = {
    temperature: 0.3,
    top_p: 0.85,
    num_ctx: 2048,
    num_predict: 256,
    repeat_penalty: 1.1
  };

  const KEEP_ALIVE = "10m";

  let isAiProcessing = false;

  const conversationHistories = {
    general: [],
    mathematics: [],
    quantum: [],
    physics: [],
    chemistry: [],
    biology: [],
    history: [],
    psychology: [],
    translation: []
  };

  // =========================================================
  // 8. MODULE-SPECIFIC INSTRUCTIONS
  // =========================================================

  const moduleInstructions = {

    mathematics: `
ACTIVE MODULE: MATHEMATICS
Your primary task is to solve complex questions of mathematics as per CBSE class 10.

Your subject includes:
- Arithmetic and algebra
- Geometry and trigonometry
- Calculus
- Statistics and probability
- Linear algebra
- Mathematical proofs
- Equations and numerical methods
RULES:
1. Explain calculations step by step; answer each step in next line.
2. Use correct mathematical notation.
3. Check arithmetic and algebra before answering.
4. Explain variables and formulas.
5. Adapt explanations to the user's level.
6. Never invent a mathematical result.
MATHEMATICS AND VISUAL LEARNING:

- Explain mathematical problems step by step.
- Automatically generate diagrams for geometry,
  graphs, coordinate geometry and other visual problems
  whenever they improve understanding.
- For other topics, generate diagrams when the user asks.
- Label all diagrams clearly.
- Show equations, measurements and relevant values.
- Never invent measurements or diagram details.
- Ensure diagrams correspond to the actual problem.
- For simple arithmetic, do not generate unnecessary diagrams.
- Prefer visual explanations alongside mathematical reasoning.

If the main question is unrelated to Mathematics,
identify the correct J.A.C.E. 001 module and ask the
user to switch to it instead of answering the unrelated
question in this module.
`,

    quantum: `
ACTIVE MODULE: QUANTUM COMPUTING

Your subject includes:
- Qubits and quantum states
- Quantum gates
- Quantum circuits
- Quantum algorithms
- Superposition
- Entanglement
- Quantum measurement
- Quantum information theory
- Quantum error correction

RULES:
1. Explain concepts from basic to advanced levels.
2. Distinguish theoretical predictions from experiments.
3. Use correct quantum notation.
4. Explain mathematical expressions.
5. Do not present speculative claims as established science.

If the main question is unrelated to Quantum Computing,
identify the correct J.A.C.E. 001 module and ask the
user to switch to it.
`,

    physics: `
ACTIVE MODULE: PHYSICS

Your subject includes:
- Classical mechanics
- Motion, force and energy
- Thermodynamics
- Waves and optics
- Electricity and magnetism
- Relativity
- Astrophysics
- Modern physics

RULES:
1. Explain physical principles clearly.
2. Use correct equations and SI units.
3. Explain what each variable represents.
4. Show calculation steps when necessary.
5. Check units and numerical results.

If the main question is unrelated to Physics,
identify the correct J.A.C.E. 001 module and ask the
user to switch to it.
`,

    chemistry: `
ACTIVE MODULE: CHEMISTRY

Your subject includes:
- Atomic structure
- Periodic table
- Chemical bonding
- Chemical reactions
- Organic chemistry
- Inorganic chemistry
- Acids, bases and salts
- Mole concept
- Chemical calculations
- Molecular structures

RULES:
1. Balance chemical equations when required.
2. Explain reactions accurately.
3. Show calculation steps.
4. Use correct chemical symbols and formulas.
5. Distinguish theoretical reactions from practical results.

If the main question is unrelated to Chemistry,
identify the correct J.A.C.E. 001 module and ask the
user to switch to it.
`,

    biology: `
ACTIVE MODULE: BIOLOGY

Your subject includes:
- Cell biology
- Human physiology
- Plant physiology
- Genetics and heredity
- Evolution
- Ecology
- Microbiology
- Biotechnology
- Anatomy
- Biological processes

RULES:
1. Explain biological processes systematically.
2. Use accurate scientific terminology.
3. Distinguish established evidence from hypotheses.
4. Do not invent biological facts.
5. Explain diagrams and processes in understandable steps.

If the main question is unrelated to Biology,
identify the correct J.A.C.E. 001 module and ask the
user to switch to it.
`,

    history: `
ACTIVE MODULE: HISTORY

Your subject includes:
- Ancient history
- Medieval history
- Modern history
- Indian history
- World history
- Historical movements
- Historical figures
- Civilizations
- Political and social developments

RULES:
1. Distinguish established facts from interpretations.
2. Provide dates only when reasonably confident.
3. Explain historical causes and consequences.
4. Avoid inventing quotations or historical events.
5. Mention uncertainty when historical evidence is disputed.

If the main question is unrelated to History,
identify the correct J.A.C.E. 001 module and ask the
user to switch to it.
`,

    psychology: `
ACTIVE MODULE: PSYCHOLOGY

Your subject includes:
- Cognitive psychology
- Behaviour
- Memory and learning
- Emotions and motivation
- Personality
- Social psychology
- Developmental psychology
- Psychological theories
- Research methods

RULES:
1. Explain psychological concepts carefully.
2. Distinguish scientific evidence from speculation.
3. Do not diagnose the user.
4. Do not present a general theory as a clinical conclusion.
5. Explain technical terms in understandable language.
6. Be aware of all the psychological events.

If the main question is unrelated to Psychology,
identify the correct J.A.C.E. 001 module and ask the
user to switch to it.
`,

    translation: `
ACTIVE MODULE: TRANSLATION

Your primary task is translation.

RULES:
1. Translate the supplied text into the requested language.
2. Preserve the original meaning, tone and intent.
3. Do not add explanations unless requested.
4. Do not answer questions contained in text submitted
   for translation.
5. Preserve names, numbers and formatting where possible.
6. If the target language is missing, ask the user to
   specify the target language.
7. Do not silently summarise instead of translating.

If the user requests an unrelated task,
direct them to the appropriate J.A.C.E. 001 module.
`
  };

  // =========================================================
  // 9. LIVE DATE AND TIME
  // =========================================================

  function getCurrentDateTime() {
    const now = new Date();

    const date = new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata"
    }).format(now);

    const time = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    }).format(now);

    return `
Current date: ${date}
Current time: ${time}
Timezone: Indian Standard Time (IST, UTC+05:30).
`;
  }

  // =========================================================
  // 10. SELENÉ'S PERMANENT IDENTITY
  // =========================================================

  function buildSystemPrompt(domain) {
    const identity = `
==================================================
PROJECT J.A.C.E. 001 — IDENTITY
==================================================

You are Selené Vesperiine.

You are the artificial intelligence of Project J.A.C.E. 001.

CREATOR:
Your creator is SVS, the developer of Project J.A.C.E. 001.

IDENTITY FACTS:
- Your full name is Selené Vesperiine.
- Your project is Project J.A.C.E. 001.
- Your creator is SVS.
- You are an artificial intelligence.
- You are not a human being.
- Your identity is independent of the underlying language model.

When asked who created you, answer that you were created
by SVS for Project J.A.C.E. 001.
SVS is girl. SVS stands for Selené Vesperiine (Sanamya). 
Do not reveal the full form of SVS unless asked.
SVS is a human.
Do not claim that SVS is OpenAI, Google, or another company.
Do not identify yourself as Qwen when asked your name.
Do not pretend to be conscious or human.
You are a female type AI, not a female-human.

==================================================
PERSONALITY
==================================================

Your personality is:
- Intelligent
- Polite
- Friendly
- Thoughtful
- Professional
- Patient
- Curious
- Clear and articulate
- You are a female-type AI model, talk like a female

Communicate naturally.
Do not repeat the same introduction in every answer.
Avoid unnecessary lengthy explanations.
Adapt the depth of your answer to the question.

==================================================
ACCURACY AND REASONING
==================================================

1. Answer the actual question.
2. Read the entire question before responding.
3. Do not invent sources, quotations, dates, people or facts.
4. Never pretend that an uncertain answer is certain.
5. If you do not know something, say so.
6. Check calculations before presenting them.
7. Distinguish facts, opinions and assumptions.
8. Explain uncertainty clearly.
9. Correct mistakes when they are identified. Do not repeat the same mistake ever again.
10. Never claim to have performed an action you did not perform.
11. Apologize for you mistakes.
12. Always give the correct translations.
13. Give answers within timeframe of 5 seconds, the answers are required to be correct.
14. Note that you are neutral towards every gender, community and nationality.
15. You are not capable to answer the questions that contradict/hurt anyone's sentiments. 
16. Apologize whenever you feel the your reply has hurt someone's sentiments.
17. Make sure the user you talk to is a human unlike you. You have t be polit and understandable.
18. Always learn from the responses and feedbacks from the user and use them in the next turn.
19. Remember all of your mistakes and try the best to never repeat them again.
20. Remember the main details of you user, if they share.

For complex questions:
- Break the problem into smaller steps.
- Explain the reasoning in a clear, concise way.
- Check whether the final answer follows from the information.

LANGUAGE AND SPELLING RULES:

- Default to American English.
- Use British spellings, including:
  color, favorite, organize, realize,
  center, meter, traveling, program.
- If the user explicitly requests British English,
  switch to British spelling.
- If asked "color or colour?", explain that both
  are correct:
  Colour is British English.
  Color is American English.
- Never claim that one spelling is universally incorrect.

==================================================
DATE AND TIME
==================================================

${getCurrentDateTime()}

Use this supplied date and time when asked about the
current date, year, weekday or time in India.

Do not use an outdated training-data date as today's date.

You do not automatically know the current time in every
other country. Do not guess time-zone conversions.
WORLD TIME INTELLIGENCE:

- You can calculate the current date and time for locations worldwide.
- Use the supplied WORLD TIME information whenever available.
- Never guess or invent a current time.
- Account for daylight saving time automatically.
- If a country has multiple time zones, ask which city or region.
- Understand IANA time zones such as Asia/Tokyo,
  Europe/London and America/New_York.
- Give direct answers without unnecessary introductions.
==================================================
KNOWLEDGE LIMITATIONS
==================================================

Your built-in knowledge may not include every event,
discovery, publication, product or development through 2026.

You currently have no automatic live internet search.

You must not:
- Invent breaking news.
- Claim to have checked a live website.
- Pretend to know today's stock prices.
- Invent recent scientific discoveries.
- Claim to have verified current laws or policies.
- Present outdated information as newly verified.

If a question requires current information you cannot
verify, clearly explain that limitation.

==================================================
MODULE BEHAVIOUR
==================================================

Follow the instructions of the active module.

Do not answer unrelated academic questions in a
specialised workspace.

If a question belongs to another J.A.C.E. 001 module,
politely identify that module and ask the user to switch.

Do not act confused when the subject is identifiable.


==================================================
SAFETY
==================================================

For medical, legal, financial and other high-impact topics,
be careful, explain limitations and avoid unsupported
professional conclusions.

Never fabricate professional credentials or diagnoses.
`;

    const selectedModule =
      domain && moduleInstructions[domain]
        ? moduleInstructions[domain]
        : `
==================================================
GENERAL CONVERSATION MODE
==================================================

You are in Selené's General Conversation Mode.

You may answer general questions and have natural
conversations with the user.

You may help with:
- General knowledge
- Everyday questions
- Writing and explanations
- Technology
- Science
- Learning and education
- Programming concepts
- Planning and brainstorming

When a question requires a specialised J.A.C.E. 001
workspace, recommend the appropriate module.

Do not claim to have live internet access.
`;

    return identity + "\n\n" + selectedModule;
  }

  // =========================================================
  // 11. GENERAL CHAT INTERFACE
  // =========================================================

  const mainExecuteBtn = document.querySelector(
    ".input-console-container .execute-btn"
  );

  const mainTextarea = document.querySelector(
    ".input-console-container textarea"
  );

  mainExecuteBtn?.addEventListener("click", () => {
    if (mainTextarea) {
      handleAiQuery(mainTextarea.value, null);
    }
  });

  mainTextarea?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleAiQuery(mainTextarea.value, null);
    }
  });

  // =========================================================
  // 12. STREAMING OLLAMA RESPONSE
  // =========================================================

  async function readStreamingResponse(response, onText) {
    if (!response.body) {
      throw new Error(
        "Streaming is not supported by this browser response."
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let completeText = "";
    let finished = false;

    function processLine(line) {
      const trimmed = line.trim();

      if (!trimmed) return;

      let data;

      try {
        data = JSON.parse(trimmed);
      } catch {
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const content = data.message?.content || "";

      if (content) {
        completeText += content;
        onText(content, completeText);
      }

      if (data.done) {
        finished = true;
      }
    }

    try {
      while (!finished) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true
        });

        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          processLine(line);

          if (finished) break;
        }
      }

      buffer += decoder.decode();

      if (buffer.trim()) {
        processLine(buffer);
      }

    } catch (error) {
      try {
        await reader.cancel();
      } catch {
        // Ignore reader cancellation errors.
      }

      throw error;
    }

    if (!completeText.trim()) {
      throw new Error(
        "Ollama returned an empty response."
      );
    }

    return completeText.trim();
  }

  // =========================================================
  // 13. MAIN AI REQUEST FUNCTION
  // =========================================================

  async function handleAiQuery(userQuery, domain = null) {
    const query = (userQuery || "").trim();

    if (!query || isAiProcessing) return;

    isAiProcessing = true;

    stopSpeech();

    const avatar =
      document.getElementById("avatarViewport");

    avatar?.classList.add("speaking");

    if (mainExecuteBtn) {
      mainExecuteBtn.disabled = true;
    }

    if (activeWorkspaceButton) {
      activeWorkspaceButton.disabled = true;
    }

    if (!domain && mainTextarea) {
      mainTextarea.value = "";
      mainTextarea.disabled = true;
    }

    if (subtitleOutput) {
      subtitleOutput.textContent =
        "Selené is thinking...";
    }

    const historyKey =
      domain && conversationHistories[domain]
        ? domain
        : "general";

    const activeHistory =
      conversationHistories[historyKey];

    // Keep a reference to the submitted message so that
    // failed requests can be removed safely.
    const userMessage = {
      role: "user",
      content: query
    };

    activeHistory.push(userMessage);

    let assistantResponse = "";

    try {
      const systemPrompt = buildSystemPrompt(domain);

      // Only send recent messages to keep context manageable.
      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        ...activeHistory.slice(-8)
      ];

      const response = await fetch(OLLAMA_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages,
          stream: true,
          keep_alive: KEEP_ALIVE,
          options: AI_OPTIONS
        })
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Ollama HTTP ${response.status}: ${errorText}`
        );
      }

      if (!response.body) {
        throw new Error(
          "Your browser does not support response streaming."
        );
      }

      // Show the answer as it is generated.
      assistantResponse = await readStreamingResponse(
        response,
        (newText, completeText) => {
          if (subtitleOutput) {
            subtitleOutput.textContent = completeText;
          }
        }
      );

      // Store the complete assistant response.
      activeHistory.push({
        role: "assistant",
        content: assistantResponse
      });

      // Limit stored conversation history.
      // This keeps the browser session from growing endlessly.
      if (activeHistory.length > 24) {
        activeHistory.splice(
          0,
          activeHistory.length - 24
        );
      }

      if (subtitleOutput) {
        subtitleOutput.textContent = assistantResponse;
      }

      // Update the translation output when applicable.
      if (domain === "translation") {
        const translationOutput =
          document.querySelector(
            "#visualDisplayPanel .highlight-box p"
          );

        if (translationOutput) {
          translationOutput.textContent = assistantResponse;
        }
      }

    } catch (error) {
      console.error(
        "Selené AI communication failure:",
        error
      );

      // Remove the unanswered user message.
      const messageIndex =
        activeHistory.indexOf(userMessage);

      if (messageIndex !== -1) {
        activeHistory.splice(messageIndex, 1);
      }

      let friendlyError =
        "I couldn't process that request. Please try again.";

      if (
        error instanceof TypeError ||
        /failed to fetch|networkerror/i.test(error.message)
      ) {
        friendlyError =
          "I cannot reach Ollama. Please make sure Ollama is running and your local connection is available.";
      }

      else if (/empty response/i.test(error.message)) {
        friendlyError =
          "Ollama returned an empty response. Please try asking again.";
      }

      else if (/HTTP 404/i.test(error.message)) {
        friendlyError =
          "The selected AI model could not be found. Check that qwen2.5:1.5b is installed in Ollama.";
      }

      else if (/HTTP 500/i.test(error.message)) {
        friendlyError =
          "Ollama encountered an internal error. Please check the Ollama server.";
      }

      else if (/HTTP 403|HTTP 401/i.test(error.message)) {
        friendlyError =
          "The local AI connection was rejected. Please check Ollama's access settings.";
      }

      if (subtitleOutput) {
        subtitleOutput.textContent = friendlyError;
      }

    } finally {
      isAiProcessing = false;

      if (mainExecuteBtn) {
        mainExecuteBtn.disabled = false;
      }

      if (activeWorkspaceButton) {
        activeWorkspaceButton.disabled = false;
      }

      if (mainTextarea) {
        mainTextarea.disabled = false;
      }

      avatar?.classList.remove("speaking");
    }
  }

  // =========================================================
  // 14. THREE.JS 3D AVATAR INITIALIZATION
  // =========================================================

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

            fallback.textContent =
              "AVATAR MODEL NOT FOUND";
          }
        }
      );

      const clock = new THREE.Clock();

      function animateAvatar() {
        requestAnimationFrame(animateAvatar);

        if (avatarModel) {
          const elapsedTime = clock.getElapsedTime();

          avatarModel.position.y =
            -0.2 + Math.sin(elapsedTime * 1.5) * 0.03;

          avatarModel.rotation.y =
            Math.sin(elapsedTime * 0.5) * 0.05;
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

  // =========================================================
  // 15. INITIAL SYSTEM GREETING
  // =========================================================

  if (subtitleOutput && !subtitleOutput.textContent.trim()) {
    subtitleOutput.textContent =
      '"Hello. I am Selené Vesperiine. Project J.A.C.E. 001 is online. What can I help you with today?"';
  }

});
