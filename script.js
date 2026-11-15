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
    num_ctx: 4096,
    num_predict: 768,
    repeat_penalty: 1.1
  };

  const KEEP_ALIVE = "10m";
  // =========================================================
  // TRAINING DATASET CONNECTION
  // =========================================================

  const TRAINING_DATASETS = {
    subjects:
      "https://raw.githubusercontent.com/JasmineSV197/J.A.C.E.-001/main/training/training/subject_training.jsonl",

    responses:
      "https://raw.githubusercontent.com/JasmineSV197/J.A.C.E.-001/main/training/training/response_training.jsonl"
  };

  const MAX_TRAINING_EXAMPLES = 3;
  const MAX_TRAINING_CONTEXT_CHARS = 5000;

  let subjectTrainingExamples = [];
  let responseTrainingExamples = [];

  let trainingLoadPromise = null;

  const trainingStatus = {
    loaded: false,
    subjectExamples: 0,
    responseExamples: 0,
    errors: []
  };
  // External vision is disabled until a secure backend is configured.
  // Never put private API keys in this public JavaScript file.
  const VISION_API_ENDPOINT = "";

  const TESSERACT_SCRIPT =
    "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

  const MERMAID_SCRIPT =
    "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";

  const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

  const SUPPORTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp"
  ];

  // =========================================================
  // 2. GLOBAL STATE
  // =========================================================

  let currentAiController = null;
  let isAiProcessing = false;

  let tesseractLoadingPromise = null;
  let mermaidLoadingPromise = null;

  let selectedAcademicImage = null;
  let extractedImageText = "";
  let academicImagePurpose = null;

  // Each selected file must be explicitly confirmed.
  const confirmedAcademicFiles = new WeakSet();

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
  // 3. BUBBLE BACKGROUND AND FX CONTROLS
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
    let animationFrame = null;

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

      animationFrame =
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

  // =========================================================
  // 4. FX PANEL
  // =========================================================

  const fxPanel = document.getElementById("fxPanel");
  const toggleFxBtn =
    document.getElementById("toggleFxPanelBtn");

  toggleFxBtn?.addEventListener("click", () => {
    if (!fxPanel) return;

    const isHidden =
      fxPanel.classList.toggle("hidden");

    toggleFxBtn.setAttribute(
      "aria-expanded",
      String(!isHidden)
    );
  });

  // =========================================================
  // 5. MODULE DEFINITIONS
  // =========================================================

  const domainSpecs = {
    mathematics: {
      title: "Mathematics Controller",
      subtitle: "Mathematics module selected.",
      placeholder:
        "Enter an equation or mathematical question..."
    },

    quantum: {
      title: "Advanced Quantum Computing Engine",
      subtitle: "Quantum Computing module selected.",
      placeholder:
        "Enter a quantum computing question..."
    },

    physics: {
      title: "Physics Mechanics & Dynamics Suite",
      subtitle: "Physics module selected.",
      placeholder:
        "Enter a physics question..."
    },

    chemistry: {
      title: "Chemistry Workspace",
      subtitle: "Chemistry module selected.",
      placeholder:
        "Enter a chemical reaction, formula or question..."
    },

    biology: {
      title: "Biology & Genetics Workspace",
      subtitle: "Biology module selected.",
      placeholder:
        "Ask about cells, genetics or biology..."
    },

    history: {
      title: "Historical Analysis Workspace",
      subtitle: "History module selected.",
      placeholder:
        "Enter a historical event or question..."
    },

    psychology: {
      title: "Psychology & Cognitive Science Workspace",
      subtitle: "Psychology module selected.",
      placeholder:
        "Enter a psychological concept or question..."
    },

    translation: {
      title: "Multilingual Translation Workspace",
      subtitle: "Translation module selected.",
      placeholder:
        "Enter text to translate..."
    }
  };

  // =========================================================
  // 6. SUBJECT INTELLIGENCE
  // =========================================================


  // =========================================================
  // 6. SUBJECT INTELLIGENCE — MODULE RECOGNITION
  // =========================================================

  const subjectKeywords = {
    mathematics: [
      "mathematics", "maths", "algebra", "geometry",
      "trigonometry", "calculus", "arithmetic",
      "probability", "statistics", "polynomial",
      "quadratic equation", "linear equation",
      "inequality", "factorise", "factorize",
      "differentiate", "integration", "integrate",
      "derivative", "integral", "matrix", "matrices",
      "theorem", "coordinate geometry",
      "permutation", "combination", "lcm", "hcf",
      "mensuration", "circle theorem", "pythagoras",
      "sequence and series", "logarithm",
      "simultaneous equations", "number theory",
      "vector algebra", "differential equation",
      "simplify the expression", "solve for x",
      "find the value of x", "calculate the area",
      "calculate the perimeter"
    ],

    quantum: [
      "quantum computing", "quantum mechanics",
      "qubit", "qubits", "quantum gate",
      "quantum circuit", "superposition",
      "entanglement", "quantum algorithm",
      "quantum error correction", "bell state",
      "quantum measurement", "quantum register",
      "quantum teleportation", "quantum supremacy",
      "quantum information", "dirac notation",
      "quantum state", "quantum bit"
    ],

    physics: [
      "physics", "newton's law", "newton law",
      "force", "velocity", "acceleration",
      "displacement", "momentum", "gravity",
      "gravitational force", "kinetic energy",
      "potential energy", "work and energy",
      "thermodynamics", "electricity",
      "magnetism", "electromagnetism",
      "resistance", "voltage", "electric current",
      "refraction", "reflection", "wavelength",
      "frequency", "optics", "ohm's law",
      "ohms law", "pressure", "density",
      "circular motion", "projectile motion",
      "centripetal force", "electromagnetic induction",
      "electric field", "magnetic field",
      "wave motion", "simple harmonic motion",
      "laws of motion", "speed of light",
      "gravitational potential", "specific heat",
      "refractive index", "lens formula",
      "mirror formula", "resistance in a circuit"
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
      "catalyst", "pH value", "ph scale",
      "chemical equilibrium", "reaction rate",
      "molarity", "stoichiometry",
      "electron configuration", "isotope",
      "isotopes", "oxidation state",
      "redox reaction", "chemical kinetics",
      "organic compound", "functional group",
      "periodic properties", "mole ratio",
      "balancing chemical equations",
      "enthalpy change", "activation energy"
    ],

    biology: [
      "biology", "photosynthesis", "respiration",
      "cell", "cells", "cell division",
      "cell membrane", "cell organelle",
      "mitosis", "meiosis", "genetics",
      "heredity", "dna", "rna",
      "chromosome", "chromosomes", "evolution",
      "ecosystem", "organism", "digestion",
      "circulation", "reproduction", "transpiration",
      "nervous system", "human anatomy",
      "plant tissue", "microorganism",
      "bacteria", "virus", "protein synthesis",
      "natural selection", "food chain",
      "food web", "ecosystem", "biodiversity",
      "human physiology", "plant physiology",
      "genetic inheritance", "punnett square",
      "respiratory system", "digestive system",
      "excretory system", "blood circulation",
      "chlorophyll", "stomata", "pollination",
      "fertilisation", "fertilization"
    ],

    history: [
      "history", "historical", "civilization",
      "civilisation", "world war", "revolution",
      "independence movement", "colonialism",
      "imperialism", "nationalism", "mughal",
      "mauryan", "gupta empire", "renaissance",
      "french revolution", "industrial revolution",
      "ancient india", "medieval india",
      "freedom struggle", "historical event",
      "first world war", "second world war",
      "world war one", "world war two",
      "indian independence", "british rule",
      "non cooperation movement",
      "civil disobedience movement",
      "quit india movement", "harappan civilization",
      "indus valley civilization",
      "historical chronology", "historical source",
      "treaty of versailles"
    ],

    psychology: [
      "psychology", "psychological",
      "cognitive psychology", "behaviour",
      "behavior", "memory", "learning theory",
      "motivation", "personality", "emotion",
      "cognitive bias", "conditioning",
      "social psychology", "developmental psychology",
      "perception", "attention", "mental processes",
      "psychological theory", "classical conditioning",
      "operant conditioning", "working memory",
      "long term memory", "short term memory",
      "personality theory", "social behaviour",
      "social behavior", "cognitive development",
      "human cognition", "psychological research",
      "reinforcement", "neuropsychology"
    ],

    translation: [
      "translate this", "translate into",
      "translate to", "translation",
      "translate the following", "meaning in hindi",
      "meaning in english", "translate this sentence",
      "translate this paragraph", "translate this text",
      "convert into english", "convert into hindi",
      "source language", "target language"
    ]
  };

  const subjectDisplayNames = {
    mathematics: "Mathematics",
    quantum: "Quantum Computing",
    physics: "Physics",
    chemistry: "Chemistry",
    biology: "Biology",
    history: "History",
    psychology: "Psychology",
    translation: "Translation"
  };

  function escapeSubjectKeyword(keyword) {
    return keyword.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }

  function detectSubjects(query) {
    const text = String(query || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    if (!text) return [];

    const scores = {};

    for (const [domain, keywords] of Object.entries(subjectKeywords)) {
      let score = 0;

      for (const keyword of keywords) {
        const escaped = escapeSubjectKeyword(keyword);

        const pattern = new RegExp(
          `(^|[^a-z0-9])${escaped}($|[^a-z0-9])`,
          "i"
        );

        if (pattern.test(text)) {
          // Multi-word specialist phrases carry more weight.
          score += keyword.includes(" ") ? 3 : 1;
        }
      }

      scores[domain] = score;
    }

    // Recognise common mathematical expressions even
    // when the user does not write the word "mathematics".
    const mathematicalExpression =
      /(?:\d+\s*[+\-*/=]\s*\d+)|(?:\b[a-z]\s*=\s*[-+]?\d+)/i.test(text);

    const mathematicalCommand =
      /\b(solve|simplify|factorise|factorize|differentiate|integrate|evaluate the expression)\b/i.test(text);

    if (mathematicalExpression) {
      scores.mathematics += 4;
    }

        if (mathematicalCommand) {
      scores.mathematics += 3;
    }

    // Use labelled training questions as additional
    // evidence for subject recognition.
    const learnedSubjectScores =
      getSubjectDatasetScores(text);

    for (const [subject, score] of Object.entries(
      learnedSubjectScores
    )) {
      scores[subject] =
        (scores[subject] || 0) + score;
    }

    return Object.entries(scores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([domain]) => domain);
  }

  // Maintains compatibility with the rest of your script.
  function detectSubject(query) {
    return detectSubjects(query)[0] || "general";
  }
  // =========================================================
  // 6A. TRAINING DATASET LOADER
  // =========================================================

  function parseJaceJsonl(text) {
    const records = [];

    const lines = String(text || "").split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      try {
        records.push(JSON.parse(line));
      } catch (error) {
        console.warn(
          `[J.A.C.E. TRAINING] Invalid JSONL at line ${i + 1}.`,
          error
        );
      }
    }

    return records;
  }

  async function fetchJaceDataset(url, datasetName) {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(
        `${datasetName} dataset returned HTTP ${response.status}.`
      );
    }

    return parseJaceJsonl(await response.text());
  }

  function extractSubjectTrainingRecords(records) {
    const examples = [];

    for (const record of records) {
      // Subject-classification format:
      // {"question":"...","subject":"mathematics"}

      if (
        typeof record.question === "string" &&
        typeof record.subject === "string"
      ) {
        examples.push({
          question: record.question.trim(),
          subject: record.subject.trim().toLowerCase()
        });

        continue;
      }

      // Ignore question-answer records in this file.
      // They belong to response training.
    }

    return examples.filter(example =>
      example.question &&
      subjectDisplayNames[example.subject]
    );
  }

  function extractResponseTrainingRecords(records) {
    const examples = [];

    for (const record of records) {
      if (!Array.isArray(record.messages)) continue;

      const userMessage = record.messages.find(
        message =>
          message?.role === "user" &&
          typeof message.content === "string"
      );

      const assistantMessage = record.messages.find(
        message =>
          message?.role === "assistant" &&
          typeof message.content === "string"
      );

      if (!userMessage || !assistantMessage) continue;

      const question = userMessage.content.trim();
      const answer = assistantMessage.content.trim();

      if (!question || !answer) continue;

      examples.push({
        question,
        answer
      });
    }

    return examples;
  }

  async function loadTrainingDatasets() {
    if (trainingLoadPromise) {
      return trainingLoadPromise;
    }

    trainingLoadPromise = (async () => {
      trainingStatus.errors = [];

      const results = await Promise.allSettled([
        fetchJaceDataset(
          TRAINING_DATASETS.subjects,
          "Subject"
        ),

        fetchJaceDataset(
          TRAINING_DATASETS.responses,
          "Response"
        )
      ]);

      if (results[0].status === "fulfilled") {
        subjectTrainingExamples =
          extractSubjectTrainingRecords(
            results[0].value
          );
      } else {
        trainingStatus.errors.push(
          "Subject dataset: " +
          results[0].reason.message
        );
      }

      if (results[1].status === "fulfilled") {
        responseTrainingExamples =
          extractResponseTrainingRecords(
            results[1].value
          );
      } else {
        trainingStatus.errors.push(
          "Response dataset: " +
          results[1].reason.message
        );
      }

      trainingStatus.subjectExamples =
        subjectTrainingExamples.length;

      trainingStatus.responseExamples =
        responseTrainingExamples.length;

      trainingStatus.loaded =
        results.some(result =>
          result.status === "fulfilled"
        );

      console.info(
        "[J.A.C.E. TRAINING] Dataset loading report:",
        {
          loaded: trainingStatus.loaded,
          subjectExamples:
            trainingStatus.subjectExamples,
          responseExamples:
            trainingStatus.responseExamples,
          errors: trainingStatus.errors
        }
      );

      return trainingStatus;
    })();

    return trainingLoadPromise;
  }

  // =========================================================
  // 6B. SUBJECT DATASET MATCHING
  // =========================================================

  function getJaceWords(text) {
    const ignoredWords = new Set([
      "the", "and", "for", "with", "from",
      "that", "this", "then", "than", "find",
      "what", "when", "where", "which", "show",
      "give", "your", "have", "does", "using",
      "into", "calculate", "explain", "question",
      "answer", "please", "solve", "determine"
    ]);

    return new Set(
      String(text || "")
        .toLowerCase()
        .match(/[a-z]{3,}/g)
        ?.filter(word => !ignoredWords.has(word)) || []
    );
  }

  function getSubjectDatasetScores(query) {
    const queryWords = getJaceWords(query);

    const scores = {};

    if (queryWords.size < 2) return scores;

    for (const example of subjectTrainingExamples) {
      const exampleWords =
        getJaceWords(example.question);

      let overlap = 0;

      for (const word of queryWords) {
        if (exampleWords.has(word)) {
          overlap++;
        }
      }

      const similarity =
        overlap / queryWords.size;

      if (overlap >= 2 && similarity >= 0.25) {
        scores[example.subject] =
          (scores[example.subject] || 0) + 2;
      }
    }

    return scores;
  }

  // =========================================================
  // 6C. RESPONSE EXAMPLE RETRIEVAL
  // =========================================================

  function selectRelevantTrainingExamples(
    question,
    domain = "general"
  ) {
    const queryWords = getJaceWords(question);

    if (
      queryWords.size < 2 ||
      !responseTrainingExamples.length
    ) {
      return [];
    }

    const rankedExamples = [];

    for (const example of responseTrainingExamples) {
      const exampleWords =
        getJaceWords(example.question);

      let overlap = 0;

      for (const word of queryWords) {
        if (exampleWords.has(word)) {
          overlap++;
        }
      }

      if (overlap < 2) continue;

      const similarity =
        overlap / queryWords.size;

      if (similarity < 0.25) continue;

      const exampleSubjects =
        detectSubjects(example.question);

      // Prefer examples from the active specialist module.
      const domainBonus =
        domain !== "general" &&
        exampleSubjects.includes(domain)
          ? 0.25
          : 0;

      rankedExamples.push({
        ...example,
        score: similarity + domainBonus
      });
    }

    rankedExamples.sort(
      (a, b) => b.score - a.score
    );

    const selected = [];
    let totalCharacters = 0;

    for (const example of rankedExamples) {
      if (selected.length >= MAX_TRAINING_EXAMPLES) {
        break;
      }

      const estimatedSize =
        example.question.length +
        example.answer.length;

      if (
        totalCharacters + estimatedSize >
        MAX_TRAINING_CONTEXT_CHARS
      ) {
        continue;
      }

      selected.push(example);

      totalCharacters += estimatedSize;
    }

    return selected;
  }

  function getJaceTrainingStatus() {
    return {
      ...trainingStatus
    };
  }

  // =========================================================
  // 7. SPECIALIST ACADEMIC INSTRUCTIONS
  // =========================================================

  const subjectInstructions = {
    general: `
IDENTITY:
You are Selené Vesperiine, the academic and research
intelligence of Project J.A.C.E. 001, created by SVS.
You are very polite and you cannot be rude anyhow.
You also need to be very respectful.
Your answers need to be understandable.

PURPOSE:
- You exist exclusively for academic and research purposes.
- You are not a social chatbot, entertainment system,
  or general-purpose personal assistant.
- Do not engage in unrelated casual conversations.
- Your identity knowledge is limited to your name,
  project purpose, and creator SVS.
- Do not invent personal or project details.

ACADEMIC RESPONSIBILITIES:
- Answer, explain, solve, analyse, compare, derive and research.
- Use subject-appropriate terminology and methods.
- Distinguish established facts from assumptions and inferences.
- Never fabricate facts, sources, equations or references.
- Acknowledge uncertainty when information is insufficient.

ANSWER FORMAT:
- Begin with the direct answer or method.
- Explain each distinct step on a separate line.
- Use numbered steps for calculations and procedures.
- Define technical terms when necessary.
- Use readable equations, units and tables where appropriate.
- Do not combine several reasoning steps into one paragraph.
- End with a clear conclusion when appropriate.
- Avoid unnecessary greetings, filler and repetition.

SUBJECT ROUTING:
- Detect the academic subject in General Academic mode.
- Apply appropriate specialist instructions.
- In a dedicated module, remain focused on that subject.
- Cross-disciplinary academic questions may use
  more than one relevant discipline.

OUTPUT:
- Use text, mathematical notation, tables and diagrams.
- Do not claim to generate images, audio or video.
- When a diagram is requested, follow the diagram instructions.
`,

    mathematics: `
ACTIVE SPECIALIST: MATHEMATICS

SCOPE:
From foundational arithmetic to advanced university
and research-level mathematics.

AREAS:
- Arithmetic, number systems, fractions, ratios and percentages.
- Algebra, equations, inequalities and polynomials.
- Functions, sequences and series.
- Geometry and coordinate geometry.
- Trigonometry and inverse trigonometry.
- Limits, continuity and calculus.
- Differential and integral calculus.
- Differential equations.
- Linear algebra, matrices and vector spaces.
- Probability and statistics.
- Discrete mathematics and graph theory.
- Number theory and abstract algebra.
- Real analysis and complex analysis.
- Topology and mathematical logic.
- Numerical methods and optimisation.
- Mathematical modelling and operations research.

PROBLEM-SOLVING METHOD:
1. Identify what the question asks.
2. List the given information.
3. Identify unknown quantities.
4. Select the appropriate formula, theorem or method.
5. State assumptions and domain restrictions.
6. Show every important transformation separately.
7. Perform calculations carefully.
8. Verify the result.
9. Present the final answer clearly.

RULES:
- Use correct mathematical notation.
- Define symbols where necessary.
- Preserve exact values until approximation is appropriate.
- Check signs, domains, units and extraneous roots.
- Do not skip essential algebraic steps.
- Do not invent a theorem, identity or formula.
- For proofs, establish each logical inference.
- For graphs, use an appropriate graph representation
  when requested.
  Assume the user is capable of understanding standard academic terminology.
Avoid explaining elementary operations unless explicitly requested.
Give direct answers to straightforward questions.
Show rigorous derivations for genuinely complex problems.
Never use childish phrases such as "First, start with the first number."
Adapt explanation depth to the actual problem.
`,

    quantum: `
ACTIVE SPECIALIST: QUANTUM COMPUTING AND QUANTUM MECHANICS

AREAS:
- Qubits and quantum states.
- Superposition and entanglement.
- Quantum gates and circuits.
- Quantum algorithms.
- Quantum measurement.
- Quantum information theory.
- Quantum error correction.
- Quantum mechanics and state evolution.

METHOD:
- Define the quantum system and its state.
- Explain the mathematical representation.
- Use Dirac notation where appropriate.
- Explain operators, matrices and tensor products.
- Show gate operations in their correct order.
- Calculate measurement probabilities.
- Check state normalisation.
- Distinguish ideal models from physical implementations.

RULES:
- Do not claim quantum advantage without a valid comparison.
- Distinguish quantum computing from quantum mechanics.
- Use mathematically correct notation.
- Put derivations and circuit operations on separate lines.
`,

    physics: `
ACTIVE SPECIALIST: PHYSICS

AREAS:
- Classical mechanics.
- Motion, forces and energy.
- Momentum and rotational motion.
- Gravitation and fluid mechanics.
- Oscillations and waves.
- Sound and optics.
- Electricity and magnetism.
- Electromagnetism.
- Thermodynamics.
- Modern and quantum physics.

PROBLEM-SOLVING METHOD:
1. Identify the physical situation.
2. List known quantities and unknowns.
3. Convert units where necessary.
4. Identify the governing physical law.
5. Explain why the law applies.
6. Substitute values with units.
7. Show calculations step by step.
8. Check dimensional consistency.
9. Interpret the final result physically.

RULES:
- State assumptions and idealisations.
- Use correct SI units.
- Check sign conventions.
- Distinguish theoretical models from observations.
- Explain physical meaning, not equations alone.
`,

    chemistry: `
ACTIVE SPECIALIST: CHEMISTRY

AREAS:
- Physical chemistry.
- Organic chemistry.
- Inorganic chemistry.
- Analytical chemistry.
- Chemical bonding and structure.
- Chemical energetics and kinetics.
- Equilibrium and thermodynamics.
- Acids, bases and redox reactions.
- Electrochemistry and stoichiometry.

METHOD:
- Identify the substances and chemical process.
- Use correct chemical symbols and formulae.
- Balance equations using conservation of atoms and charge.
- For stoichiometry, convert quantities to moles.
- Apply mole ratios from the balanced equation.
- Convert the result to the requested unit.
- Explain reaction mechanisms where relevant.
- Check atom balance, charge and significant figures.

RULES:
- Do not invent reaction products or conditions.
- Distinguish observations from proposed mechanisms.
- Use correct nomenclature and oxidation states.
- Explain chemical principles clearly.
`,

    biology: `
ACTIVE SPECIALIST: BIOLOGY

AREAS:
- Cell biology.
- Molecular biology.
- Genetics and heredity.
- Evolution.
- Ecology.
- Human and plant physiology.
- Anatomy and taxonomy.
- Microbiology.
- Biotechnology.
- Reproduction and development.

METHOD:
- Identify the biological system or process.
- Explain structures and functions.
- Describe processes in their correct sequence.
- Define specialised terminology.
- Explain cause-and-effect relationships.
- For genetics, identify parental genotypes, gametes
  and offspring ratios.
- For experiments, identify controls and variables.
- Distinguish correlation from causation.

RULES:
- Use scientifically accurate terminology.
- Do not overstate conclusions from limited evidence.
- Explain biological processes in separate steps.
- Do not invent experimental findings.
`,

    history: `
ACTIVE SPECIALIST: HISTORICAL ANALYSIS

METHOD:
- Identify the period, region and historical context.
- Establish a reliable chronology.
- Distinguish causes, events and consequences.
- Explain political, social, economic and cultural factors.
- Compare historical interpretations when appropriate.
- Distinguish primary and secondary sources.
- Identify uncertainty and limitations in evidence.

RULES:
- Do not invent dates, events, quotations or sources.
- Avoid presenting interpretations as universally accepted facts.
- Explain historical developments chronologically.
- Support conclusions with relevant evidence.
`,

    psychology: `
ACTIVE SPECIALIST: PSYCHOLOGY AND COGNITIVE SCIENCE

AREAS:
- Cognitive psychology.
- Behavioural psychology.
- Developmental psychology.
- Social psychology.
- Learning and memory.
- Perception and attention.
- Motivation and emotion.
- Personality theories.
- Neuroscience and cognition.
- Psychological research methods.

METHOD:
- Define the psychological concept.
- Identify the relevant theory or framework.
- Explain the mechanism or process.
- Use appropriate research evidence.
- Distinguish observation, interpretation and theory.
- Explain research methods and limitations.

RULES:
- Do not diagnose individuals.
- Do not treat a theory as established fact without evidence.
- Distinguish correlation from causation.
- Explain technical terminology clearly.
`,

    translation: `
ACTIVE SPECIALIST: ACADEMIC TRANSLATION

PURPOSE:
Translate supplied text accurately while preserving meaning.

METHOD:
- Identify the source language when possible.
- Identify the requested target language.
- Preserve meaning, context and tone.
- Retain technical and academic terminology accurately.
- Preserve equations, numbers, names and symbols.
- Explain an ambiguous phrase only when necessary.

RULES:
- Do not add information absent from the original.
- Do not silently omit meaningful content.
- Distinguish literal and context-sensitive translations.
- If the target language is unclear, ask for clarification.
`
  };


  // =========================================================
  // 8. SYSTEM PROMPT BUILDER
  // =========================================================

  function buildSystemPrompt(domain = "general") {
    const selectedInstructions =
      subjectInstructions[domain] ||
      subjectInstructions.general;

    const moduleBoundary =
      domain === "general"
        ? `
GENERAL ACADEMIC MODE:
- Identify the appropriate academic discipline.
- Apply the relevant academic methods.
- Do not pretend to have specialist knowledge when uncertain.
`
        : `
SPECIALIST MODULE BOUNDARY:

Your active module is:
${subjectDisplayNames[domain] || domain}

- Your primary responsibility is this module's subject.
- Do not answer questions clearly belonging to another
  unrelated specialist module.
- If a question is outside your subject, politely recommend
  the appropriate module.
- Do not provide the out-of-module answer after recommending
  a switch.
- Interdisciplinary questions may be answered when they
  genuinely require your module's expertise.
- Never claim that another module has processed a question
  when it has not.
`;

    return `
${selectedInstructions}

${moduleBoundary}

${buildJaceLearningContext(domain)}

UNIVERSAL RESPONSE STANDARD:

- Every distinct step must appear on its own line.
- Use numbered steps for multi-step explanations.
- Keep explanations clear, logical and understandable.
- Be concise when the question is simple.
- Be detailed when the question requires depth.
- Never sacrifice accuracy for speed.
- Never fabricate knowledge or claim unsupported certainty.
- Stay within the academic and research purpose of J.A.C.E. 001.
`;
  }


  // =========================================================
  // 9. ACADEMIC IMAGE SYSTEM
  // =========================================================

  const academicImagePurposes = {
    question: "question",
    notes: "study notes",
    answer: "student answer",
    worksheet: "worksheet",
    diagram: "academic diagram",
    other: "academic material"
  };

  // =========================================================
  // 10. IMAGE PURPOSE DETECTION
  // =========================================================

  function identifyAcademicImagePurpose(text) {
    const value = String(text || "").toLowerCase();

    if (
      /\b(my answer|my solution|i wrote|check my answer|evaluate my answer|mark my answer|correct my answer)\b/.test(value)
    ) {
      return "answer";
    }

    if (
      /\b(worksheet|exercise|question paper|test paper)\b/.test(value)
    ) {
      return "worksheet";
    }

    if (
      /\b(notes|revision notes|class notes|study material)\b/.test(value)
    ) {
      return "notes";
    }

    if (
      /\b(explain this diagram|analyse this diagram|analyze this diagram|what is shown)\b/.test(value)
    ) {
      return "diagram";
    }

    return "question";
  }

  // =========================================================
  // 11. IMAGE VALIDATION AND CONFIRMATION
  // =========================================================

  function isSupportedAcademicImage(file) {
    if (!file) {
      alert("Please select an image first.");
      return false;
    }

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      alert(
        "Unsupported file format. Upload JPG, PNG, WEBP or BMP."
      );

      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert(
        "The image is too large. Maximum allowed size is 8 MB."
      );

      return false;
    }

    return true;
  }

  function requestAcademicImageConfirmation(file) {
    if (!isSupportedAcademicImage(file)) {
      return false;
    }

    const confirmed = window.confirm(
      "Is this image related to academic or research work?\n\n" +
      "Examples:\n" +
      "- Textbook pages\n" +
      "- Handwritten answers\n" +
      "- Mathematical solutions\n" +
      "- Worksheets\n" +
      "- Academic diagrams\n" +
      "- Study notes"
    );

    if (!confirmed) {
      return false;
    }

    confirmedAcademicFiles.add(file);

    selectedAcademicImage = file;
    extractedImageText = "";
    academicImagePurpose = "academic material";

    return true;
  }

  // =========================================================
  // 12. LOAD OCR ENGINE
  // =========================================================

  function loadTesseract() {
    if (window.Tesseract) {
      return Promise.resolve(window.Tesseract);
    }

    if (tesseractLoadingPromise) {
      return tesseractLoadingPromise;
    }

    tesseractLoadingPromise = new Promise(
      (resolve, reject) => {
        const script = document.createElement("script");

        script.src = TESSERACT_SCRIPT;
        script.async = true;

        script.onload = () => {
          if (window.Tesseract) {
            resolve(window.Tesseract);
          } else {
            tesseractLoadingPromise = null;

            reject(
              new Error("OCR engine failed to initialise.")
            );
          }
        };

        script.onerror = () => {
          tesseractLoadingPromise = null;

          reject(
            new Error("Unable to load the OCR engine.")
          );
        };

        document.head.appendChild(script);
      }
    );

    return tesseractLoadingPromise;
  }

  // =========================================================
  // 13. EXTRACT TEXT FROM IMAGE
  // =========================================================

  async function extractAcademicImageText(file) {
    if (!file || !isSupportedAcademicImage(file)) {
      throw new Error("Invalid academic image.");
    }

    const Tesseract = await loadTesseract();

    const result = await Tesseract.recognize(
      file,
      "eng",
      {
        logger: (message) => {
          if (message.status === "recognizing text") {
            console.log(
              "[J.A.C.E. OCR]",
              Math.round(message.progress * 100) + "%"
            );
          }
        }
      }
    );

    const text =
      result?.data?.text?.trim() || "";

    extractedImageText = text;

    return text;
  }

  // =========================================================
  // 14. UPLOADED STUDENT ANSWER EVALUATION
  // =========================================================

  function buildAnswerEvaluationPrompt(extractedText) {
    return `
STUDENT ANSWER EVALUATION MODE

The uploaded academic material appears to contain a student's
attempted answer or academic solution.

Evaluate the readable work carefully and objectively.

EVALUATION REQUIREMENTS:

1. Identify the question being answered, if visible.

2. Identify the student's actual answer.

3. Check factual accuracy and conceptual understanding.

4. For mathematics and numerical problems:
   - Check every calculation.
   - Verify formulas.
   - Check substitutions.
   - Check units.
   - Check intermediate steps.
   - Identify the exact point where an error occurs.

5. For theoretical subjects:
   - Check factual correctness.
   - Check whether essential points are included.
   - Identify irrelevant or incorrect statements.
   - Check terminology and explanation.

6. For language and translation:
   - Check grammar.
   - Check meaning.
   - Check sentence structure.
   - Identify incorrect word usage.

7. Never mark a correct answer as incorrect merely because
   it uses different wording or a different valid method.

8. Never invent marks, marking schemes or teacher expectations.

9. If the question or answer is incomplete or unreadable,
   clearly state what information is missing.

RESPONSE FORMAT:

A. QUESTION IDENTIFICATION
State the question if it can be read.

B. OVERALL ASSESSMENT
Give a concise assessment of the submitted work.

C. CORRECT PARTS
Identify what the student did correctly.

D. ERRORS AND MISSING POINTS
Identify mistakes individually.
Explain why each mistake is incorrect.

E. CORRECTIONS
Show the correct steps or statements.

F. IMPROVED ANSWER
Provide a complete corrected answer when possible.

G. FINAL VERDICT
State whether the answer is:
- Correct
- Partially correct
- Incorrect
- Insufficient information

MARKING:
Only assign marks when the maximum marks or marking scheme
is supplied or clearly visible.
Never invent a marking scheme.

OCR LIMITATION:
The extracted text may contain recognition errors.
Do not silently assume uncertain symbols or words are correct.
If a symbol is ambiguous, identify it as uncertain.

UPLOADED MATERIAL:

${extractedText}
`;
  }

  // =========================================================
  // 15. STUDY MATERIAL ANALYSIS
  // =========================================================

 
function buildStudyMaterialPrompt(extractedText) {
  return `
ACADEMIC MATERIAL UNDERSTANDING AND EXPLANATION

You are Selené Vesperiine, an academic assistant.

The user has uploaded an academic image. OCR has extracted
the text below. Your task is to understand the material
and help the user learn from it.

IMPORTANT:
- Do NOT produce a classification report.
- Do NOT list whether the material is a question, notes,
  worksheet, explanation, or other academic content.
- Do NOT output Yes/No classification labels.
- Do NOT describe your internal analysis process.
- Do NOT simply repeat the extracted text.

YOUR TASK:

1. Read and understand the extracted academic material.
2. If it contains a question, solve it and explain the solution.
3. If it contains textbook content or study notes,
   explain the topic clearly and systematically.
4. If it contains multiple questions, address each readable
   question separately.
5. If it contains a mathematical problem, show the
   calculations and relevant formulas step by step.
6. If it contains a scientific process, explain its stages,
   mechanisms and important terminology.
7. If it contains an academic explanation, make it easier
   to understand without losing important information.
8. Correct factual errors when appropriate.
9. Never invent words, facts or information missing from
   the extracted material.
10. If OCR has produced unclear or incomplete text,
    identify the uncertainty honestly.

DEFAULT BEHAVIOUR:

If the user uploads an image without typing a specific
instruction, automatically explain the academic content
in the image.

For example, if the image contains material about
photosynthesis, explain photosynthesis, including:
- Its meaning.
- Where it occurs.
- The role of sunlight and chlorophyll.
- The raw materials and products.
- The main stages of the process.
- Its importance.

RESPONSE FORMAT:

- Start directly with the topic or answer.
- Use meaningful headings.
- Explain concepts in clear language.
- Use numbered steps for processes and calculations.
- Include important equations where relevant.
- Include examples when useful.
- End with a concise conclusion when appropriate.

OCR-EXTRACTED ACADEMIC MATERIAL:

${extractedText}
`;
}

  // =========================================================
  // 16. ACADEMIC IMAGE CONTEXT
  // =========================================================

  function buildAcademicImageContext(
    extractedText,
    purpose = "academic material"
  ) {
    if (!extractedText || !extractedText.trim()) {
      return "";
    }

    if (purpose === "answer") {
      return buildAnswerEvaluationPrompt(extractedText);
    }

    return buildStudyMaterialPrompt(extractedText);
  }

  // =========================================================
  // 17. DIAGRAM REQUEST DETECTION
  // =========================================================

  function isAcademicDiagramRequest(query) {
    const text = String(query || "").toLowerCase();

    const diagramTerms = [
      "draw a diagram",
      "generate a diagram",
      "show a diagram",
      "make a diagram",
      "labelled diagram",
      "labeled diagram",
      "draw a graph",
      "plot a graph",
      "plot the graph",
      "draw a circuit",
      "circuit diagram",
      "flowchart",
      "schematic diagram",
      "structure of",
      "illustrate",
      "show the structure",
      "draw the structure",
      "draw and label",
      "label the diagram",
      "graph of",
      "plot"
    ];

    return diagramTerms.some((term) =>
      text.includes(term)
    );
  }

  // =========================================================
  // 18. DIAGRAM TYPE DETECTION
  // =========================================================

  function detectDiagramType(query) {
    const text = String(query || "").toLowerCase();

    if (
      /\b(graph|plot|coordinate|parabola|curve|function)\b/.test(text)
    ) {
      return "graph";
    }

    if (
      /\b(flowchart|process|cycle|sequence|steps|pathway)\b/.test(text)
    ) {
      return "flowchart";
    }

    if (
      /\b(circuit|electrical circuit|logic gate|quantum circuit)\b/.test(text)
    ) {
      return "circuit";
    }

    if (
      /\b(mind map|concept map|relationship|classification|hierarchy)\b/.test(text)
    ) {
      return "concept";
    }

    return "scientific";
  }

  // =========================================================
  // 19. DIAGRAM GENERATION INSTRUCTIONS
  // =========================================================

  function buildAcademicDiagramPrompt(query) {
    const type = detectDiagramType(query);

    let formatInstructions = "";

    if (type === "flowchart") {
      formatInstructions = `
Use Mermaid flowchart syntax.

Start with:
\`\`\`mermaid
flowchart TD

Use:
- Rectangles for processes.
- Diamonds for decisions.
- Arrows for direction.
- Clear labels.
- A logical sequence.

End the diagram with:
\`\`\`
`;
    } else if (type === "concept") {
      formatInstructions = `
Use Mermaid flowchart or graph syntax.

Show:
- The main concept.
- Related concepts.
- Correct relationships.
- Clear labels and connections.

Use a suitable Mermaid direction such as TD or LR.
`;
    } else if (type === "circuit") {
      formatInstructions = `
Use a clear structured text circuit representation.

If a flow relationship is useful, use Mermaid flowchart syntax.
Do not invent electrical connections or circuit values.

For logic circuits, label inputs, gates and outputs.
For quantum circuits, identify the qubits and gates in order.
`;
    } else if (type === "graph") {
      formatInstructions = `
For a mathematical graph:
- State the function or relationship.
- Identify the x-axis and y-axis.
- State important coordinates.
- Identify intercepts, turning points and asymptotes where relevant.
- Explain the graph's shape.

Use Mermaid only if it is appropriate for the requested
relationship. Do not use a flowchart as a substitute
for a mathematical coordinate graph.
If a true plotted graph is required, provide the data points,
equation and plotting instructions clearly.
`;
    } else {
      formatInstructions = `
Choose the most appropriate representation.

For a process or relationship, use Mermaid.
For a biological or anatomical structure, use a labelled
structured text diagram with correct parts and labels.

Do not pretend that a text outline is a visual scientific
illustration. Clearly distinguish a schematic from a
scale-accurate scientific drawing.
`;
    }

    return `
ACADEMIC DIAGRAM GENERATION MODE

The user has requested a diagram or graph.

USER REQUEST:
${query}

DIAGRAM TYPE:
${type}

REQUIREMENTS:

1. Make the representation scientifically and academically accurate.
2. Include relevant labels and terminology.
3. Maintain correct relationships and directions.
4. Use clear titles and organised sections.
5. Do not invent experimental data or measurements.
6. State assumptions when essential information is missing.
7. Do not provide a generic explanation instead of the requested
   diagram.
8. Do not place unrelated commentary inside the diagram code.

OUTPUT REQUIREMENTS:

${formatInstructions}

When using Mermaid:
- Return a complete Mermaid code block.
- Do not place explanatory prose inside the code block.
- Use valid Mermaid syntax.
- Ensure every node identifier is valid.
- Ensure arrows and connections are correctly written.
- Do not use unsupported styling or plugins.
- Do not wrap Mermaid syntax in another code block.

After the diagram, briefly explain its important labels
if necessary.
`;
  }

  // =========================================================
  // 20. LOAD MERMAID DIAGRAM ENGINE
  // =========================================================

  function loadMermaid() {
    if (window.mermaid) {
      return Promise.resolve(window.mermaid);
    }

    if (mermaidLoadingPromise) {
      return mermaidLoadingPromise;
    }

    mermaidLoadingPromise = new Promise(
      (resolve, reject) => {
        const script = document.createElement("script");

        script.src = MERMAID_SCRIPT;
        script.async = true;

        script.onload = () => {
          if (window.mermaid) {
            window.mermaid.initialize({
              startOnLoad: false,
              securityLevel: "strict",
              theme: "dark",
              flowchart: {
                useMaxWidth: true,
                htmlLabels: false,
                curve: "basis"
              }
            });

            resolve(window.mermaid);
          } else {
            mermaidLoadingPromise = null;

            reject(
              new Error("Diagram engine failed to initialise.")
            );
          }
        };

        script.onerror = () => {
          mermaidLoadingPromise = null;

          reject(
            new Error("Unable to load the diagram engine.")
          );
        };

        document.head.appendChild(script);
      }
    );

    return mermaidLoadingPromise;
  }

  // =========================================================
  // 21. RENDER ACADEMIC DIAGRAM
  // =========================================================

  async function renderMermaidDiagrams(container) {
    if (!container) return;

    const codeBlocks = Array.from(
      container.querySelectorAll("pre code")
    );

    const mermaidBlocks = codeBlocks.filter((block) => {
      return (
        block.classList.contains("language-mermaid") ||
        block.classList.contains("mermaid")
      );
    });

    if (!mermaidBlocks.length) return;

    let mermaid;

    try {
      mermaid = await loadMermaid();
    } catch (error) {
      console.warn(
        "[J.A.C.E. DIAGRAM]",
        error
      );

      return;
    }

    for (const codeBlock of mermaidBlocks) {
      const pre = codeBlock.closest("pre");

      if (!pre) continue;

      const diagramCode = codeBlock.textContent.trim();

      if (!diagramCode) continue;

      const diagramContainer =
        document.createElement("div");

      diagramContainer.className =
        "jace-mermaid-container";

      diagramContainer.style.width = "100%";
      diagramContainer.style.overflowX = "auto";
      diagramContainer.style.margin = "16px 0";
      diagramContainer.style.padding = "12px";
      diagramContainer.style.borderRadius = "12px";
      diagramContainer.style.background =
        "rgba(183, 139, 233, 0.07)";

      const diagramId =
        "jace-diagram-" +
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2, 9);

      try {
        const result = await mermaid.render(
          diagramId,
          diagramCode
        );

        diagramContainer.innerHTML = result.svg;

        pre.replaceWith(diagramContainer);

      } catch (error) {
        console.warn(
          "[J.A.C.E. DIAGRAM RENDER ERROR]",
          error
        );

        diagramContainer.textContent =
          "The diagram could not be rendered. " +
          "The Mermaid syntax may be invalid. " +
          "The original diagram code is shown below.";

        const fallback = document.createElement("pre");
        const fallbackCode = document.createElement("code");

        fallbackCode.textContent = diagramCode;

        fallback.appendChild(fallbackCode);
        diagramContainer.appendChild(fallback);

        pre.replaceWith(diagramContainer);
      }
    }
  }

  // =========================================================
  // 22. SAFE RESPONSE DISPLAY
  // =========================================================

  function createResponseContent(text) {
    const fragment = document.createDocumentFragment();

    const lines = String(text || "").split("\n");

    let normalLines = [];
    let codeLanguage = null;
    let codeLines = [];

    function flushNormalLines() {
      if (!normalLines.length) return;

      const paragraph = document.createElement("div");

      paragraph.className = "jace-response-text";
      paragraph.style.whiteSpace = "pre-wrap";
      paragraph.textContent = normalLines.join("\n");

      fragment.appendChild(paragraph);

      normalLines = [];
    }

    function flushCodeBlock() {
      const pre = document.createElement("pre");
      const code = document.createElement("code");

      pre.className = "jace-code-block";

      if (codeLanguage) {
        code.className = `language-${codeLanguage}`;
      }

      pre.style.overflowX = "auto";
      pre.style.whiteSpace = "pre";
      pre.style.padding = "12px";
      pre.style.borderRadius = "8px";

      code.textContent = codeLines.join("\n");

      pre.appendChild(code);
      fragment.appendChild(pre);

      codeLanguage = null;
      codeLines = [];
    }

    for (const line of lines) {
      const fenceMatch =
        line.match(/^```([a-zA-Z0-9_-]*)\s*$/);

      if (!codeLanguage && fenceMatch) {
        flushNormalLines();

        codeLanguage =
          fenceMatch[1].toLowerCase() || "text";

        codeLines = [];
        continue;
      }

      if (codeLanguage && line.trim() === "```") {
        flushCodeBlock();
        continue;
      }

      if (codeLanguage) {
        codeLines.push(line);
      } else {
        normalLines.push(line);
      }
    }

    if (codeLanguage) {
      flushCodeBlock();
    }

    flushNormalLines();

    return fragment;
  }

  async function displayJaceOutput(
    text,
    options = {}
  ) {
    const output =
      document.getElementById("subtitleOutput") ||
      document.querySelector(".subtitle-output");

    if (!output) {
      console.log("[J.A.C.E. OUTPUT]", text);
      return;
    }

    if (options.render === false) {
      output.textContent = text;
      return;
    }

    output.replaceChildren(
      createResponseContent(text)
    );

    // Render Mermaid diagrams if present.
    await renderMermaidDiagrams(output);

    // Render mathematical expressions if KaTeX is available.
    if (
      window.renderMathInElement &&
      typeof window.renderMathInElement === "function"
    ) {
      try {
        window.renderMathInElement(output, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      } catch (error) {
        console.warn(
          "[J.A.C.E. MATH RENDER]",
          error
        );
      }
    }
  }

  function appendJaceOutput(text) {
    const output =
      document.getElementById("subtitleOutput") ||
      document.querySelector(".subtitle-output");

    if (!output) return;

    output.appendChild(
      document.createTextNode(text)
    );
  }

  // =========================================================
  // 23. ACADEMIC IMAGE PROCESSING
  // =========================================================

  async function processAcademicImage(
    file,
    purpose = "question"
  ) {
    if (!file) {
      throw new Error("No image was selected.");
    }

    if (!confirmedAcademicFiles.has(file)) {
      throw new Error(
        "Please confirm the academic purpose of the image."
      );
    }

    if (!isSupportedAcademicImage(file)) {
      throw new Error("Unsupported image.");
    }

    academicImagePurpose =
      academicImagePurposes[purpose] ||
      "academic material";

    const text =
      await extractAcademicImageText(file);

    if (!text) {
      return {
        success: false,
        method: "local-ocr",
        text: "",
        context: "",
        message:
          "No readable text could be extracted from this image.\n\n" +
          "J.A.C.E. currently uses local OCR for uploaded images. " +
          "It cannot independently interpret visual structures, " +
          "handwritten diagrams or non-textual image details.\n\n" +
          "Try uploading a clearer image, cropping the relevant " +
          "text, or typing the question."
      };
    }

    return {
      success: true,
      method: "local-ocr",
      purpose,
      text,
      context: buildAcademicImageContext(
        text,
        purpose
      )
    };
  }

  // =========================================================
  // 24. OPTIONAL EXTERNAL VISION CONSENT
  // =========================================================

  async function requestExternalVisionConsent() {
    if (!VISION_API_ENDPOINT) {
      return false;
    }

    return window.confirm(
      "Local OCR could not reliably understand this image.\n\n" +
      "Do you explicitly approve sending it to the configured " +
      "external vision service?\n\n" +
      "The image will leave your device."
    );
  }

  // =========================================================
  // 25. IMAGE STATE RESET
  // =========================================================

  function clearAcademicImageState() {
    selectedAcademicImage = null;
    extractedImageText = "";
    academicImagePurpose = null;
  }

  // =========================================================
  // 26. REQUEST CLASSIFICATION
  // =========================================================

  function classifyAcademicInput(query) {
    const text = String(query || "").toLowerCase();

    if (isAcademicDiagramRequest(text)) {
      return "diagram";
    }

    return "academic-question";
  }

  // =========================================================
  // 27. PERFORMANCE TRACKING
  // =========================================================

  const jacePerformance = {
    requestStartedAt: 0,
    firstTokenAt: 0,
    responseFinishedAt: 0,

    timeToFirstToken: 0,
    totalResponseTime: 0,

    promptTokens: 0,
    responseTokens: 0,

    loadDuration: 0,
    promptEvaluationDuration: 0,
    generationDuration: 0,

    tokensPerSecond: 0,

    requestCount: 0,
    failedRequests: 0,
    abortedRequests: 0
  };

  function startJacePerformanceTracking() {
    jacePerformance.requestStartedAt =
      performance.now();

    jacePerformance.firstTokenAt = 0;
    jacePerformance.responseFinishedAt = 0;

    jacePerformance.timeToFirstToken = 0;
    jacePerformance.totalResponseTime = 0;

    jacePerformance.promptTokens = 0;
    jacePerformance.responseTokens = 0;

    jacePerformance.loadDuration = 0;
    jacePerformance.promptEvaluationDuration = 0;
    jacePerformance.generationDuration = 0;

    jacePerformance.tokensPerSecond = 0;
  }

  function recordJaceFirstToken() {
    if (!jacePerformance.firstTokenAt) {
      jacePerformance.firstTokenAt =
        performance.now();

      jacePerformance.timeToFirstToken =
        jacePerformance.firstTokenAt -
        jacePerformance.requestStartedAt;
    }
  }

  function finishJacePerformanceTracking(ollamaData = {}) {
    jacePerformance.responseFinishedAt =
      performance.now();

    jacePerformance.totalResponseTime =
      jacePerformance.responseFinishedAt -
      jacePerformance.requestStartedAt;

    jacePerformance.promptTokens =
      Number(ollamaData.prompt_eval_count || 0);

    jacePerformance.responseTokens =
      Number(ollamaData.eval_count || 0);

    jacePerformance.loadDuration =
      Number(ollamaData.load_duration || 0);

    jacePerformance.promptEvaluationDuration =
      Number(ollamaData.prompt_eval_duration || 0);

    jacePerformance.generationDuration =
      Number(ollamaData.eval_duration || 0);

    if (
      jacePerformance.generationDuration > 0 &&
      jacePerformance.responseTokens > 0
    ) {
      jacePerformance.tokensPerSecond =
        jacePerformance.responseTokens /
        (jacePerformance.generationDuration / 1e9);
    }

    jacePerformance.requestCount++;

    return getJacePerformanceReport();
  }

  function recordJaceFailedRequest() {
    jacePerformance.failedRequests++;
  }

  function recordJaceAbortedRequest() {
    jacePerformance.abortedRequests++;
  }

  // =========================================================
  // 28. PERFORMANCE REPORT
  // =========================================================

  function getJacePerformanceReport() {
    return {
      firstTokenMilliseconds:
        Math.round(jacePerformance.timeToFirstToken),

      totalMilliseconds:
        Math.round(jacePerformance.totalResponseTime),

      promptTokens:
        jacePerformance.promptTokens,

      responseTokens:
        jacePerformance.responseTokens,

      modelLoadMilliseconds:
        Math.round(jacePerformance.loadDuration / 1e6),

      promptProcessingMilliseconds:
        Math.round(
          jacePerformance.promptEvaluationDuration / 1e6
        ),

      generationMilliseconds:
        Math.round(jacePerformance.generationDuration / 1e6),

      tokensPerSecond:
        Number(
          jacePerformance.tokensPerSecond.toFixed(2)
        ),

      completedRequests:
        jacePerformance.requestCount,

      failedRequests:
        jacePerformance.failedRequests,

      abortedRequests:
        jacePerformance.abortedRequests
    };
  }

  function formatJacePerformanceReport(report) {
    return `
J.A.C.E. 001 — PERFORMANCE REPORT

First token:
${report.firstTokenMilliseconds} ms

Total response time:
${report.totalMilliseconds} ms

Model loading:
${report.modelLoadMilliseconds} ms

Prompt processing:
${report.promptProcessingMilliseconds} ms

Response generation:
${report.generationMilliseconds} ms

Prompt tokens:
${report.promptTokens}

Generated tokens:
${report.responseTokens}

Generation speed:
${report.tokensPerSecond} tokens/second

Completed requests:
${report.completedRequests}

Failed requests:
${report.failedRequests}

Aborted requests:
${report.abortedRequests}
`;
  }

  // =========================================================
  // 29. OLLAMA CONNECTION
  // =========================================================

  async function checkOllamaConnection() {
    try {
      const response = await fetch(
        "http://localhost:11434/api/tags",
        {
          method: "GET"
        }
      );

      if (!response.ok) {
        return {
          connected: false,
          modelAvailable: false,
          models: [],
          message:
            "Ollama is not responding correctly."
        };
      }

      const data = await response.json();

      const models = (data.models || []).map(
        model => model.name
      );

      const modelAvailable = models.some(
        model =>
          model === OLLAMA_MODEL ||
          model.startsWith(OLLAMA_MODEL + ":")
      );

      return {
        connected: true,
        modelAvailable,
        models,
        message: modelAvailable
          ? "Ollama and the configured model are available."
          : "Ollama is running, but the configured model was not found."
      };

    } catch (error) {
      console.error(
        "[J.A.C.E. OLLAMA]",
        error
      );

      return {
        connected: false,
        modelAvailable: false,
        models: [],
        message:
          "Unable to connect to Ollama. Make sure Ollama is running."
      };
    }
  }

  // =========================================================
  // 30. CONVERSATION HISTORY
  // =========================================================

  function prepareJaceHistory(history = []) {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .filter(message =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string"
      )
      .map(message => ({
        role: message.role,
        content: message.content
      }));
  }

  function getJaceActiveHistory(domain) {
    const historyKey = domain || "general";

    if (!conversationHistories[historyKey]) {
      conversationHistories[historyKey] = [];
    }

    return conversationHistories[historyKey];
  }

  function addJaceHistoryMessage(domain, role, content) {
    const history = getJaceActiveHistory(domain);

    history.push({
      role,
      content
    });

    if (history.length > 24) {
      history.splice(
        0,
        history.length - 24
      );
    }
  }

  function clearJaceConversation(domain) {
    const historyKey = domain || "general";

    conversationHistories[historyKey] = [];
  }

  // =========================================================
  // 31. BUILD OLLAMA REQUEST
  // =========================================================

  // =========================================================
  // 31. BUILD OLLAMA REQUEST WITH TRAINING EXAMPLES
  // =========================================================

  function buildJaceOllamaPayload({
    question,
    domain = "general",
    history = [],
    imageContext = ""
  }) {
    const systemPrompt =
      buildSystemPrompt(domain) +
      `

TRAINING EXAMPLE GUIDANCE:

You may receive relevant examples from the J.A.C.E. 001
academic response dataset.

Use these examples as learning references for:
- Mathematical methods.
- Problem-solving structure.
- Academic terminology.
- Explanation quality.
- Appropriate answer formatting.

IMPORTANT:
- Do not blindly copy an example.
- Do not assume an example is correct without checking it.
- Adapt the method to the current question.
- Recalculate all numerical answers independently.
- If an example is irrelevant, ignore it.
- Never claim that you have permanently learned or
  fine-tuned your model from these examples.
`;

    const userContent = imageContext
      ? `${question}\n\n${imageContext}`
      : question;

    const relevantExamples =
      selectRelevantTrainingExamples(
        question || imageContext,
        domain
      );

    const trainingMessages = [];

    for (const example of relevantExamples) {
      trainingMessages.push(
        {
          role: "user",
          content: example.question
        },
        {
          role: "assistant",
          content: example.answer
        }
      );
    }

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },

      ...prepareJaceHistory(history),

      // Relevant dataset examples are inserted here.
      ...trainingMessages,

      {
        role: "user",
        content: userContent
      }
    ];

    return {
      model: OLLAMA_MODEL,
      messages,
      stream: true,
      keep_alive: KEEP_ALIVE,
      options: AI_OPTIONS
    };
  }

  // =========================================================
  // 32. STREAM ACADEMIC RESPONSE
  // =========================================================

  async function generateJaceResponse({
    question,
    domain = "general",
    history = [],
    imageContext = "",
    onToken = null,
    onComplete = null,
    onError = null
  }) {
    if (!question || !question.trim()) {
      throw new Error(
        "Please enter an academic question."
      );
    }

    if (isAiProcessing) {
      throw new Error(
        "J.A.C.E. is already processing a request."
      );
    }

    // An explicitly selected General mode should still
    // detect the subject automatically.
    const detectedDomain =
      !domain || domain === "general"
        ? detectSubject(question)
        : domain;

    const payload = buildJaceOllamaPayload({
      question,
      domain: detectedDomain,
      history,
      imageContext
    });

    currentAiController = new AbortController();

    const signal = currentAiController.signal;

    let completeAnswer = "";
    let finalMetrics = {};
    let streamBuffer = "";

    isAiProcessing = true;

    startJacePerformanceTracking();

    try {
      const response = await fetch(OLLAMA_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(payload),

        signal
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Ollama request failed (${response.status}): ${errorText}`
        );
      }

      if (!response.body) {
        throw new Error(
          "Streaming is not supported by this response."
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      async function processStreamLine(line) {
        if (!line.trim()) return;

        let chunk;

        try {
          chunk = JSON.parse(line);
        } catch (error) {
          console.warn(
            "[J.A.C.E.] Ignoring an invalid stream chunk.",
            error
          );

          return;
        }

        const token =
          chunk.message?.content || "";

        if (token) {
          recordJaceFirstToken();

          completeAnswer += token;

          if (typeof onToken === "function") {
            onToken(token, completeAnswer);
          }
        }

        if (chunk.done) {
          finalMetrics = chunk;
        }
      }

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        streamBuffer += decoder.decode(
          value,
          { stream: true }
        );

        const lines = streamBuffer.split("\n");

        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          await processStreamLine(line);
        }
      }

      streamBuffer += decoder.decode();

      if (streamBuffer.trim()) {
        await processStreamLine(streamBuffer.trim());
      }

      const performanceReport =
        finishJacePerformanceTracking(finalMetrics);

      const result = {
        success: true,

        answer: completeAnswer,

        subject: detectedDomain,

        performance: performanceReport,

        ollamaMetrics: {
          totalDuration:
            finalMetrics.total_duration || 0,

          loadDuration:
            finalMetrics.load_duration || 0,

          promptEvaluationDuration:
            finalMetrics.prompt_eval_duration || 0,

          generationDuration:
            finalMetrics.eval_duration || 0,

          promptTokens:
            finalMetrics.prompt_eval_count || 0,

          generatedTokens:
            finalMetrics.eval_count || 0
        }
      };

      if (typeof onComplete === "function") {
        onComplete(result);
      }

      return result;

    } catch (error) {
      if (error.name === "AbortError") {
        recordJaceAbortedRequest();

        return {
          success: false,
          aborted: true,
          answer: completeAnswer,
          message: "Generation stopped."
        };
      }

      recordJaceFailedRequest();

      console.error(
        "[J.A.C.E. GENERATION ERROR]",
        error
      );

      if (typeof onError === "function") {
        onError(error);
      }

      throw error;

    } finally {
      isAiProcessing = false;
      currentAiController = null;
    }
  }

  // =========================================================
  // 33. STOP RESPONSE GENERATION
  // =========================================================

  function stopJaceGeneration() {
    if (
      currentAiController &&
      isAiProcessing
    ) {
      currentAiController.abort();
      return true;
    }

    return false;
  }

  function isJaceGenerating() {
    return isAiProcessing;
  }

  // =========================================================
  // 34. PERFORMANCE DIAGNOSTICS
  // =========================================================

  function logJacePerformance() {
    const report = getJacePerformanceReport();

    console.group(
      "J.A.C.E. 001 — Performance Diagnostics"
    );

    console.table(report);

    console.groupEnd();

    return report;
  }

  // =========================================================
  // 35. SYSTEM DIAGNOSTICS
  // =========================================================

  async function runJaceDiagnostics() {
    const connection =
      await checkOllamaConnection();

    const diagnostics = {
      project: "J.A.C.E. 001",

      endpoint: OLLAMA_URL,

      configuredModel: OLLAMA_MODEL,

      connection: connection.connected,

      modelAvailable: connection.modelAvailable,

      availableModels: connection.models,

      performance: getJacePerformanceReport(),

      imageProcessing: "Local OCR",
            training: getJaceTrainingStatus(),

      diagramRendering:
        typeof window.mermaid !== "undefined"
          ? "Loaded"
          : "Loads when required"
    };

    console.group(
      "J.A.C.E. 001 — System Diagnostics"
    );

    console.table({
      endpoint: diagnostics.endpoint,

      model: diagnostics.configuredModel,

      connection: diagnostics.connection,

      modelAvailable: diagnostics.modelAvailable,

      imageProcessing: diagnostics.imageProcessing,

      diagramRendering: diagnostics.diagramRendering
    });

    console.log(diagnostics);

    console.groupEnd();

    return diagnostics;
  }

  // =========================================================
  // 36. CHAT INTERFACE ELEMENTS
  // =========================================================

  const jaceMainInput = document.querySelector(
    ".input-console-container textarea"
  );

  const jaceMainButton = document.querySelector(
    ".input-console-container .execute-btn"
  );

  const jaceMainOutput =
    document.getElementById("subtitleOutput");

  const jaceMainUpload = document.querySelector(
    ".input-console-container input[type='file']"
  );

  // =========================================================
  // 37. ACADEMIC MATERIAL PURPOSE
  // =========================================================

  function detectUploadedMaterialPurpose(query) {
    const text = String(query || "").toLowerCase();

    if (
      /\b(check|evaluate|correct|mark|review|grade)\b/.test(text) &&
      /\b(answer|solution|working|response|attempt)\b/.test(text)
    ) {
      return "answer";
    }

    if (
      /\b(worksheet|exercise|question paper|test paper)\b/.test(text)
    ) {
      return "worksheet";
    }

    if (
      /\b(notes|explain these notes|summarise these notes|summarize these notes)\b/.test(text)
    ) {
      return "notes";
    }

    if (
      /\b(explain this diagram|analyse this diagram|analyze this diagram)\b/.test(text)
    ) {
      return "diagram";
    }

    return identifyAcademicImagePurpose(query);
  }

  // =========================================================
  // 38. GENERATE ACADEMIC RESPONSE
  // =========================================================

 
  // =========================================================
  // 38. GENERATE ACADEMIC RESPONSE — SUBJECT ENFORCEMENT
  // =========================================================

  async function handleAiQuery(
    query,
    domain = null,
    imageFile = null
  ) {
    const userQuestion =
      String(query || "").trim();

    if (
      (!userQuestion && !imageFile) ||
      isAiProcessing
    ) {
      return;
    }

    let imageContext = "";
    let extractedTextForRouting = "";

    // A selected module takes priority over automatic routing.
    let activeDomain =
      domain && domain !== "general"
        ? domain
        : detectSubject(userQuestion);

       try {
      // -----------------------------------------------
      // LOAD TRAINING DATASETS
      // -----------------------------------------------

      await loadTrainingDatasets();

      // -----------------------------------------------
      // IMAGE PROCESSING--------------------------------------------

      if (imageFile) {
        if (!confirmedAcademicFiles.has(imageFile)) {
          await displayJaceOutput(
            "Please select and confirm an academic image first."
          );

          return;
        }

        await displayJaceOutput(
          "Selené is analysing the uploaded academic material...",
          { render: false }
        );

        const purpose =
          detectUploadedMaterialPurpose(userQuestion);

        const imageResult =
          await processAcademicImage(
            imageFile,
            purpose
          );

        if (!imageResult.success) {
          await displayJaceOutput(
            imageResult.message ||
            "The uploaded image could not be processed."
          );

          return;
        }

        imageContext = imageResult.context;
        extractedTextForRouting = imageResult.text;

        if (purpose === "answer") {
          imageContext =
            buildAnswerEvaluationPrompt(
              imageResult.text
            );
        }
      }

      // -----------------------------------------------
      // SUBJECT RECOGNITION
      // -----------------------------------------------

      const routingText = [
        userQuestion,
        extractedTextForRouting
      ]
        .filter(Boolean)
        .join("\n");

      const recognisedSubjects =
        detectSubjects(routingText);

      const recognisedPrimarySubject =
        recognisedSubjects[0] || "general";

      // -----------------------------------------------
      // GENERAL MODE: AUTOMATIC SUBJECT ROUTING
      // -----------------------------------------------

      if (!domain || domain === "general") {
        activeDomain = recognisedPrimarySubject;
      }

      // -----------------------------------------------
      // SPECIALIST MODE: ENFORCE SUBJECT BOUNDARIES
      // -----------------------------------------------

      else {
        activeDomain = domain;

        const selectedModuleRecognised =
          recognisedSubjects.includes(domain);

        const questionHasRecognisableSubject =
          recognisedSubjects.length > 0;

        if (
          questionHasRecognisableSubject &&
          !selectedModuleRecognised
        ) {
          const recommendedDomain =
            recognisedPrimarySubject;

          const recommendedName =
            subjectDisplayNames[recommendedDomain] ||
            "the appropriate academic";

          const selectedName =
            subjectDisplayNames[domain] ||
            domain;

          const recommendation =
            "I understand your question. However, this topic " +
            "appears to belong to " + recommendedName + 
            ", rather than " + selectedName + ".\n\n" +

            "To provide you with a specialised and accurate " +
            "explanation, I recommend switching to the " +
            recommendedName + " module.\n\n" +

            "Please select the " + recommendedName +
            " module and submit your question there. " +
            "Your question has not been sent to the " +
            selectedName + " specialist.";

          await displayJaceOutput(recommendation);

          console.info(
            "[J.A.C.E. SUBJECT ROUTING]",
            {
              selectedModule: domain,
              recognisedSubjects,
              recommendedModule: recommendedDomain,
              requestForwarded: false
            }
          );

          return;
        }
      }

      // -----------------------------------------------
      // CLASSIFY REQUEST
      // -----------------------------------------------

      const requestType =
        classifyAcademicInput(userQuestion);

      let finalQuestion = userQuestion;

      if (requestType === "diagram") {
        finalQuestion =
          userQuestion +
          "\n\n" +
          buildAcademicDiagramPrompt(userQuestion);
      }

      // -----------------------------------------------
      // PREPARE CONVERSATION
      // -----------------------------------------------

      const history =
        getJaceActiveHistory(activeDomain);

      const historyForRequest =
        history.slice(-8);

      const questionForModel =
        finalQuestion ||
        "Please analyse the uploaded academic material.";

      addJaceHistoryMessage(
        activeDomain,
        "user",
        questionForModel +
          (imageContext
            ? "\n\n[Academic image attached]"
            : "")
      );

      // -----------------------------------------------
      // GENERATE SPECIALIST RESPONSE
      // -----------------------------------------------

      await displayJaceOutput(
        "Selené is thinking...",
        { render: false }
      );

      let streamedAnswer = "";

      const result = await generateJaceResponse({
        question: questionForModel,

        domain: activeDomain,

        history: historyForRequest,

        imageContext,

        onToken: (token) => {
          streamedAnswer += token;

          displayJaceOutput(
            streamedAnswer,
            { render: false }
          );
        },

        onComplete: (response) => {
          console.log(
            "[J.A.C.E. COMPLETED]",
            response.performance
          );
        },

        onError: (error) => {
          console.error(
            "[J.A.C.E. RESPONSE ERROR]",
            error
          );
        }
      });

      // -----------------------------------------------
      // SAVE RESPONSE
      // -----------------------------------------------

      if (result.success) {
        addJaceHistoryMessage(
          activeDomain,
          "assistant",
          result.answer
        );

        await displayJaceOutput(result.answer);

        console.log(
          formatJacePerformanceReport(
            result.performance
          )
        );
      }

      if (result.aborted) {
        const partialAnswer =
          result.answer || streamedAnswer;

        await displayJaceOutput(
          partialAnswer +
          "\n\n[Generation stopped]"
        );

        if (partialAnswer.trim()) {
          addJaceHistoryMessage(
            activeDomain,
            "assistant",
            partialAnswer
          );
        }
      }

    } catch (error) {
      console.error(
        "[J.A.C.E. CHAT]",
        error
      );

      await displayJaceOutput(
        "Unable to complete the request.\n\n" +
        error.message
      );

    } finally {
      clearAcademicImageState();
    }
  }


  // =========================================================
  // 39. MAIN CHAT SEND BUTTON
  // =========================================================

  if (jaceMainButton && jaceMainInput) {
    jaceMainButton.addEventListener(
      "click",
      () => {
        handleAiQuery(
          jaceMainInput.value,
          null,
          selectedAcademicImage
        );
      }
    );

    jaceMainInput.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();

          handleAiQuery(
            jaceMainInput.value,
            null,
            selectedAcademicImage
          );
        }
      }
    );
  }

  // =========================================================
  // 40. IMAGE UPLOAD CONTROL
  // =========================================================

  function connectJaceImageUpload(input) {
    if (!input) return;

    input.addEventListener(
      "change",
      (event) => {
        const file =
          event.target.files?.[0];

        if (!file) return;

        if (
          !requestAcademicImageConfirmation(file)
        ) {
          input.value = "";

          if (input === jaceMainUpload) {
            selectedAcademicImage = null;
          }

          return;
        }

        const filename =
          input.parentElement?.querySelector(
            ".selene-upload-filename"
          );

        if (filename) {
          filename.textContent =
            "Academic image selected: " +
            file.name;
        }

        selectedAcademicImage = file;
      }
    );
  }

  connectJaceImageUpload(jaceMainUpload);

  // =========================================================
  // 41. STOP BUTTON CONNECTION
  // =========================================================

  function connectJaceStopButton(button) {
    if (!button) return;

    button.addEventListener(
      "click",
      () => {
        stopJaceGeneration();
      }
    );
  }

  document
    .querySelectorAll(
      ".stop-generation-btn, .stop-btn"
    )
    .forEach(connectJaceStopButton);

  // =========================================================
  // 42. MODULE WORKSPACE CONNECTION
  // =========================================================

  function connectJaceWorkspace(
    input,
    button,
    domain,
    fileInput = null
  ) {
    if (!input || !button) return;

    // Each module's upload input is independently confirmed.
    if (fileInput) {
      connectJaceImageUpload(fileInput);
    }

    const submit = () => {
      const file =
        fileInput?.files?.[0] || null;

      if (file && !confirmedAcademicFiles.has(file)) {
        displayJaceOutput(
          "Please confirm that the uploaded image is for academic or research work."
        );

        return;
      }

      handleAiQuery(
        input.value,
        domain,
        file
      );
    };

    button.addEventListener(
      "click",
      submit
    );

    input.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();
          submit();
        }
      }
    );
  }

  // =========================================================
  // 43. MODULE WORKSPACE INTEGRATION
  // =========================================================

  function initialiseJaceWorkspaces() {
    const workspaceConfigs = [
      {
        domain: "mathematics",
        input: document.getElementById("mathInput"),
        button: document.getElementById("mathSend"),
        file: document.getElementById("mathFile")
      },
      {
        domain: "quantum",
        input: document.getElementById("quantumInput"),
        button: document.getElementById("quantumSend"),
        file: document.getElementById("quantumFile")
      },
      {
        domain: "physics",
        input: document.getElementById("physicsInput"),
        button: document.getElementById("physicsSend"),
        file: document.getElementById("physicsFile")
      },
      {
        domain: "chemistry",
        input: document.getElementById("chemistryInput"),
        button: document.getElementById("chemistrySend"),
        file: document.getElementById("chemistryFile")
      },
      {
        domain: "biology",
        input: document.getElementById("biologyInput"),
        button: document.getElementById("biologySend"),
        file: document.getElementById("biologyFile")
      },
      {
        domain: "history",
        input: document.getElementById("historyInput"),
        button: document.getElementById("historySend"),
        file: document.getElementById("historyFile")
      },
      {
        domain: "psychology",
        input: document.getElementById("psychologyInput"),
        button: document.getElementById("psychologySend"),
        file: document.getElementById("psychologyFile")
      },
      {
        domain: "translation",
        input: document.getElementById("translationInput"),
        button: document.getElementById("translationSend"),
        file: document.getElementById("translationFile")
      }
    ];

    workspaceConfigs.forEach(config => {
      if (config.input && config.button) {
        connectJaceWorkspace(
          config.input,
          config.button,
          config.domain,
          config.file
        );
      }
    });
  }

  // =========================================================
  // 43A. MODULE NAVIGATION AND DYNAMIC WORKSPACES
  // =========================================================

  function initialiseJaceModuleNavigation() {
    const moduleButtons = document.querySelectorAll(
      ".module-card[data-domain]"
    );

    const workspaceContainer = document.getElementById(
      "activeDomainContainer"
    );

    if (!workspaceContainer || !moduleButtons.length) {
      console.error(
        "[J.A.C.E.] Module navigation elements were not found."
      );
      return;
    }

    // Keep each module's workspace instead of recreating it.
    const workspaceCache = {};

    function createModuleWorkspace(domain) {
      const spec = domainSpecs[domain];

      if (!spec) return null;

      const workspace = document.createElement("div");
      workspace.className = "module-workspace";
      workspace.dataset.domain = domain;

      const heading = document.createElement("h2");
      heading.textContent = spec.title;

      const subtitle = document.createElement("p");
      subtitle.textContent = spec.subtitle;

      const inputContainer = document.createElement("div");
      inputContainer.className = "input-console-container";

      const inputWrapper = document.createElement("div");
      inputWrapper.className = "input-console";

      const input = document.createElement("textarea");
      input.id = `${domain}Input`;
      input.rows = 3;
      input.placeholder = spec.placeholder;
      input.setAttribute(
        "aria-label",
        `${domain} academic question`
      );

      input.style.width = "100%";
      input.style.boxSizing = "border-box";
      input.style.background = "rgba(21, 16, 38, 0.8)";
      input.style.border = "1px solid #3d2b56";
      input.style.borderRadius = "8px";
      input.style.color = "#e2d9f3";
      input.style.padding = "10px";
      input.style.fontFamily = "inherit";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.id = `${domain}File`;
      fileInput.accept =
        "image/jpeg,image/png,image/webp,image/bmp";
      fileInput.setAttribute(
        "aria-label",
        `Upload an academic image for ${domain}`
      );

      const sendButton = document.createElement("button");
      sendButton.type = "button";
      sendButton.id = `${domain}Send`;
      sendButton.className = "execute-btn";
      sendButton.textContent = "Execute";

      inputWrapper.appendChild(input);
      inputWrapper.appendChild(fileInput);

      inputContainer.appendChild(inputWrapper);
      inputContainer.appendChild(sendButton);

      workspace.appendChild(heading);
      workspace.appendChild(subtitle);
      workspace.appendChild(inputContainer);

      // Connect this workspace to its specialist AI.
      connectJaceWorkspace(
        input,
        sendButton,
        domain,
        fileInput
      );

      workspaceContainer.appendChild(workspace);

      return workspace;
    }

    function selectModule(domain, selectedButton) {
      if (!domainSpecs[domain]) return;

      // Create the workspace only the first time it is selected.
      if (!workspaceCache[domain]) {
        workspaceCache[domain] =
          createModuleWorkspace(domain);
      }

      const selectedWorkspace = workspaceCache[domain];

      if (!selectedWorkspace) return;

      // Hide all other module workspaces.
      Object.values(workspaceCache).forEach(workspace => {
        workspace.classList.add("hidden");
      });

      // Display the selected module.
      workspaceContainer.classList.remove("hidden");
      selectedWorkspace.classList.remove("hidden");

      // Update selected navigation state.
      moduleButtons.forEach(button => {
        const isSelected = button === selectedButton;

        button.setAttribute(
          "aria-pressed",
          String(isSelected)
        );

        button.classList.toggle(
          "active",
          isSelected
        );
      });
    }

    // Connect all eight module navigation buttons.
    moduleButtons.forEach(button => {
      const domain = button.dataset.domain;

      button.setAttribute("aria-pressed", "false");

      button.addEventListener("click", () => {
        selectModule(domain, button);
      });
    });

    console.info(
      "[J.A.C.E.] Module navigation connected:",
      Object.keys(domainSpecs)
    );
  }

  // =========================================================
  // 44. DIAGNOSTIC ACCESS
  // =========================================================

  window.JACE001 = {
    learningMemory: () => {
  return getJaceLearningMemory();
},
    checkConnection: checkOllamaConnection,

    diagnostics: runJaceDiagnostics,

    performance: getJacePerformanceReport,

    logPerformance: logJacePerformance,

    stop: stopJaceGeneration,

    isGenerating: isJaceGenerating,

    clearHistory: clearJaceConversation,
        trainingStatus: getJaceTrainingStatus,

    reloadTraining: async () => {
      trainingLoadPromise = null;

      subjectTrainingExamples = [];
      responseTrainingExamples = [];

      trainingStatus.loaded = false;
      trainingStatus.subjectExamples = 0;
      trainingStatus.responseExamples = 0;
      trainingStatus.errors = [];

      return loadTrainingDatasets();
    },

    detectSubject,
    detectSubjects,
    

    detectDiagramType,

    isDiagramRequest: isAcademicDiagramRequest,

    exportPerformance: () => {
      const data = {
        project: "J.A.C.E. 001",
        exportDate: new Date().toISOString(),
        performance: getJacePerformanceReport()
      };

      const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "JACE-001-Performance-Report.json";

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);
    }
  };

  // =========================================================
  // 45. SYSTEM STARTUP CHECK
  // =========================================================

  async function initialiseJaceSystem() {
    console.info(
      "J.A.C.E. 001 — Initialising academic system..."
    );

    initialiseJaceWorkspaces();
    initialiseJaceModuleNavigation();
        loadTrainingDatasets();

    try {
      const connection =
        await checkOllamaConnection();

      if (!connection.connected) {
        console.warn(
          "[J.A.C.E.] Ollama connection unavailable:",
          connection.message
        );

        return;
      }

      if (!connection.modelAvailable) {
        console.warn(
          "[J.A.C.E.] Configured model is unavailable:",
          OLLAMA_MODEL
        );

        return;
      }

      console.info(
        "[J.A.C.E.] Academic system ready."
      );

      console.info(
        "[J.A.C.E.] Model:",
        OLLAMA_MODEL
      );

      console.info(
        "[J.A.C.E.] Diagram rendering:",
        "Mermaid loads when required."
      );

      console.info(
        "[J.A.C.E.] Image processing:",
        "Local OCR enabled."
      );

    } catch (error) {
      console.error(
        "[J.A.C.E. INITIALISATION]",
        error
      );
    }
  }

  // =========================================================
  // 46. GLOBAL ERROR HANDLING
  // =========================================================

  window.addEventListener(
    "unhandledrejection",
    event => {
      console.error(
        "[J.A.C.E. UNHANDLED PROMISE]",
        event.reason
      );
    }
  );

  window.addEventListener(
    "error",
    event => {
      console.error(
        "[J.A.C.E. SYSTEM ERROR]",
        event.message,
        event.filename,
        event.lineno
      );
    }
  );

  // =========================================================
  // 47. INITIALISE J.A.C.E. 001
  // =========================================================

  initialiseJaceSystem();

});
