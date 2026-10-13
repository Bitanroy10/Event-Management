/* ==========================================================
   DOOMSDAY backdrop: rising embers + occasional energy bolt
   Respects prefers-reduced-motion (the canvas is hidden by CSS
   and the loop never starts).
   ========================================================== */

(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.getElementById("doomCanvas");
  const flashEl = document.getElementById("doomFlash");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let embers = [];
  let bolt = null; // { points, life }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // fewer particles on small screens
    const count = Math.round(Math.min(Math.max(w / 18, 32), 80));
    embers = [];
    for (let i = 0; i < count; i++) embers.push(makeEmber(true));
  }

  function makeEmber(randomY) {
    const hot = Math.random() < 0.12; // a few gold sparks among the green
    return {
      x: rand(0, w),
      y: randomY ? rand(0, h) : h + rand(10, 80),
      r: rand(0.8, 2.4),
      speed: rand(0.15, 0.55),
      drift: rand(-0.15, 0.15),
      sway: rand(0.4, 1.6),
      phase: rand(0, Math.PI * 2),
      flicker: rand(0.006, 0.02),
      hue: hot ? "255,215,106" : "77,255,176"
    };
  }

  // Jagged green energy bolt from the top of the screen
  function makeBolt() {
    const points = [];
    let x = rand(w * 0.15, w * 0.85);
    let y = 0;
    points.push([x, y]);
    while (y < h * rand(0.45, 0.75)) {
      x += rand(-40, 40);
      y += rand(20, 55);
      points.push([x, y]);
    }
    return { points: points, life: 1 };
  }

  function drawBolt() {
    if (!bolt) return;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(77,255,176," + (bolt.life * 0.5).toFixed(3) + ")";
    ctx.shadowColor = "rgba(77,255,176,0.9)";
    ctx.shadowBlur = 26;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    bolt.points.forEach(function (p, i) {
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
    ctx.stroke();
    ctx.restore();

    bolt.life -= 0.018;
    if (bolt.life <= 0) bolt = null;
  }

  function triggerStrike() {
    bolt = makeBolt();
    if (flashEl) {
      flashEl.classList.remove("on");
      void flashEl.offsetWidth; // restart the CSS animation
      flashEl.classList.add("on");
    }
    setTimeout(triggerStrike, rand(14000, 24000));
  }

  let last = 0;
  let running = true;

  function frame(t) {
    if (!running) return;
    const dt = Math.min((t - last) / 16.67 || 1, 3); // normalise to ~60fps
    last = t;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.y -= e.speed * dt;
      e.x += (e.drift + Math.sin(e.phase) * 0.15 * e.sway) * dt;
      e.phase += e.flicker * dt;

      if (e.y < -20 || e.x < -20 || e.x > w + 20) {
        embers[i] = makeEmber(false);
        continue;
      }

      // fade in near the bottom, fade out near the top
      const edge = Math.min(e.y / (h * 0.25), (h - e.y) / (h * 0.08), 1);
      const twinkle = 0.55 + Math.sin(e.phase * 3) * 0.3;
      const alpha = Math.max(edge, 0) * twinkle;

      ctx.beginPath();
      ctx.fillStyle = "rgba(" + e.hue + "," + alpha.toFixed(3) + ")";
      ctx.shadowColor = "rgba(" + e.hue + ",0.8)";
      ctx.shadowBlur = e.r * 5;
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    drawBolt();
    requestAnimationFrame(frame);
  }

  // Pause when the tab is hidden to save battery
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });

  window.addEventListener("resize", resize);
  resize();
  setTimeout(triggerStrike, 3500);
  requestAnimationFrame(frame);
})();
