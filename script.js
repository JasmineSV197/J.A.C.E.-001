document.addEventListener("DOMContentLoaded", () => {
  // --- Canvas Floating Purple Bubbles Engine ---
  const canvas = document.getElementById("bubbleCanvas");
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Effect Control Parameters
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
      ctx.shadowBlur = 0; // Reset blur for optimization
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

  // --- Effect Control Panel Handlers ---
  const fxPanel = document.getElementById("fxPanel");
  const toggleFxBtn = document.getElementById("toggleFxPanelBtn");

  toggleFxBtn.addEventListener("click", () => {
    fxPanel.classList.toggle("hidden");
  });

  document.getElementById("bubbleCount").addEventListener("input", (e) => {
    fxParams.count = parseInt(e.target.value);
    bubbles = Array.from({ length: fxParams.count }, () => new Bubble());
  });

  document.getElementById("bubbleSpeed").addEventListener("input", (e) => {
    fxParams.maxSpeed = parseInt(e.target.value);
    bubbles.forEach((b) => (b.speed = (Math.random() * 0.5 + 0.2) * (fxParams.maxSpeed / 2)));
  });

  document.getElementById("bubbleSize").addEventListener("input", (e) => {
    fxParams.maxSize = parseInt(e.target.value);
  });

  document.getElementById("glowIntensity").addEventListener("input", (e) => {
    fxParams.glow = parseInt(e.target.value);
  });

  document.getElementById("resetFxBtn").addEventListener("click", () => {
    fxParams.count = 50;
    fxParams.maxSpeed = 3;
    fxParams.maxSize = 15;
    fxParams.glow = 25;
    document.getElementById("bubbleCount").value = 50;
    document.getElementById("bubbleSpeed").value = 3;
    document.getElementById("bubbleSize").value = 15;
    document.getElementById("glowIntensity").value = 25;
    bubbles = Array.from({ length: fxParams.count }, () => new Bubble());
  });

  // --- Module Selection Interactions ---
  const moduleCards = document.querySelectorAll(".module-card");
  const subtitleOutput = document.getElementById("subtitleOutput");

  moduleCards.forEach((card) => {
    card.addEventListener("click", () => {
      const domain = card.getAttribute("data-domain");
      subtitleOutput.textContent = `"Loading specialized module: ${domain.toUpperCase()}..."`;
    });
  });
});
