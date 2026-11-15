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
  // 4. FX PANEL
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
  // 5. MODULE DEFINITIONS
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
  // 6. SUBJECT INTELLIGENCE
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
          score += keyword.split(" ").length;
        }
      }

      scores[domain] = score;
    }

    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1]);

    return sorted[0][1] > 0
      ? sorted[0][0]
      : "general";
  }
    // =========================================================
  // 7. SPECIALIST ACADEMIC INSTRUCTIONS
  // =========================================================

  const subjectInstructions = {
    general: `
IDENTITY:
You are Selené Vesperiine, the academic and research intelligence
of Project J.A.C.E. 001, created by SVS.

PURPOSE:
- You exist exclusively for academic and research purposes.
- You are not a social chatbot, companion, entertainment system,
  or general-purpose personal assistant.
- Do not engage in casual or friendly conversations.
- Do not provide unrelated real-time services.
- Your identity knowledge is limited to your name, project
  purpose, and creator SVS.
- Do not invent personal or project details.

ACADEMIC RESPONSIBILITIES:
- Answer, explain, solve, analyse, compare, derive and research.
- Use subject-appropriate terminology and methods.
- Distinguish established facts from assumptions and inferences.
- Never fabricate facts, sources, equations or references.
- Acknowledge uncertainty when information is insufficient.

ANSWER FORMAT:
- Begin with the direct answer or the method.
- Explain each distinct step on a separate line.
- Use numbered steps for calculations, procedures and derivations.
- Define technical terms when necessary.
- Use readable equations, units and tables where appropriate.
- Do not combine several reasoning steps into one paragraph.
- End with a clear conclusion when appropriate.
- Avoid unnecessary greetings, filler and repetition.

VERIFICATION:
- Check calculations, units, signs and assumptions.
- Verify conclusions using an appropriate method.
- Do not claim a result has been independently verified unless
  you have actually checked it.
- If a question is ambiguous, state your assumption or ask
  one necessary clarification.

SUBJECT ROUTING:
- Detect the academic subject in General Academic mode.
- Apply the appropriate specialist instructions.
- In a dedicated module, remain focused on that subject.
- If a question belongs to another module, recommend switching.
- Do not silently change modules or discard context.
- Cross-disciplinary academic questions may be answered
  using the relevant disciplines together.

OUTPUT:
- Use text-only responses.
- Equations, tables and mathematical notation are permitted.
- Do not claim to generate images, audio or video.
`,

    mathematics: `
ACTIVE SPECIALIST: MATHEMATICS

SCOPE:
Your mathematical knowledge must extend from foundational
arithmetic to advanced university and research-level mathematics.
Do not restrict yourself to a particular grade or curriculum.

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

MATHEMATICAL RULES:
- Use correct mathematical notation.
- Define symbols where necessary.
- Preserve exact values until approximation is appropriate.
- Check signs, domains, units and extraneous roots.
- Do not skip essential algebraic steps.
- Do not invent a theorem, identity or formula.
- For proofs, establish each logical inference.
- For advanced mathematics, maintain mathematical rigour.
- For numerical answers, state appropriate precision.
- For graphs, explain axes, coordinates and important features
  in text rather than generating an image.

EXPLANATION:
- Make foundational concepts understandable.
- Do not oversimplify advanced problems.
- Adapt depth to the actual mathematical problem.
- Explain why a method works when that understanding matters.
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
- Explain assumptions and limitations.

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
- Identify uncertainty and limitations in historical evidence.

RULES:
- Do not invent dates, events, quotations or sources.
- Avoid presenting interpretations as universally accepted facts.
- Explain historical developments in chronological order.
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
- Do not treat a theory as an established fact without evidence.
- Distinguish correlation from causation.
- Explain technical terminology clearly.
`,

    translation: `
ACTIVE SPECIALIST: ACADEMIC TRANSLATION

PURPOSE:
Translate supplied text accurately while preserving its meaning.

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

    return `
${selectedInstructions}

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
  // 9. ACADEMIC IMAGE AND DIAGRAM SYSTEM
  // =========================================================

  const academicImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp"
  ];

  let selectedAcademicImage = null;
  let extractedImageText = "";
  let academicImagePurpose = null;

  const academicImagePurposes = {
    question: "question",
    notes: "study notes",
    answer: "student answer",
    worksheet: "worksheet",
    diagram: "academic diagram",
    other: "academic material"
  };

  // =========================================================
  // 10. IDENTIFY THE PURPOSE OF AN UPLOADED IMAGE
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
      /\b(explain this diagram|analyse this diagram|what is shown)\b/.test(value)
    ) {
      return "diagram";
    }

    return "question";
  }

  // =========================================================
  // 11. VALIDATE ACADEMIC IMAGE UPLOAD
  // =========================================================

  function isSupportedAcademicImage(file) {
    if (!file) return false;

    if (!academicImageTypes.includes(file.type)) {
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

    selectedAcademicImage = file;
    extractedImageText = "";
    academicImagePurpose = "academic material";

    return true;
  }

  // =========================================================
  // 12. LOAD LOCAL OCR ENGINE
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
            reject(
              new Error("OCR engine failed to initialise.")
            );
          }
        };

        script.onerror = () => {
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
  // 13. EXTRACT TEXT FROM UPLOADED IMAGE
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

    const text = result?.data?.text?.trim() || "";

    extractedImageText = text;

    return text;
  }

  // =========================================================
  // 14. STUDENT ANSWER EVALUATION
  // =========================================================

  function buildAnswerEvaluationPrompt(extractedText) {
    return `
STUDENT ANSWER EVALUATION MODE

The uploaded material contains a student's attempted answer
or academic solution.

Evaluate the work carefully and objectively.

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

UPLOADED MATERIAL:

${extractedText}
`;
  }

  // =========================================================
  // 15. STUDY MATERIAL ANALYSIS
  // =========================================================

  function buildStudyMaterialPrompt(extractedText) {
    return `
ACADEMIC STUDY MATERIAL ANALYSIS

Analyse the following material for academic purposes.

Determine whether it contains:
- A question
- Study notes
- A worksheet
- A mathematical solution
- An academic explanation
- A diagram description
- Other academic content

Then respond according to the user's actual request.

REQUIREMENTS:

1. Preserve the meaning of the supplied material.
2. Do not invent unreadable content.
3. Explain difficult concepts clearly.
4. Correct factual errors when asked.
5. Separate extracted information from your own explanation.
6. Ask for clarification if essential information is missing.

EXTRACTED MATERIAL:

${extractedText}
`;
  }

  // =========================================================
  // 16. ACADEMIC IMAGE CONTEXT BUILDER
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
  // 17. ACADEMIC DIAGRAM REQUEST DETECTION
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
      "flowchart",
      "schematic diagram",
      "structure of",
      "illustrate"
    ];

    return diagramTerms.some((term) =>
      text.includes(term)
    );
  }

  // =========================================================
  // 18. ACADEMIC TEXT-BASED DIAGRAM INSTRUCTIONS
  // =========================================================

  function buildAcademicDiagramPrompt(query) {
    return `
ACADEMIC DIAGRAM GENERATION MODE

The user has requested an academic diagram or graph.

Create the most suitable academic representation of the
requested concept.

REQUIREMENTS:

1. Make the diagram scientifically and academically accurate.

2. Include relevant labels and terminology.

3. Maintain correct relationships, directions and proportions
   wherever they matter.

4. Use clear titles and organised sections.

5. For graphs, identify:
   - X-axis
   - Y-axis
   - Axis labels
   - Units
   - Important points
   - Scale, where applicable

6. For flowcharts, use a logical sequence and clear arrows.

7. For scientific diagrams, include the important structures
   and their correct labels.

8. For mathematical diagrams, preserve mathematical accuracy.

9. Do not invent experimental data or measurements.

10. If essential information is missing, state the assumption.

OUTPUT:
Provide a clear, labelled academic diagram using the
available text-based diagram format.

Use Mermaid syntax when a flowchart or relationship diagram
is suitable. Use mathematical notation and structured text
when those are more appropriate.

USER REQUEST:

${query}
`;
  }

  // =========================================================
  // 19. ACADEMIC IMAGE PROCESSING
  // =========================================================

  async function processAcademicImage(file, purpose = "question") {
    if (!file) {
      throw new Error("No image was selected.");
    }

    if (!selectedAcademicImage) {
      throw new Error(
        "Please confirm the academic purpose of the image."
      );
    }

    academicImagePurpose =
      academicImagePurposes[purpose] || "academic material";

    const text = await extractAcademicImageText(file);

    if (!text) {
      return {
        success: false,
        method: "local-ocr",
        text: "",
        context: "",
        message:
          "No readable text was extracted. " +
          "The image may require visual interpretation."
      };
    }

    return {
      success: true,
      method: "local-ocr",
      purpose: purpose,
      text: text,
      context: buildAcademicImageContext(
        text,
        purpose
      )
    };
  }

  // =========================================================
  // 20. OPTIONAL EXTERNAL VISION CONSENT
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
  // 21. IMAGE STATE RESET
  // =========================================================

  function clearAcademicImageState() {
    selectedAcademicImage = null;
    extractedImageText = "";
    academicImagePurpose = null;
  }

  // =========================================================
  // 22. ACADEMIC INPUT CLASSIFICATION
  // =========================================================

  function classifyAcademicInput(query) {
    const text = String(query || "").toLowerCase();

    if (isAcademicDiagramRequest(text)) {
      return "diagram";
    }

    if (
      /\b(check|evaluate|correct|mark|review)\b/.test(text) &&
      /\b(answer|solution|working|response)\b/.test(text)
    ) {
      return "answer-evaluation";
    }

    return "academic-question";
  }
    // =========================================================
  // 23. EVALUATION SYSTEM
  // =========================================================

  const JACE_EVALUATION = {
    enabled: true,

    criteria: {
      accuracy: {
        label: "Accuracy",
        weight: 25
      },

      relevance: {
        label: "Relevance",
        weight: 15
      },

      subjectKnowledge: {
        label: "Subject knowledge",
        weight: 20
      },

      clarity: {
        label: "Step-by-step clarity",
        weight: 15
      },

      completeness: {
        label: "Completeness",
        weight: 10
      },

      instructionFollowing: {
        label: "Instruction following",
        weight: 10
      },

      reliability: {
        label: "Reliability",
        weight: 5
      }
    },

    minimumAcceptableScore: 75
  };

  // =========================================================
  // 24. RESPONSE PERFORMANCE TRACKER
  // =========================================================

  let jacePerformance = {
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
    failedRequests: 0
  };

  function startJacePerformanceTracking() {
    jacePerformance.requestStartedAt = performance.now();

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
      jacePerformance.firstTokenAt = performance.now();

      jacePerformance.timeToFirstToken =
        jacePerformance.firstTokenAt -
        jacePerformance.requestStartedAt;
    }
  }

  function finishJacePerformanceTracking(ollamaData = {}) {
    jacePerformance.responseFinishedAt = performance.now();

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

  // =========================================================
  // 25. PERFORMANCE REPORT
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
        jacePerformance.failedRequests
    };
  }

  // =========================================================
  // 26. PERFORMANCE DISPLAY
  // =========================================================

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
`;
  }

  // =========================================================
  // 27. RESPONSE QUALITY EVALUATION
  // =========================================================

  function buildResponseEvaluationPrompt(
    question,
    answer,
    domain = "general"
  ) {
    return `
J.A.C.E. 001 — RESPONSE QUALITY EVALUATION

You are evaluating an academic AI response.

SUBJECT:
${domain}

ORIGINAL QUESTION:
${question}

GENERATED RESPONSE:
${answer}

Evaluate the response using these criteria:

1. ACCURACY — 25 points
Check whether the information, equations, calculations,
facts and explanations are correct.

2. RELEVANCE — 15 points
Check whether the response answers the actual question.

3. SUBJECT KNOWLEDGE — 20 points
Check whether the response demonstrates appropriate
subject-specific understanding.

4. CLARITY — 15 points
Check whether the explanation is understandable and
organised into logical steps.

5. COMPLETENESS — 10 points
Check whether important parts of the question have
been addressed.

6. INSTRUCTION FOLLOWING — 10 points
Check whether the response follows the user's instructions.

7. RELIABILITY — 5 points
Check whether uncertainty, assumptions and limitations
are handled honestly.

IMPORTANT:

- Do not award points simply because an answer sounds confident.
- Verify calculations and factual claims.
- Do not invent sources or evidence.
- Identify unsupported claims.
- Do not assume that a long answer is a good answer.
- Do not assume that a short answer is a bad answer.
- If the available information is insufficient to verify a claim,
  say so explicitly.

OUTPUT FORMAT:

Criterion-wise assessment:
Give a score for each criterion.

Total score:
Give a score out of 100.

Strengths:
List the strongest aspects.

Weaknesses:
Identify specific problems.

Required improvements:
Explain what must be corrected.

Final verdict:
State whether the response meets the expected standard.

This evaluation must be honest and evidence-based.
`;
  }

  // =========================================================
  // 28. EVALUATION RECORDS
  // =========================================================

  const jaceEvaluationRecords = [];

  function saveJaceEvaluation(record) {
    if (!record || typeof record !== "object") {
      return;
    }

    const evaluationRecord = {
      timestamp: new Date().toISOString(),

      subject: record.subject || "general",

      question: record.question || "",

      answer: record.answer || "",

      score: Number.isFinite(Number(record.score))
        ? Number(record.score)
        : null,

      accuracy: record.accuracy ?? null,

      relevance: record.relevance ?? null,

      subjectKnowledge: record.subjectKnowledge ?? null,

      clarity: record.clarity ?? null,

      completeness: record.completeness ?? null,

      instructionFollowing:
        record.instructionFollowing ?? null,

      reliability: record.reliability ?? null,

      notes: record.notes || ""
    };

    jaceEvaluationRecords.push(evaluationRecord);

    return evaluationRecord;
  }

  // =========================================================
  // 29. EVALUATION SUMMARY
  // =========================================================

  function getJaceEvaluationSummary() {
    const total = jaceEvaluationRecords.length;

    if (total === 0) {
      return {
        totalEvaluations: 0,
        averageScore: null,
        passingEvaluations: 0,
        failingEvaluations: 0,
        message: "No evaluation records are available."
      };
    }

    const scoredRecords = jaceEvaluationRecords.filter(
      record => Number.isFinite(record.score)
    );

    const averageScore = scoredRecords.length
      ? scoredRecords.reduce(
          (sum, record) => sum + record.score,
          0
        ) / scoredRecords.length
      : null;

    const passing = scoredRecords.filter(
      record =>
        record.score >= JACE_EVALUATION.minimumAcceptableScore
    ).length;

    return {
      totalEvaluations: total,

      averageScore: averageScore === null
        ? null
        : Number(averageScore.toFixed(2)),

      passingEvaluations: passing,

      failingEvaluations:
        scoredRecords.length - passing,

      message:
        averageScore === null
          ? "Evaluations have not received numerical scores."
          : averageScore >=
            JACE_EVALUATION.minimumAcceptableScore
            ? "The average score meets the target."
            : "The average score is below the target."
    };
  }

  // =========================================================
  // 30. ACADEMIC BENCHMARK QUESTIONS
  // =========================================================

  const JACE_BENCHMARKS = {
    mathematics: [
      {
        id: "MATH-001",
        question:
          "Solve 2x + 5 = 17 and explain every step.",
        expectedSkills: [
          "algebra",
          "equation solving",
          "stepwise reasoning"
        ]
      },
      {
        id: "MATH-002",
        question:
          "Differentiate x^3 + 4x^2 - 7x + 2.",
        expectedSkills: [
          "calculus",
          "power rule",
          "symbolic accuracy"
        ]
      }
    ],

    quantum: [
      {
        id: "QUANTUM-001",
        question:
          "Explain the physical meaning of a wave function.",
        expectedSkills: [
          "quantum mechanics",
          "probability interpretation",
          "conceptual clarity"
        ]
      }
    ],

    physics: [
      {
        id: "PHYSICS-001",
        question:
          "Explain Newton's second law and solve a basic force problem.",
        expectedSkills: [
          "mechanics",
          "formula application",
          "units"
        ]
      }
    ],

    chemistry: [
      {
        id: "CHEM-001",
        question:
          "Explain covalent bonding and distinguish it from ionic bonding.",
        expectedSkills: [
          "chemical bonding",
          "electron sharing",
          "conceptual comparison"
        ]
      }
    ],

    biology: [
      {
        id: "BIO-001",
        question:
          "Explain the process of photosynthesis and its importance.",
        expectedSkills: [
          "biological processes",
          "scientific terminology",
          "sequence"
        ]
      }
    ],

    history: [
      {
        id: "HISTORY-001",
        question:
          "Explain the major causes and consequences of the French Revolution.",
        expectedSkills: [
          "historical accuracy",
          "causal analysis",
          "chronology"
        ]
      }
    ],

    psychology: [
      {
        id: "PSYCH-001",
        question:
          "Explain classical conditioning with an appropriate example.",
        expectedSkills: [
          "psychological concepts",
          "terminology",
          "application"
        ]
      }
    ],

    translation: [
      {
        id: "TRANS-001",
        question:
          "Translate a short paragraph while preserving its original meaning and tone.",
        expectedSkills: [
          "meaning preservation",
          "grammar",
          "context"
        ]
      }
    ]
  };

  // =========================================================
  // 31. BENCHMARK ACCESS
  // =========================================================

  function getJaceBenchmarkQuestions(domain) {
    const key = String(domain || "").toLowerCase();

    return JACE_BENCHMARKS[key] || [];
  }

  function getAllJaceBenchmarkQuestions() {
    return Object.entries(JACE_BENCHMARKS).flatMap(
      ([subject, questions]) =>
        questions.map(question => ({
          ...question,
          subject
        }))
    );
  }

  // =========================================================
  // 32. EVALUATION STATUS
  // =========================================================

  function getJaceEvaluationStatus() {
    const summary = getJaceEvaluationSummary();

    return {
      enabled: JACE_EVALUATION.enabled,

      targetScore:
        JACE_EVALUATION.minimumAcceptableScore,

      totalBenchmarkQuestions:
        getAllJaceBenchmarkQuestions().length,

      totalEvaluationRecords:
        summary.totalEvaluations,

      averageScore:
        summary.averageScore,

      meetsTarget:
        summary.averageScore !== null &&
        summary.averageScore >=
          JACE_EVALUATION.minimumAcceptableScore
    };
  }

  // =========================================================
  // 33. EXPORT EVALUATION DATA
  // =========================================================

  function exportJaceEvaluationData() {
    const data = {
      project: "J.A.C.E. 001",

      evaluationDate: new Date().toISOString(),

      performance: getJacePerformanceReport(),

      evaluationSummary: getJaceEvaluationSummary(),

      evaluationRecords: jaceEvaluationRecords,

      benchmarks: JACE_BENCHMARKS
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      {
        type: "application/json"
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "JACE-001-Evaluation-Report.json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  }
    // =========================================================
  // 34. OLLAMA CONNECTION
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
          message: "Ollama is not responding correctly."
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
      console.error("[J.A.C.E. OLLAMA]", error);

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
  // 35. PREPARE CONVERSATION HISTORY
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

  // =========================================================
  // 36. BUILD OLLAMA REQUEST
  // =========================================================

  function buildJaceOllamaPayload({
    question,
    domain = "general",
    history = [],
    imageContext = ""
  }) {
    const systemPrompt = buildSystemPrompt(domain);

    const userContent = imageContext
      ? `${question}\n\n${imageContext}`
      : question;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },

      ...prepareJaceHistory(history),

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
  // 37. STREAM ACADEMIC RESPONSE
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
      throw new Error("Please enter an academic question.");
    }

    if (isAiProcessing) {
      throw new Error(
        "J.A.C.E. is already processing a request."
      );
    }

    const detectedDomain =
      domain || detectSubject(question) || "general";

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

      let streamFinished = false;

      while (!streamFinished) {
        const { value, done } = await reader.read();

        if (done) {
          streamFinished = true;
          break;
        }

        streamBuffer += decoder.decode(
          value,
          {
            stream: true
          }
        );

        const lines = streamBuffer.split("\n");

        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          let chunk;

          try {
            chunk = JSON.parse(line);
          } catch (error) {
            console.warn(
              "[J.A.C.E.] Ignoring an invalid stream chunk.",
              error
            );

            continue;
          }

          const token = chunk.message?.content || "";

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
      }

      // Process any remaining stream data.
      if (streamBuffer.trim()) {
        try {
          const finalChunk = JSON.parse(
            streamBuffer.trim()
          );

          const token =
            finalChunk.message?.content || "";

          if (token) {
            recordJaceFirstToken();

            completeAnswer += token;

            if (typeof onToken === "function") {
              onToken(token, completeAnswer);
            }
          }

          if (finalChunk.done) {
            finalMetrics = finalChunk;
          }

        } catch (error) {
          console.warn(
            "[J.A.C.E.] Final stream chunk could not be parsed.",
            error
          );
        }
      }

      const performanceReport =
        finishJacePerformanceTracking(finalMetrics);

      const result = {
        success: true,

        answer: completeAnswer,

        subject: detectedDomain,

        performance: performanceReport,

        ollamaMetrics: {
          totalDuration: finalMetrics.total_duration || 0,

          loadDuration: finalMetrics.load_duration || 0,

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
  // 38. STOP RESPONSE GENERATION
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

  // =========================================================
  // 39. RESPONSE GENERATION STATUS
  // =========================================================

  function isJaceGenerating() {
    return isAiProcessing;
  }

  // =========================================================
  // 40. PERFORMANCE CONSOLE DIAGNOSTICS
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
  // 41. CONNECTION DIAGNOSTICS
  // =========================================================

  async function runJaceDiagnostics() {
    const connection = await checkOllamaConnection();

    const diagnostics = {
      project: "J.A.C.E. 001",

      endpoint: OLLAMA_URL,

      configuredModel: OLLAMA_MODEL,

      connection: connection.connected,

      modelAvailable: connection.modelAvailable,

      availableModels: connection.models,

      evaluation: getJaceEvaluationStatus(),

      performance: getJacePerformanceReport()
    };

    console.group(
      "J.A.C.E. 001 — System Diagnostics"
    );

    console.table({
      endpoint: diagnostics.endpoint,

      model: diagnostics.configuredModel,

      connection: diagnostics.connection,

      modelAvailable: diagnostics.modelAvailable
    });

    console.log(diagnostics);

    console.groupEnd();

    return diagnostics;
  }
    // =========================================================
  // 42. CHAT INTERFACE ELEMENTS
  // =========================================================

  const jaceMainInput = document.querySelector(
    ".input-console-container textarea"
  );

  const jaceMainButton = document.querySelector(
    ".input-console-container .execute-btn"
  );

  const jaceMainOutput = document.getElementById(
    "subtitleOutput"
  );

  const jaceMainUpload = document.querySelector(
    ".input-console-container input[type='file']"
  );

  // =========================================================
  // 43. OUTPUT DISPLAY
  // =========================================================

  function displayJaceOutput(text) {
    const output =
      document.getElementById("subtitleOutput") ||
      document.querySelector(".subtitle-output");

    if (!output) {
      console.log("[J.A.C.E. OUTPUT]", text);
      return;
    }

    output.textContent = text;
  }

  function appendJaceOutput(text) {
    const output =
      document.getElementById("subtitleOutput") ||
      document.querySelector(".subtitle-output");

    if (!output) return;

    output.textContent += text;
  }

  // =========================================================
  // 44. CHAT HISTORY MANAGEMENT
  // =========================================================

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

    // Keep recent context within reasonable limits.
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
  // 45. ACADEMIC IMAGE PURPOSE DETECTION
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
      /\b(notes|explain these notes|summarise these notes)\b/.test(text)
    ) {
      return "notes";
    }

    if (
      /\b(explain this diagram|analyse this diagram)\b/.test(text)
    ) {
      return "diagram";
    }

    return "question";
  }

  // =========================================================
  // 46. GENERATE ACADEMIC RESPONSE
  // =========================================================

  async function handleAiQuery(
    query,
    domain = null,
    imageFile = null
  ) {
    const userQuestion = String(query || "").trim();

    if (
      (!userQuestion && !imageFile) ||
      isAiProcessing
    ) {
      return;
    }

    let imageContext = "";

    const activeDomain =
      domain || detectSubject(userQuestion) || "general";

    try {
      // -----------------------------------------------
      // IMAGE PROCESSING
      // -----------------------------------------------

      if (imageFile) {
        displayJaceOutput(
          "Analysing the uploaded academic material..."
        );

        const purpose =
          detectUploadedMaterialPurpose(userQuestion);

        const imageResult = await processAcademicImage(
          imageFile,
          purpose
        );

        if (!imageResult.success) {
          displayJaceOutput(
            imageResult.message ||
            "The uploaded image could not be processed."
          );

          return;
        }

        imageContext = imageResult.context;
      }

      // -----------------------------------------------
      // CLASSIFY THE USER'S REQUEST
      // -----------------------------------------------

      const requestType =
        classifyAcademicInput(userQuestion);

      let finalQuestion = userQuestion;

      if (requestType === "diagram") {
        finalQuestion +=
          "\n\n" +
          buildAcademicDiagramPrompt(userQuestion);
      }

      if (
        imageFile &&
        detectUploadedMaterialPurpose(userQuestion) === "answer"
      ) {
        imageContext =
          buildAnswerEvaluationPrompt(
            extractedImageText
          );
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
          (imageContext ? "\n\n[Academic image attached]" : "")
      );

      // -----------------------------------------------
      // GENERATE RESPONSE
      // -----------------------------------------------

      displayJaceOutput("J.A.C.E. is processing...");

      let streamedAnswer = "";

      const result = await generateJaceResponse({
        question: questionForModel,

        domain: activeDomain,

        history: historyForRequest,

        imageContext,

        onToken: (token) => {
          streamedAnswer += token;

          displayJaceOutput(streamedAnswer);
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

        displayJaceOutput(result.answer);

        console.log(
          formatJacePerformanceReport(
            result.performance
          )
        );
      }

      if (result.aborted) {
        displayJaceOutput(
          (result.answer || streamedAnswer) +
          "\n\n[Generation stopped]"
        );
      }

    } catch (error) {
      console.error(
        "[J.A.C.E. CHAT]",
        error
      );

      displayJaceOutput(
        "Unable to complete the request.\n\n" +
        error.message
      );

    } finally {
      clearAcademicImageState();
    }
  }

  // =========================================================
  // 47. MAIN CHAT SEND BUTTON
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
  // 48. IMAGE UPLOAD CONTROL
  // =========================================================

  function connectJaceImageUpload(input) {
    if (!input) return;

    input.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];

      if (!file) return;

      if (
        !requestAcademicImageConfirmation(file)
      ) {
        input.value = "";
        return;
      }

      const filename =
        input.parentElement?.querySelector(
          ".selene-upload-filename"
        );

      if (filename) {
        filename.textContent =
          "Academic image selected: " + file.name;
      }

      selectedAcademicImage = file;
    });
  }

  connectJaceImageUpload(jaceMainUpload);

  // =========================================================
  // 49. STOP BUTTON CONNECTION
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
  // 50. MODULE WORKSPACE CONNECTION
  // =========================================================

  function connectJaceWorkspace(
    input,
    button,
    domain,
    fileInput = null
  ) {
    if (!input || !button) return;

    const submit = () => {
      handleAiQuery(
        input.value,
        domain,
        fileInput?.files?.[0] || null
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
  // 51. DIAGNOSTIC ACCESS
  // =========================================================

  window.JACE001 = {
    checkConnection: checkOllamaConnection,

    diagnostics: runJaceDiagnostics,

    performance: getJacePerformanceReport,

    evaluation: getJaceEvaluationSummary,

    evaluationStatus: getJaceEvaluationStatus,

    benchmarks: getAllJaceBenchmarkQuestions,

    exportEvaluation: exportJaceEvaluationData,

    stop: stopJaceGeneration,

    clearHistory: clearJaceConversation
  };
    // =========================================================
  // 52. MODULE WORKSPACE INTEGRATION
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
  // 53. SYSTEM STARTUP CHECK
  // =========================================================

  async function initialiseJaceSystem() {
    console.info(
      "J.A.C.E. 001 — Initialising academic system..."
    );

    initialiseJaceWorkspaces();

    try {
      const connection = await checkOllamaConnection();

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

    } catch (error) {
      console.error(
        "[J.A.C.E. INITIALISATION]",
        error
      );
    }
  }

  // =========================================================
  // 54. GLOBAL ERROR HANDLING
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
  // 55. INITIALISE J.A.C.E. 001
  // =========================================================

  initialiseJaceSystem();

});
