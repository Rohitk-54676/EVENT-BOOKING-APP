/* Ambient floating particles — shared across all auth pages */
(function () {
  const canvas = document.getElementById("particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let W, H, particles;

  const GOLD  = "rgba(201,168,76,";
  const BLUE  = "rgba(59,130,246,";
  const WHITE = "rgba(255,255,255,";

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticles(count = 55) {
    return Array.from({ length: count }, () => ({
      x:    rand(0, W),
      y:    rand(0, H),
      r:    rand(0.4, 2.2),
      vx:   rand(-0.18, 0.18),
      vy:   rand(-0.22, 0.08),
      alpha:rand(0.15, 0.55),
      color: Math.random() < 0.5 ? GOLD : Math.random() < 0.5 ? BLUE : WHITE,
      pulse: rand(0, Math.PI * 2),
      pulseSpeed: rand(0.008, 0.022),
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      p.pulse += p.pulseSpeed;
      const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + a + ")";
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;
    });

    requestAnimationFrame(draw);
  }

  resize();
  particles = createParticles();
  draw();

  window.addEventListener("resize", () => {
    resize();
    particles = createParticles();
  });
})();