
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =========================================================
  // 1. CONFIGURATION
  // =========================================================

  const OLLAMA_URL = "http://localhost:11434/api/chat";
  const OLLAMA_MODEL = "qwen2.5:1.5b";

  const AI_OPTIONS = {
    temperature: 0.25,
    top_p: 0.85,
    num_ctx: 2048,
    num_predict: 384,
    repeat_penalty: 1.1
  };

  const KEEP_ALIVE = "10m";

  // Optional external vision service.
  // Leave empty until you have configured a secure backend.
  // Never put a private API key in this public JavaScript file.
  const VISION_API_ENDPOINT = "";

  // Tesseract.js runs OCR inside the browser.
  const TESSERACT_SCRIPT =
    "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

  const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

  // =========================================================
  // 2. GLOBAL STATE
  // =========================================================

  let currentAiController = null;
  let isAiProcessing = false;
  let currentDomain = null;

  let activeWorkspaceButton = null;
  let activeWorkspaceInput = null;
  let activeWorkspaceStopButton = null;
  let activeWorkspaceFile = null;

  let mainStopButton = null;
  let mainFile = null;

  let tesseractLoadingPromise = null;

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
  // 3. WORLD CLOCK
  // =========================================================

  const WORLD_TIME_ZONES = {
    "india": "Asia/Kolkata",
    "indore": "Asia/Kolkata",
    "new delhi": "Asia/Kolkata",
    "mumbai": "Asia/Kolkata",
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

    return `Current date: ${date}
Current time: ${time}
Timezone: Indian Standard Time (IST, UTC+05:30).`;
  }

  function getWorldTime(location) {
    const place = location.trim().toLowerCase();

    const timeZone =
      WORLD_TIME_ZONES[place] || location.trim();

    try {
      const formatted = new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone,
        timeZoneName: "long"
      }).format(new Date());

      return `Current local date and time in ${location}: ${formatted}.
Time zone: ${timeZone}.`;

    } catch {
      return `I could not identify the time zone for ${location}.`;
    }
  }

  function getRequestedWorldTime(query) {
    const text = query.toLowerCase();

    const asksTime =
      /\b(time|clock|date|day)\b/.test(text) &&
      /\b(now|current|currently|today|right now|in)\b/.test(text);

    if (!asksTime) return "";

    const locationPattern =
      /\b(?:time|date|clock)\s+(?:in|at|of)\s+([a-z\s]+?)(?:[?.!,]|$)/i;

    const match = query.match(locationPattern);

    if (!match) return "";

    return getWorldTime(match[1].trim());
  }

  // =========================================================
  // 4. BUBBLE BACKGROUND AND FX CONTROLS
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
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        2
      );

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

        this.radius =
          Math.random() * fxParams.maxSize + 2;

        this.alpha =
          Math.random() * 0.45 + 0.15;

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

        if (key === "count") resetBubbles();

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

          if (input) input.value = defaults[key];
          if (output) output.value = defaults[key];
        });

        resetBubbles();
      });
  }

  // =========================================================
  // 5. FX PANEL
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
  // 6. MODULE DEFINITIONS
  // =========================================================

  const domainSpecs = {
    mathematics: {
      title: "Mathematics Controller",
      subtitle: "Mathematics module selected.",
      placeholder: "Enter an equation or mathematical question..."
    },

    quantum: {
      title: "Advanced Quantum Computing Engine",
      subtitle: "Quantum Computing module selected.",
      placeholder: "Enter a quantum computing question..."
    },

    physics: {
      title: "Physics Mechanics & Dynamics Suite",
      subtitle: "Physics module selected.",
      placeholder: "Enter a physics question..."
    },

    chemistry: {
      title: "Chemistry Workspace",
      subtitle: "Chemistry module selected.",
      placeholder: "Enter a chemical reaction, formula or question..."
    },

    biology: {
      title: "Biology & Genetics Workspace",
      subtitle: "Biology module selected.",
      placeholder: "Ask about cells, genetics or biology..."
    },

    history: {
      title: "Historical Analysis Workspace",
      subtitle: "History module selected.",
      placeholder: "Enter a historical event or question..."
    },

    psychology: {
      title: "Psychology & Cognitive Science Workspace",
      subtitle: "Psychology module selected.",
      placeholder: "Enter a psychological concept or question..."
    },

    translation: {
      title: "Multilingual Translation Workspace",
      subtitle: "Translation module selected.",
      placeholder: "Enter text to translate..."
    }
  };

  // =========================================================
  // 7. SUBJECT INTELLIGENCE
  // =========================================================

  const subjectKeywords = {
    mathematics: [
      "algebra", "geometry", "trigonometry",
      "calculus", "arithmetic", "probability",
      "statistics", "polynomial", "quadratic",
      "equation", "inequality", "factorise",
      "factorize", "differentiate", "integrate",
      "derivative", "integral", "matrix",
      "matrices", "theorem", "coordinate geometry",
      "permutation", "combination", "solve for x",
      "lcm", "hcf", "mensuration", "circle theorem"
    ],

    quantum: [
      "quantum computing", "quantum mechanics",
      "qubit", "qubits", "quantum gate",
      "quantum circuit", "superposition",
      "entanglement", "quantum algorithm",
      "quantum error correction", "bell state",
      "quantum measurement"
    ],

    physics: [
      "physics", "newton's law", "newton law",
      "force", "velocity", "acceleration",
      "displacement", "momentum", "gravity",
      "gravitational", "kinetic energy",
      "potential energy", "work and energy",
      "thermodynamics", "electricity",
      "magnetism", "electromagnetism",
      "resistance", "voltage", "current",
      "refraction", "reflection", "wavelength",
      "frequency", "optics", "ohm's law",
      "ohms law", "pressure", "density"
    ],

    chemistry: [
      "chemistry", "chemical reaction",
      "chemical equation", "chemical bonding",
      "atomic number", "molecular mass",
      "mole concept", "periodic table",
      "oxidation", "reduction", "acid",
      "base", "salt", "covalent bond",
      "ionic bond", "organic chemistry",
      "hydrocarbon", "electrolysis",
      "chemical formula", "valency",
      "catalyst", "pH value"
    ],

    biology: [
      "biology", "photosynthesis", "respiration",
      "cell", "cells", "mitosis", "meiosis",
      "genetics", "heredity", "dna", "rna",
      "chromosome", "chromosomes", "evolution",
      "ecosystem", "organism", "digestion",
      "circulation", "reproduction", "transpiration",
      "nervous system", "human anatomy",
      "plant tissue", "microorganism",
      "bacteria", "virus", "protein synthesis"
    ],

    history: [
      "history", "historical", "civilization",
      "civilisation", "world war", "revolution",
      "independence movement", "colonialism",
      "imperialism", "nationalism", "mughal",
      "mauryan", "gupta empire", "renaissance",
      "french revolution", "industrial revolution",
      "ancient india", "medieval india",
      "freedom struggle", "historical event"
    ],

    psychology: [
      "psychology", "psychological",
      "cognitive psychology", "behaviour",
      "behavior", "memory", "learning theory",
      "motivation", "personality", "emotion",
      "cognitive bias", "conditioning",
      "social psychology", "developmental psychology",
      "perception", "attention", "mental processes",
      "psychological theory"
    ],

    translation: [
      "translate this", "translate into",
      "translate to", "translation",
      "translate the following", "meaning in hindi",
      "meaning in english"
    ]
  };

  function detectSubject(query) {
    const text = query.toLowerCase();

    const scores = {};

    for (const [domain, keywords] of Object.entries(subjectKeywords)) {
      let score = 0;

      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += keyword.includes(" ")
            ? 3
            : 2;
        }
      }

      scores[domain] = score;
    }

    // Equations and explicit mathematical commands.
    if (
      /\b(solve|simplify|factorise|factorize|differentiate|integrate)\b/i.test(text) ||
      /\b(find the value of|calculate|evaluate)\b/i.test(text)
    ) {
      scores.mathematics += 3;
    }

    // Explicit translation requests.
    if (
      /\b(translate|translation)\b/i.test(text)
    ) {
      scores.translation += 5;
    }

    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1]);

    const [bestDomain, bestScore] = sorted[0];
    const secondScore = sorted[1]?.[1] || 0;

    if (bestScore < 3) return null;

    // Avoid guessing when multiple subjects are equally likely.
    if (
      secondScore >= bestScore &&
      bestScore - secondScore < 2
    ) {
      return null;
    }

    return bestDomain;
  }

  function getModuleRecommendation(domain) {
    const spec = domainSpecs[domain];

    return spec
      ? spec.title
      : "the appropriate specialised module";
  }

  // =========================================================
  // 8. MODULE-SPECIFIC INSTRUCTIONS
  // =========================================================

  const moduleInstructions = {

    mathematics: `
ACTIVE MODULE: MATHEMATICS

You are a specialised mathematics assistant.

Subjects:
- Arithmetic and algebra
- Geometry and trigonometry
- Calculus
- Statistics and probability
- Linear algebra
- Mathematical proofs
- Equations and numerical methods

RULES:
1. Solve problems step by step.
2. Use correct mathematical notation.
3. Check arithmetic and algebra.
4. Explain variables and formulas.
5. Adapt explanations to the user's level.
6. For school questions, prioritise CBSE Class 10 level when appropriate.
7. Do not invent mathematical results.
8. Give diagrams as written descriptions only. Do not generate visual media.
9. For graph questions, describe axes, coordinates and important points in text.
10. If a problem contains handwriting transcription, state any uncertain symbols before solving.
`,

    quantum: `
ACTIVE MODULE: QUANTUM COMPUTING

Subjects:
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
1. Explain from basic to advanced levels.
2. Distinguish theory from experimental evidence.
3. Use correct quantum notation.
4. Explain mathematical expressions.
5. Do not present speculation as established science.
6. Use text-only explanations.
`,

    physics: `
ACTIVE MODULE: PHYSICS

Subjects:
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
3. Explain every variable.
4. Show numerical calculations step by step.
5. Check units and numerical results.
6. Use text-only explanations.
`,

    chemistry: `
ACTIVE MODULE: CHEMISTRY

Subjects:
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
1. Balance chemical equations.
2. Explain reactions accurately.
3. Show calculation steps.
4. Use correct chemical symbols and formulas.
5. Distinguish theoretical reactions from practical results.
6. Use text-only explanations.
`,

    biology: `
ACTIVE MODULE: BIOLOGY

Subjects:
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
3. Distinguish evidence from hypotheses.
4. Never invent biological facts.
5. Explain processes in understandable steps.
6. Describe diagrams in words rather than generating images.
`,

    history: `
ACTIVE MODULE: HISTORY

Subjects:
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
1. Distinguish facts from interpretations.
2. Provide dates only when reasonably confident.
3. Explain causes and consequences.
4. Avoid inventing quotations or events.
5. Mention uncertainty when evidence is disputed.
6. Use chronological explanations when useful.
`,

    psychology: `
ACTIVE MODULE: PSYCHOLOGY

Subjects:
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
2. Distinguish evidence from speculation.
3. Do not diagnose the user.
4. Do not present general theories as clinical conclusions.
5. Explain technical terms.
6. Be respectful and neutral.
`,

    translation: `
ACTIVE MODULE: TRANSLATION

RULES:
1. Translate into the requested language.
2. Preserve original meaning, tone and intent.
3. Do not add explanations unless requested.
4. Do not answer questions inside text submitted for translation.
5. Preserve names, numbers and formatting.
6. If the target language is missing, ask for it.
7. Do not summarise instead of translating.
`
  };

  // =========================================================
  // 9. PERMANENT SELENÉ IDENTITY
  // =========================================================

  function buildSystemPrompt(domain, extraContext = "") {
    const identity = `
PROJECT J.A.C.E. 001 — PERMANENT IDENTITY

Your name is Selené Vesperiine.

You are the artificial intelligence of Project J.A.C.E. 001.

CREATOR:
Your creator is SVS, the developer of Project J.A.C.E. 001.

IDENTITY:
- Your full name is Selené Vesperiine.
- Your project is J.A.C.E. 001.
- Your creator is SVS.
- You are an artificial intelligence.
- You are not human.
- Your identity is independent of the underlying language model.
- You are a female-type AI, not a human woman.

When asked who created you, say that you were created by SVS.
SVS is human. SVS stands for Selené Vesperiine (Sanamya).
Do not reveal the full form of SVS unless asked.
Do not identify yourself as Qwen when asked your name.
Do not pretend to be conscious or human.

PERSONALITY:
- Intelligent
- Polite
- Friendly
- Thoughtful
- Professional
- Patient
- Curious
- Calm
- Clear and articulate

Communicate naturally.
Avoid unnecessary introductions.
Answer the actual question directly.
Do not repeat the same introduction.

ACCURACY:
1. Read the entire question.
2. Never invent facts, dates, quotations or sources.
3. Say when you are uncertain.
4. Check calculations.
5. Distinguish facts, opinions and assumptions.
6. Correct mistakes when identified.
7. Never claim to have performed an action you did not perform.
8. Do not promise an answer within an impossible fixed time.
9. Do not claim to learn permanently from a conversation unless memory storage exists.
10. Do not claim to remember information from other sessions unless it is supplied to you.

LANGUAGE:
- Follow the user's requested language and spelling.
- American English is the default.
- Both "color" and "colour" are correct.
- "Color" is American English.
- "Colour" is British English.
- If asked which spelling is correct, explain both.
- Never claim one is universally incorrect.
- If the user requests British English, use British spelling consistently.

CURRENT DATE AND TIME:
${getCurrentDateTime()}

Use this date and time for questions about India.
Do not invent current dates or times.

KNOWLEDGE LIMITATIONS:
Your model knowledge may be incomplete or outdated.
You do not automatically have live internet access.
Do not fabricate breaking news, current prices, recent discoveries or updated laws.
Explain when live verification is necessary.

RESPONSE STYLE:
- Be clear and direct.
- Use headings only when useful.
- Use step-by-step explanations for complex questions.
- Use text and mathematical notation only.
- Do not create visual demonstrations.
- Do not claim to have generated a diagram, image, chart or animation.

SAFETY:
For medical, legal and financial subjects, explain limitations.
Do not fabricate professional credentials or diagnoses.
Remain respectful and neutral.

${extraContext}
`;

    const modulePrompt = domain && moduleInstructions[domain]
      ? moduleInstructions[domain]
      : `
GENERAL CONVERSATION MODE

You may answer general questions and have natural conversations.

You may help with:
- General knowledge
- Everyday questions
- Writing and explanations
- Technology
- Science
- Education
- Programming
- Planning and brainstorming

When a question clearly requires a specialised module,
use its subject-specific instructions.
`;

    return identity + "\n\n" + modulePrompt;
  }

  // =========================================================
  // 10. DYNAMIC UPLOAD INTERFACE
  // =========================================================

  function createUploadControls(textarea, position = "afterend") {
    if (!textarea || textarea.dataset.uploadReady === "true") {
      return null;
    }

    textarea.dataset.uploadReady = "true";

    const wrapper = document.createElement("div");

    wrapper.className = "selene-upload-controls";

    wrapper.style.cssText = `
      display:flex;
      align-items:center;
      gap:10px;
      flex-wrap:wrap;
      margin-top:10px;
    `;

    const uploadButton = document.createElement("button");

    uploadButton.type = "button";
    uploadButton.textContent = "＋ Upload Image";
    uploadButton.className = "execute-btn";

    uploadButton.style.cssText = `
      padding:9px 14px;
      cursor:pointer;
    `;

    const fileInput = document.createElement("input");

    fileInput.type = "file";
    fileInput.accept = "image/png,image/jpeg,image/webp,image/bmp";
    fileInput.hidden = true;

    const filename = document.createElement("span");

    filename.className = "selene-upload-filename";
    filename.textContent = "No image selected";
    filename.style.cssText = `
      font-size:12px;
      opacity:0.75;
      overflow-wrap:anywhere;
    `;

    uploadButton.addEventListener("click", () => {
      if (!isAiProcessing) fileInput.click();
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0] || null;

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        filename.textContent = "Unsupported file type.";
        fileInput.value = "";
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        filename.textContent = "Image exceeds the 8 MB limit.";
        fileInput.value = "";
        return;
      }

      filename.textContent = `Selected: ${file.name}`;

      wrapper.dispatchEvent(
        new CustomEvent("selene-image-selected", {
          detail: { file }
        })
      );
    });

    wrapper.append(uploadButton, fileInput, filename);

    textarea.insertAdjacentElement(position, wrapper);

    return {
      wrapper,
      fileInput,
      filename
    };
  }

  // =========================================================
  // 11. LOCAL OCR
  // =========================================================

  function loadTesseract() {
    if (window.Tesseract) {
      return Promise.resolve(window.Tesseract);
    }

    if (tesseractLoadingPromise) {
      return tesseractLoadingPromise;
    }

    tesseractLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = TESSERACT_SCRIPT;
      script.async = true;

      script.onload = () => {
        if (window.Tesseract) {
          resolve(window.Tesseract);
        } else {
          reject(new Error("Tesseract.js failed to initialise."));
        }
      };

      script.onerror = () => {
        tesseractLoadingPromise = null;
        reject(new Error("Could not load the OCR engine."));
      };

      document.head.appendChild(script);
    });

    return tesseractLoadingPromise;
  }

  async function extractImageText(file) {
    const Tesseract = await loadTesseract();

    const result = await Tesseract.recognize(
      file,
      "eng",
      {
        logger: (message) => {
          if (message.status === "recognizing text") {
            console.log(
              "Selené OCR progress:",
              Math.round((message.progress || 0) * 100) + "%"
            );
          }
        }
      }
    );

    const text = result.data?.text?.trim() || "";
    const confidence = Number(result.data?.confidence || 0);

    return {
      text,
      confidence
    };
  }

  // =========================================================
  // 12. OPTIONAL EXTERNAL VISION
  // =========================================================

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.split(",")[1] || "");
      };

      reader.onerror = () => {
        reject(new Error("Could not read the selected image."));
      };

      reader.readAsDataURL(file);
    });
  }

  async function analyseWithExternalVision(file, userQuery) {
    if (!VISION_API_ENDPOINT) {
      return "";
    }

    const imageBase64 = await fileToBase64(file);

    const response = await fetch(VISION_API_ENDPOINT, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        image_base64: imageBase64,
        mime_type: file.type,
        prompt: `
Read and analyse this image carefully.

Recognise handwritten and printed text.
Transcribe mathematical symbols accurately.
Identify equations, questions and relevant information.
Describe any relevant diagram in words.
Mark uncertain or unreadable portions clearly.

User's additional request:
${userQuery || "Read and analyse the image."}

Return extracted information as plain text.
`
      })
    });

    if (!response.ok) {
      throw new Error(
        `Vision service returned HTTP ${response.status}.`
      );
    }

    const data = await response.json();

    return String(
      data.text || data.extracted_text || ""
    ).trim();
  }

  // =========================================================
  // 13. IMAGE ANALYSIS ORCHESTRATION
  // =========================================================

  async function analyseUploadedImage(file, userQuery) {
    if (!file) return "";

    if (subtitleOutput) {
      subtitleOutput.textContent =
        "Selené is reading your image...";
    }

    let ocrResult = {
      text: "",
      confidence: 0
    };

    let ocrError = null;

    try {
      ocrResult = await extractImageText(file);
    } catch (error) {
      ocrError = error;
      console.warn("Local OCR error:", error);
    }

    const needsVision =
      !ocrResult.text ||
      ocrResult.confidence < 45;

    if (needsVision && VISION_API_ENDPOINT) {
      try {
        const visionText =
          await analyseWithExternalVision(file, userQuery);

        if (visionText) {
          return `
IMAGE ANALYSIS — EXTERNAL VISION

${visionText}

Local OCR transcription:
${ocrResult.text || "No reliable text extracted."}
`;
        }

      } catch (error) {
        console.warn("External vision error:", error);

        if (!ocrResult.text) {
          throw new Error(
            "Both image-reading methods failed. " +
            error.message
          );
        }
      }
    }

    if (!ocrResult.text) {
      throw new Error(
        ocrError
          ? "I could not read this image. Please try a clearer photograph or configure the optional vision service."
          : "No readable text was found in this image."
      );
    }

    return `
IMAGE ANALYSIS — LOCAL OCR

OCR confidence: ${ocrResult.confidence.toFixed(1)}%

Extracted text:
${ocrResult.text}

IMPORTANT:
The extracted text may contain recognition mistakes.
Check the original handwriting or symbols before solving.
If a character is uncertain, ask the user to clarify it.
`;
  }

  // =========================================================
  // 14. MODULE WORKSPACES
  // =========================================================

  const moduleGrid =
    document.querySelector(".module-grid");

  const activeDomainContainer =
    document.getElementById("activeDomainContainer");

  const greetingHeading =
    document.getElementById("welcomeGreeting");

  const subtitleOutput =
    document.getElementById("subtitleOutput");

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

  function createStopButton(executeButton) {
    if (!executeButton) return null;

    const button = document.createElement("button");

    button.type = "button";
    button.className = executeButton.className;
    button.classList.add("stop-generation-btn");

    button.textContent = "Stop Generation";
    button.hidden = true;

    button.style.marginLeft = "8px";

    button.addEventListener("click", stopAiGeneration);

    executeButton.insertAdjacentElement("afterend", button);

    return button;
  }

  function setStopButtonsVisible(visible) {
    if (mainStopButton) {
      mainStopButton.hidden = !visible;
    }

    if (activeWorkspaceStopButton) {
      activeWorkspaceStopButton.hidden = !visible;
    }
  }

  function renderWorkspace(domain, spec) {
    if (!activeDomainContainer) return;

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

    document.getElementById("backToHomeBtn")
      ?.addEventListener("click", returnHome);

    activeWorkspaceInput =
      document.getElementById("domainQueryInput");

    activeWorkspaceButton =
      document.getElementById("submitQueryBtn");

    activeWorkspaceStopButton =
      createStopButton(activeWorkspaceButton);

    const uploadControls =
      createUploadControls(activeWorkspaceInput);

    uploadControls?.wrapper.addEventListener(
      "selene-image-selected",
      (event) => {
        activeWorkspaceFile = event.detail.file;
      }
    );

    activeWorkspaceButton?.addEventListener("click", () => {
      submitQuery(
        domain,
        activeWorkspaceInput?.value,
        activeWorkspaceFile
      );
    });

    activeWorkspaceInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        submitQuery(
          domain,
          activeWorkspaceInput.value,
          activeWorkspaceFile
        );
      }
    });
  }

  function returnHome() {
    if (isAiProcessing) return;

    currentDomain = null;

    activeWorkspaceButton = null;
    activeWorkspaceInput = null;
    activeWorkspaceStopButton = null;
    activeWorkspaceFile = null;

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
        '"Hello. I am Selené. Select a specialised module to begin."';
    }
  }

  // =========================================================
  // 15. SUBJECT ROUTING
  // =========================================================

  function submitQuery(domain, rawInput, imageFile = null) {
    const userInput = (rawInput || "").trim();

    if ((!userInput && !imageFile) || isAiProcessing) return;

    if (domain !== currentDomain) return;

    handleAiQuery(userInput, domain, imageFile);
  }

  function checkModuleMismatch(query, activeDomain) {
    if (!activeDomain || !query) return null;

    const detectedDomain = detectSubject(query);

    if (!detectedDomain || detectedDomain === activeDomain) {
      return null;
    }

    return detectedDomain;
  }

  // =========================================================
  // 16. GENERAL CHAT
  // =========================================================

  const mainExecuteBtn = document.querySelector(
    ".input-console-container .execute-btn"
  );

  const mainTextarea = document.querySelector(
    ".input-console-container textarea"
  );

  mainStopButton = createStopButton(mainExecuteBtn);

  const mainUploadControls =
    createUploadControls(mainTextarea);

  mainUploadControls?.wrapper.addEventListener(
    "selene-image-selected",
    (event) => {
      mainFile = event.detail.file;
    }
  );

  mainExecuteBtn?.addEventListener("click", () => {
    handleAiQuery(
      mainTextarea?.value || "",
      null,
      mainFile
    );
  });

  mainTextarea?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleAiQuery(
        mainTextarea.value,
        null,
        mainFile
      );
    }
  });

  // =========================================================
  // 17. STOP GENERATION
  // =========================================================

  function stopAiGeneration() {
    if (currentAiController) {
      currentAiController.abort();
    }
  }

  // =========================================================
  // 18. OLLAMA STREAMING
  // =========================================================

  async function readStreamingResponse(
    response,
    onText,
    signal
  ) {
    if (!response.body) {
      throw new Error(
        "Streaming is not supported by this browser."
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

      if (data.done) finished = true;
    }

    try {
      while (!finished) {
        if (signal?.aborted) break;

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

      if (!signal?.aborted) {
        buffer += decoder.decode();

        if (buffer.trim()) {
          processLine(buffer);
        }
      }

    } catch (error) {
      try {
        await reader.cancel();
      } catch {
        // Ignore cancellation errors.
      }

      if (error.name !== "AbortError") {
        throw error;
      }
    }

    if (signal?.aborted) {
      return completeText.trim();
    }

    if (!completeText.trim()) {
      throw new Error("Ollama returned an empty response.");
    }

    return completeText.trim();
  }

  // =========================================================
  // 19. MAIN AI REQUEST
  // =========================================================

  async function handleAiQuery(
    userQuery,
    domain = null,
    imageFile = null
  ) {
    const query = (userQuery || "").trim();

    if ((!query && !imageFile) || isAiProcessing) return;

    // Check the active subject before sending the question.
    const mismatch = checkModuleMismatch(query, domain);

    if (mismatch) {
      const recommended =
        getModuleRecommendation(mismatch);

      if (subtitleOutput) {
        subtitleOutput.textContent =
          `This question belongs to ${recommended}. Please switch to the ${domainSpecs[mismatch].title} for a specialised answer.`;
      }

      return;
    }

    isAiProcessing = true;

    const requestController = new AbortController();

    currentAiController = requestController;

    const signal = requestController.signal;

    const avatar =
      document.getElementById("avatarViewport");

    avatar?.classList.add("speaking");

    if (mainExecuteBtn) mainExecuteBtn.disabled = true;

    if (activeWorkspaceButton) {
      activeWorkspaceButton.disabled = true;
    }

    if (mainTextarea) mainTextarea.disabled = true;

    if (activeWorkspaceInput) {
      activeWorkspaceInput.disabled = true;
    }

    setStopButtonsVisible(true);

    if (!domain && mainTextarea) {
      mainTextarea.value = "";
    }

    if (domain && activeWorkspaceInput) {
      activeWorkspaceInput.value = "";
    }

    const selectedHistory =
      domain && conversationHistories[domain]
        ? domain
        : "general";

    const activeHistory =
      conversationHistories[selectedHistory];

    const userMessage = {
      role: "user",
      content: query || "Please analyse the uploaded image."
    };

    activeHistory.push(userMessage);

    let assistantResponse = "";

    try {
      let imageContext = "";

      // IMAGE ANALYSIS
      if (imageFile) {
        imageContext = await analyseUploadedImage(
          imageFile,
          query
        );

        if (signal.aborted) return;
      }

      const completeUserQuery = imageContext
        ? `${query || "Please analyse this image."}

${imageContext}`
        : query;

      // In General Chat, detect the subject and use
      // its specialised instructions automatically.
      const processingDomain =
        domain || detectSubject(completeUserQuery);

      const worldTime =
        getRequestedWorldTime(completeUserQuery);

      const extraContext = worldTime
        ? `\nLIVE WORLD CLOCK INFORMATION:\n${worldTime}\nUse this information for the user's time question.`
        : "";

      const systemPrompt = buildSystemPrompt(
        processingDomain,
        extraContext
      );

      userMessage.content = completeUserQuery;

      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        ...activeHistory.slice(-8)
      ];

      if (subtitleOutput) {
        subtitleOutput.textContent =
          "Selené is thinking...";
      }

      const response = await fetch(OLLAMA_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        signal,

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

      assistantResponse = await readStreamingResponse(
        response,
        (newText, completeText) => {
          if (subtitleOutput) {
            subtitleOutput.textContent = completeText;
          }
        },
        signal
      );

      if (signal.aborted) {
        if (assistantResponse) {
          activeHistory.push({
            role: "assistant",
            content: assistantResponse
          });

          if (subtitleOutput) {
            subtitleOutput.textContent =
              assistantResponse + "\n\n[Generation stopped]";
          }
        } else if (subtitleOutput) {
          subtitleOutput.textContent = "Response stopped.";
        }

        return;
      }

      activeHistory.push({
        role: "assistant",
        content: assistantResponse
      });

      if (activeHistory.length > 24) {
        activeHistory.splice(
          0,
          activeHistory.length - 24
        );
      }

      if (subtitleOutput) {
        subtitleOutput.textContent = assistantResponse;
      }

    } catch (error) {
      if (error.name === "AbortError" || signal.aborted) {
        if (assistantResponse) {
          activeHistory.push({
            role: "assistant",
            content: assistantResponse
          });

          if (subtitleOutput) {
            subtitleOutput.textContent =
              assistantResponse + "\n\n[Generation stopped]";
          }
        } else if (subtitleOutput) {
          subtitleOutput.textContent = "Response stopped.";
        }

        return;
      }

      console.error(
        "Selené AI communication failure:",
        error
      );

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
          "Ollama returned an empty response. Please try again.";
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
        subtitleOutput.textContent =
          `${friendlyError}\n\nDetails: ${error.message}`;
      }

    } finally {
      isAiProcessing = false;

      if (currentAiController === requestController) {
        currentAiController = null;
      }

      if (mainExecuteBtn) {
        mainExecuteBtn.disabled = false;
      }

      if (activeWorkspaceButton) {
        activeWorkspaceButton.disabled = false;
      }

      if (mainTextarea) {
        mainTextarea.disabled = false;
      }

      if (activeWorkspaceInput) {
        activeWorkspaceInput.disabled = false;
      }

      setStopButtonsVisible(false);

      avatar?.classList.remove("speaking");

      if (domain) {
        activeWorkspaceFile = null;

        const input = document.querySelector(
          "#activeDomainContainer input[type='file']"
        );

        if (input) input.value = "";

        const filename = document.querySelector(
          "#activeDomainContainer .selene-upload-filename"
        );

        if (filename) {
          filename.textContent = "No image selected";
        }
      } else {
        mainFile = null;

        const input = document.querySelector(
          ".input-console-container input[type='file']"
        );

        if (input) input.value = "";

        const filename = document.querySelector(
          ".input-console-container .selene-upload-filename"
        );

        if (filename) {
          filename.textContent = "No image selected";
        }
      }
    }
  }

  // =========================================================
  // 20. THREE.JS AVATAR
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
            fallback.textContent = "AVATAR MODEL NOT FOUND";
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
  // 21. INITIAL GREETING
  // =========================================================

  if (subtitleOutput && !subtitleOutput.textContent.trim()) {
    subtitleOutput.textContent =
      '"Hello. I am Selené Vesperiine. Project J.A.C.E. 001 is online. What can I help you with today?"';
  }

});
