/* ==========================================================
   DOOMSDAY - Avengers Edition | Eventify
   ========================================================== */

(function () {
  "use strict";

  // ---------- Data ----------
  const EVENTS = [
    {
      id: "tech-fest",
      title: "Tech Fest 2026",
      tag: "Stark Division",
      description: "Explore technology, innovation, and exciting projects built by the next generation of engineers.",
      dateLabel: "20 November 2026",
      start: new Date(2026, 10, 20, 10, 0, 0), // months are 0-based
      venue: "College Auditorium",
      capacity: 100,
      alreadyTaken: 62
    },
    {
      id: "music-night",
      title: "Music Night",
      tag: "Victory Celebration",
      description: "Enjoy live music and performances with friends. Every team needs a night off.",
      dateLabel: "25 November 2026",
      start: new Date(2026, 10, 25, 18, 30, 0),
      venue: "Open Air Stage",
      capacity: 200,
      alreadyTaken: 141
    },
    {
      id: "startup-workshop",
      title: "Startup Workshop",
      tag: "Rebuild Initiative",
      description: "Learn about entrepreneurship and business ideas, and how to rebuild from the ground up.",
      dateLabel: "30 November 2026",
      start: new Date(2026, 10, 30, 11, 0, 0),
      venue: "Seminar Hall",
      capacity: 50,
      alreadyTaken: 44
    }
  ];

  const STORAGE_KEY = "eventify_registrations_v1";

  // ---------- Storage helpers (safe if storage is blocked) ----------
  function loadRegistrations() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveRegistrations(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      /* storage unavailable: the page still works for this session */
    }
  }

  let registrations = loadRegistrations();

  // ---------- DOM ----------
  const grid = document.getElementById("eventsGrid");
  const form = document.getElementById("registrationForm");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const eventSelect = document.getElementById("event");
  const messageEl = document.getElementById("message");
  const roster = document.getElementById("roster");
  const rosterList = document.getElementById("rosterList");
  const clearBtn = document.getElementById("clearRoster");

  // ---------- Seats ----------
  function seatsLeft(ev) {
    const mine = registrations.filter(function (r) { return r.eventId === ev.id; }).length;
    return Math.max(ev.capacity - ev.alreadyTaken - mine, 0);
  }

  // ---------- Render events ----------
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function labelled(label, value) {
    const p = document.createElement("p");
    const strong = el("strong", "", label + " ");
    p.appendChild(strong);
    p.appendChild(document.createTextNode(value));
    return p;
  }

  function renderEvents() {
    grid.textContent = "";

    EVENTS.forEach(function (ev) {
      const left = seatsLeft(ev);
      const filledPct = Math.round(((ev.capacity - left) / ev.capacity) * 100);

      const card = el("article", "card");
      card.appendChild(el("span", "card-tag", ev.tag));
      card.appendChild(el("h3", "", ev.title));
      card.appendChild(el("p", "card-desc", ev.description));
      card.appendChild(labelled("Date:", ev.dateLabel));
      card.appendChild(labelled("Venue:", ev.venue));

      const seats = el("div", "seats");
      const bar = el("div", "seats-bar");
      const fill = el("div", "seats-fill" + (left <= 10 ? " low" : ""));
      fill.style.width = filledPct + "%";
      bar.appendChild(fill);
      seats.appendChild(bar);
      seats.appendChild(el("p", "seats-text",
        left === 0 ? "Sold out" : left + " of " + ev.capacity + " seats left"));
      card.appendChild(seats);

      const btn = el("button", "btn", left === 0 ? "Sold out" : "Register");
      btn.type = "button";
      btn.disabled = left === 0;
      btn.addEventListener("click", function () { chooseEvent(ev.title); });
      card.appendChild(btn);

      grid.appendChild(card);
    });
  }

  function renderSelect() {
    // keep the first placeholder option, rebuild the rest
    while (eventSelect.options.length > 1) eventSelect.remove(1);
    EVENTS.forEach(function (ev) {
      const opt = document.createElement("option");
      opt.value = ev.title;
      opt.textContent = ev.title;
      eventSelect.appendChild(opt);
    });
  }

  // ---------- Roster ----------
  function renderRoster() {
    rosterList.textContent = "";
    roster.hidden = registrations.length === 0;

    registrations.forEach(function (r) {
      const li = document.createElement("li");
      li.appendChild(el("span", "", r.eventTitle));
      li.appendChild(el("span", "", r.code));
      rosterList.appendChild(li);
    });
  }

  // ---------- Choose event from card ----------
  function chooseEvent(eventName) {
    eventSelect.value = eventName;
    clearErrors();
    document.getElementById("register").scrollIntoView({ behavior: "smooth" });
    nameInput.focus({ preventScroll: true });
  }

  // ---------- Validation ----------
  function setError(input, errorId, text) {
    document.getElementById(errorId).textContent = text;
    input.setAttribute("aria-invalid", text ? "true" : "false");
  }

  function clearErrors() {
    setError(nameInput, "nameError", "");
    setError(emailInput, "emailError", "");
    setError(eventSelect, "eventError", "");
    messageEl.textContent = "";
    messageEl.style.color = "";
  }

  function validate() {
    let ok = true;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (name.length < 2) {
      setError(nameInput, "nameError", "Enter your full name.");
      ok = false;
    } else {
      setError(nameInput, "nameError", "");
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError(emailInput, "emailError", "Enter a valid email address, like name@example.com.");
      ok = false;
    } else {
      setError(emailInput, "emailError", "");
    }

    if (!eventSelect.value) {
      setError(eventSelect, "eventError", "Choose an event to join.");
      ok = false;
    } else {
      setError(eventSelect, "eventError", "");
    }

    return ok;
  }

  function makeCode(ev) {
    const n = String(registrations.length + 1).padStart(3, "0");
    return ev.id.slice(0, 4).toUpperCase() + "-" + n;
  }

  // ---------- Submit ----------
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    messageEl.textContent = "";
    if (!validate()) return;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const ev = EVENTS.find(function (x) { return x.title === eventSelect.value; });
    if (!ev) return;

    const duplicate = registrations.some(function (r) {
      return r.email === email && r.eventId === ev.id;
    });
    if (duplicate) {
      messageEl.style.color = "var(--alert)";
      messageEl.textContent = "This email is already registered for " + ev.title + ".";
      return;
    }

    if (seatsLeft(ev) === 0) {
      messageEl.style.color = "var(--alert)";
      messageEl.textContent = ev.title + " is sold out. Choose another event.";
      return;
    }

    const record = {
      name: name,
      email: email,
      eventId: ev.id,
      eventTitle: ev.title,
      code: makeCode(ev)
    };
    registrations.push(record);
    saveRegistrations(registrations);

    messageEl.style.color = "";
    messageEl.textContent =
      "Thank you, " + name + "! Your registration request for " + ev.title +
      " has been received in this portal. Your code is " + record.code + ".";

    form.reset();
    renderEvents();
    renderRoster();
  });

  // Clear errors as the user fixes fields
  [nameInput, emailInput, eventSelect].forEach(function (field) {
    field.addEventListener("input", function () {
      field.setAttribute("aria-invalid", "false");
    });
  });

  clearBtn.addEventListener("click", function () {
    registrations = [];
    saveRegistrations(registrations);
    renderEvents();
    renderRoster();
    messageEl.textContent = "";
  });

  // ---------- Doom clock ----------
  const cd = {
    days: document.getElementById("cdDays"),
    hours: document.getElementById("cdHours"),
    minutes: document.getElementById("cdMinutes"),
    seconds: document.getElementById("cdSeconds"),
    label: document.getElementById("clockLabel")
  };

  function pad(n) { return String(n).padStart(2, "0"); }

  function tick() {
    const now = Date.now();
    const next = EVENTS
      .filter(function (ev) { return ev.start.getTime() > now; })
      .sort(function (a, b) { return a.start - b.start; })[0];

    if (!next) {
      cd.label.textContent = "All missions are complete";
      cd.days.textContent = cd.hours.textContent =
        cd.minutes.textContent = cd.seconds.textContent = "00";
      return;
    }

    cd.label.textContent = "Time until " + next.title;

    const diff = next.start.getTime() - now;
    const s = Math.floor(diff / 1000);
    cd.days.textContent = pad(Math.floor(s / 86400));
    cd.hours.textContent = pad(Math.floor((s % 86400) / 3600));
    cd.minutes.textContent = pad(Math.floor((s % 3600) / 60));
    cd.seconds.textContent = pad(s % 60);
  }

  // ---------- Animated background: drifting fog, embers, green lightning ----------
  function startBackground() {
    const canvas = document.getElementById("bgCanvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1;
    let embers = [];
    let bolts = [];
    let flash = 0;
    let nextBolt = performance.now() + 2500;
    let running = true;

    const fog = [
      { x: 0.2, y: 0.3, r: 0.55, sx: 0.00004, phase: 0 },
      { x: 0.8, y: 0.6, r: 0.6,  sx: 0.00003, phase: 2 },
      { x: 0.5, y: 0.95, r: 0.7, sx: 0.00005, phase: 4 }
    ];

    function rand(min, max) { return min + Math.random() * (max - min); }

    function makeEmber(initial) {
      const gold = Math.random() < 0.18;
      return {
        x: rand(0, w),
        y: initial ? rand(0, h) : h + rand(0, 40),
        size: rand(0.8, 2.6),
        speed: rand(0.25, 1.1),
        sway: rand(0.4, 1.6),
        phase: rand(0, Math.PI * 2),
        life: rand(0.35, 1),
        color: gold ? "232,176,74" : "47,191,113"
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(110, (w * h) / 14000));
      embers = [];
      for (let i = 0; i < count; i++) embers.push(makeEmber(true));
    }

    // Jagged lightning path from the top of the screen downward
    function makeBolt() {
      const pts = [];
      let x = rand(w * 0.1, w * 0.9);
      let y = -10;
      const endY = rand(h * 0.35, h * 0.85);
      while (y < endY) {
        pts.push([x, y]);
        x += rand(-34, 34);
        y += rand(18, 46);
      }
      const branch = [];
      if (pts.length > 4) {
        const from = pts[Math.floor(pts.length * rand(0.3, 0.6))];
        let bx = from[0], by = from[1];
        for (let i = 0; i < 5; i++) {
          branch.push([bx, by]);
          bx += rand(10, 40) * (Math.random() < 0.5 ? -1 : 1);
          by += rand(14, 34);
        }
      }
      return { pts: pts, branch: branch, age: 0, life: 420 };
    }

    function drawPath(pts) {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }

    function drawFog(t) {
      fog.forEach(function (f) {
        const cx = (f.x + Math.sin(t * f.sx * 6 + f.phase) * 0.12) * w;
        const cy = (f.y + Math.cos(t * f.sx * 5 + f.phase) * 0.06) * h;
        const r = f.r * Math.max(w, h);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, "rgba(20,102,63,0.20)");
        g.addColorStop(0.5, "rgba(20,102,63,0.07)");
        g.addColorStop(1, "rgba(20,102,63,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
    }

    function drawEmbers(t, dt) {
      embers.forEach(function (e, i) {
        if (!reduceMotion) {
          e.y -= e.speed * dt * 0.06;
          e.x += Math.sin(t * 0.0006 * e.sway + e.phase) * 0.35;
        }
        if (e.y < -20) embers[i] = makeEmber(false);

        const flicker = 0.6 + 0.4 * Math.sin(t * 0.004 + e.phase * 3);
        const alpha = e.life * flicker * Math.min(1, (h - e.y) / 120 + 0.2);

        ctx.beginPath();
        ctx.fillStyle = "rgba(" + e.color + "," + (alpha * 0.9).toFixed(3) + ")";
        ctx.shadowColor = "rgba(" + e.color + ",0.9)";
        ctx.shadowBlur = e.size * 5;
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }

    function drawBolts(now, dt) {
      if (!reduceMotion && now > nextBolt) {
        bolts.push(makeBolt());
        flash = 0.12;
        nextBolt = now + rand(4000, 9000);
      }

      bolts = bolts.filter(function (b) { return b.age < b.life; });
      bolts.forEach(function (b) {
        b.age += dt;
        const k = 1 - b.age / b.life;
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(61,235,140,1)";
        ctx.shadowBlur = 18;
        ctx.strokeStyle = "rgba(61,235,140," + (0.7 * k).toFixed(3) + ")";
        ctx.lineWidth = 2.2;
        drawPath(b.pts);
        ctx.lineWidth = 1.2;
        drawPath(b.branch);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(230,255,240," + (0.9 * k).toFixed(3) + ")";
        ctx.lineWidth = 0.9;
        drawPath(b.pts);
      });

      if (flash > 0.002) {
        ctx.fillStyle = "rgba(47,191,113," + flash.toFixed(3) + ")";
        ctx.fillRect(0, 0, w, h);
        flash *= 0.88;
      }
    }

    let last = performance.now();
    let rafId = 0;
    function frame(now) {
      if (!running) return;
      const dt = Math.min(now - last, 50);
      last = now;

      ctx.clearRect(0, 0, w, h);
      drawFog(now);
      drawEmbers(now, dt);
      drawBolts(now, dt);

      if (!reduceMotion) rafId = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);

    // Pause when the tab is hidden to save battery
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running && !reduceMotion) {
        cancelAnimationFrame(rafId);
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    });

    rafId = requestAnimationFrame(frame);
  }

  // ---------- Init ----------
  startBackground();
  renderSelect();
  renderEvents();
  renderRoster();
  tick();
  setInterval(tick, 1000);
})();
