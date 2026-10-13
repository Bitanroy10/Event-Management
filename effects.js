/* ==========================================================
   DOOMSDAY | UI effects: reveal, typewriter, count-up, tilt,
   scroll progress, active nav, cursor glow
   Loaded after script.js so the event cards already exist.
   ========================================================== */

(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;
  const root = document.documentElement;

  // ---------- Scroll reveal ----------
  const revealTargets = Array.prototype.slice.call(
    document.querySelectorAll(".section-title, .section-sub, #registrationForm, .stat, .card")
  );

  revealTargets.forEach(function (node, i) {
    node.classList.add("reveal");
    // stagger siblings inside the same grid
    if (node.classList.contains("card") || node.classList.contains("stat")) {
      const siblings = Array.prototype.slice.call(node.parentElement.children);
      node.style.setProperty("--d", (siblings.indexOf(node) * 0.12) + "s");
    }
  });

  if (reduce || !hasIO) {
    revealTargets.forEach(function (n) { n.classList.add("in-view"); });
  } else {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(function (n) { revealObserver.observe(n); });
  }

  // ---------- Typewriter on the hero kicker ----------
  const kicker = document.getElementById("typeKicker");
  if (kicker && !reduce) {
    const full = kicker.textContent.trim();
    kicker.style.minHeight = kicker.offsetHeight + "px"; // avoid layout jump
    kicker.textContent = "";
    kicker.classList.add("typing");
    let i = 0;
    const timer = setInterval(function () {
      kicker.textContent = full.slice(0, ++i);
      if (i >= full.length) {
        clearInterval(timer);
        setTimeout(function () { kicker.classList.remove("typing"); }, 1200);
      }
    }, 28);
  }

  // ---------- Count-up numbers ----------
  const nums = Array.prototype.slice.call(document.querySelectorAll(".stat-num"));

  function countUp(el) {
    const target = Number(el.dataset.target) || 0;
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (!reduce && hasIO) {
    nums.forEach(function (n) { n.textContent = "0"; });
    const numObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          numObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { numObserver.observe(n); });
  }

  // ---------- Card tilt + spotlight (event delegation) ----------
  const grid = document.getElementById("eventsGrid");
  if (grid && !reduce) {
    grid.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      const card = e.target.closest(".card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
      card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    });

    grid.addEventListener("pointerout", function (e) {
      const card = e.target.closest(".card");
      if (!card || card.contains(e.relatedTarget)) return;
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  }

  // ---------- Scroll progress + shrinking header ----------
  const progress = document.getElementById("scrollProgress");
  const header = document.querySelector(".site-header");
  let ticking = false;

  function onScroll() {
    const max = root.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.setProperty("--p", p.toFixed(4));
    if (header) header.classList.toggle("scrolled", window.scrollY > 40);
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  // ---------- Highlight the nav link of the section in view ----------
  const navLinks = Array.prototype.slice.call(document.querySelectorAll("nav a"));
  if (hasIO) {
    const sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -50% 0px" });

    ["home", "events", "register"].forEach(function (id) {
      const sec = document.getElementById(id);
      if (sec) sectionObserver.observe(sec);
    });
  }

  // ---------- Cursor glow ----------
  const glow = document.getElementById("cursorGlow");
  if (glow && !reduce) {
    let gx = 0, gy = 0, glowTicking = false;
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      gx = e.clientX;
      gy = e.clientY;
      if (!glowTicking) {
        glowTicking = true;
        requestAnimationFrame(function () {
          glow.style.setProperty("--cx", gx + "px");
          glow.style.setProperty("--cy", gy + "px");
          glowTicking = false;
        });
      }
    });
  }
})();
