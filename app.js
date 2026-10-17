/* SentiQ — UI, animations and dashboard rendering */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  /* ---------------- Theme ---------------- */
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem("sentiq-theme"); } catch {}
  root.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  $("#themeToggle").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("sentiq-theme", root.dataset.theme); } catch {}
    if (state.result) renderCharts(state.result);
  });

  /* ---------------- Preloader ---------------- */
  // The loader stays until the logo has finished drawing AND the page has loaded,
  // then the logo flies into the nav's brand slot.
  document.body.classList.add("loading");
  const plSpark = $(".pl-spark");
  plSpark.addEventListener("animationend", () => plSpark.classList.add("settled"), { once: true });
  const DRAW_MS = reduceMotion ? 0 : 2450;
  const shownAt = performance.now();
  let pageLoaded = document.readyState === "complete", preloaderDone = false;
  addEventListener("load", () => { pageLoaded = true; maybeFinishPreloader(); });
  setTimeout(maybeFinishPreloader, DRAW_MS);
  setTimeout(finishPreloader, 6000); // never block the page on a slow CDN
  function maybeFinishPreloader() {
    if (pageLoaded && performance.now() - shownAt >= DRAW_MS - 30) finishPreloader();
  }
  async function finishPreloader() {
    if (preloaderDone) return;
    preloaderDone = true;
    const pre = $("#preloader"), mark = $(".pl-mark"), target = $("#nav .brand-mark");
    document.body.classList.remove("loading"); // before measuring, in case the scrollbar shifts the nav
    const release = () => { pre.classList.add("done"); startReveals(); };
    if (reduceMotion || !target.offsetWidth) { release(); return; }
    target.style.opacity = "0";
    pre.classList.add("leaving");
    const a = mark.getBoundingClientRect(), b = target.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const k = b.width / a.width;
    plSpark.classList.add("settled");
    mark.classList.add("flying");
    const flight = mark.animate([
      { transform: "translate(0, 0) scale(1)" },
      { transform: "translate(0, -14px) scale(1.06)", offset: 0.18 },
      { transform: `translate(${dx}px, ${dy}px) scale(${k})` },
    ], { duration: 1150, easing: "cubic-bezier(.65, 0, .25, 1)", fill: "forwards" });
    setTimeout(startReveals, 650); // let the page start revealing while the logo is in flight
    await flight.finished.catch(() => {});
    target.style.opacity = "";
    target.classList.add("landed");
    target.addEventListener("animationend", () => target.classList.remove("landed"), { once: true });
    pre.style.transition = "none";
    release();
  }
  $("#year").textContent = new Date().getFullYear();

  /* ---------------- Particles (connected constellation) ---------------- */
  const cvs = $("#particles"), ctx = cvs.getContext("2d");
  let W, H, parts = [], mouse = { x: -999, y: -999 };
  function sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cvs.width = innerWidth * dpr; H = cvs.height = innerHeight * dpr;
    cvs.style.width = innerWidth + "px"; cvs.style.height = innerHeight + "px";
    const n = Math.min(70, Math.floor((innerWidth * innerHeight) / 22000));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35 * dpr, vy: (Math.random() - .5) * .35 * dpr,
      r: (Math.random() * 1.8 + .8) * dpr, h: [258, 190, 160, 340][Math.floor(Math.random() * 4)],
    }));
  }
  function tick() {
    ctx.clearRect(0, 0, W, H);
    const dpr = Math.min(devicePixelRatio || 1, 2), dark = root.dataset.theme === "dark";
    const maxD = 130 * dpr;
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mouse.x * dpr, dy = p.y - mouse.y * dpr, d = Math.hypot(dx, dy);
      if (d < 120 * dpr) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.h}, 85%, ${dark ? 70 : 60}%, ${dark ? .8 : .6})`; ctx.fill();
    }
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i], b = parts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < maxD) {
        ctx.strokeStyle = `rgba(124, 92, 255, ${(1 - d / maxD) * (dark ? .3 : .18)})`;
        ctx.lineWidth = dpr * .8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    requestAnimationFrame(tick);
  }
  sizeCanvas(); addEventListener("resize", sizeCanvas);
  if (!reduceMotion) tick();

  /* ---------------- Cursor glow ---------------- */
  const glow = $(".cursor-glow");
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (finePointer) glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  });

  /* ---------------- Scroll: progress, nav, active link, parallax ---------------- */
  const nav = $("#nav"), bar = $(".scroll-progress");
  const sectionLinks = $$(".nav-links a");
  const sections = sectionLinks.map((a) => [a, $(a.getAttribute("href"))]);
  let scrolled = null, active = null, ticking = false;
  // Batched into one rAF per frame; DOM is only touched when something actually changes.
  function update() {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    const isScrolled = y > 30;
    if (isScrolled !== scrolled) { scrolled = isScrolled; nav.classList.toggle("scrolled", isScrolled); }
    let current = null;
    for (const [a, s] of sections) if (s && s.getBoundingClientRect().top < innerHeight * .4) current = a;
    if (current !== active) {
      active?.classList.remove("active");
      current?.classList.add("active");
      active = current;
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  $("#burger").addEventListener("click", () => { setTeam(false); nav.classList.toggle("open"); });

  /* ---------------- Team menu ---------------- */
  const team = $(".team"), teamBtn = $("#teamToggle");
  function setTeam(open) {
    team.classList.toggle("open", open);
    teamBtn.setAttribute("aria-expanded", String(open));
  }
  teamBtn.addEventListener("click", (e) => { e.stopPropagation(); nav.classList.remove("open"); setTeam(!team.classList.contains("open")); });
  document.addEventListener("click", (e) => { if (!team.contains(e.target)) setTeam(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && team.classList.contains("open")) { setTeam(false); teamBtn.focus(); } });
  sectionLinks.forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

  /* ---------------- Reveal + counters ---------------- */
  function countUp(el) {
    const end = parseFloat(el.dataset.count), pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const dur = 1600, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = pre + Math.round(end * e) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(countUp);
      if (en.target.dataset.count) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: .15 });
  // stagger siblings
  $$(".steps, .bento, .why-grid").forEach((g) => $$(".reveal", g).forEach((el, i) => el.style.setProperty("--d", i * 0.12 + "s")));
  $$(".hero-copy .reveal").forEach((el, i) => el.style.setProperty("--d", 0.1 + i * 0.1 + "s"));
  $(".hero-visual").style.setProperty("--d", "0.35s");
  let revealsStarted = false;
  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
    $$(".reveal").forEach((el) => io.observe(el));
  }

  /* ---------------- Typer ---------------- */
  const words = ["insights", "decisions", "action", "growth", "clarity"];
  const typer = $("#typer");
  let wi = 0;
  async function typeLoop() {
    await sleep(2600);
    while (true) {
      const w = typer.textContent;
      for (let i = w.length; i >= 0; i--) { typer.textContent = w.slice(0, i); await sleep(45); }
      wi = (wi + 1) % words.length;
      const nw = words[wi];
      for (let i = 1; i <= nw.length; i++) { typer.textContent = nw.slice(0, i); await sleep(90); }
      await sleep(2200);
    }
  }
  if (!reduceMotion) typeLoop();

  /* ---------------- Step icons redraw when the cursor comes near ---------------- */
  if (finePointer && !reduceMotion) {
    const NEAR = 120, FAR = 170; // px from the icon's edge; hysteresis stops flicker at the boundary
    const icons = $$(".step-icon").map((el) => ({ el, near: false, flip: false }));
    let px = 0, py = 0, queued = false;
    const check = () => {
      queued = false;
      for (const ic of icons) {
        if (!ic.el.closest(".step").classList.contains("in")) continue;
        const r = ic.el.getBoundingClientRect();
        const dx = Math.max(r.left - px, 0, px - r.right), dy = Math.max(r.top - py, 0, py - r.bottom);
        const d = Math.hypot(dx, dy);
        if (!ic.near && d < NEAR) {
          ic.near = true;
          ic.flip = !ic.flip;
          ic.el.classList.toggle("redraw-a", ic.flip);
          ic.el.classList.toggle("redraw-b", !ic.flip);
        } else if (ic.near && d > FAR) ic.near = false;
      }
    };
    addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; if (!queued) { queued = true; requestAnimationFrame(check); } }, { passive: true });
  }

  /* ---------------- Phone carousels: position dots (hidden on desktop by CSS) ---------------- */
  $$(".steps, .bento, .why-grid").forEach((track) => {
    const items = [...track.children].filter((c) => !c.matches("svg"));
    const dots = document.createElement("div");
    dots.className = "carousel-dots";
    dots.innerHTML = items.map((_, i) => `<button type="button" aria-label="Show card ${i + 1}"></button>`).join("");
    track.after(dots);
    const btns = [...dots.children];
    btns.forEach((b, i) => b.addEventListener("click", () => track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft - 16, behavior: "smooth" })));
    let ticking = false;
    const sync = () => {
      ticking = false;
      const x = track.scrollLeft + 24;
      let idx = 0;
      items.forEach((it, i) => { if (it.offsetLeft - track.offsetLeft - 16 <= x) idx = i; });
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) idx = items.length - 1;
      btns.forEach((b, i) => b.classList.toggle("on", i === idx));
    };
    track.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }, { passive: true });
    sync();
  });

  /* ---------------- Tilt, magnetic, ripple ---------------- */
  function bindTilt(el) {
    if (!finePointer || reduceMotion) return;
    const max = el.classList.contains("hero-visual") ? 10 : 7;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(0)`;
      el.style.setProperty("--mx", x * 100 + "%"); el.style.setProperty("--my", y * 100 + "%");
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  }
  $$("[data-tilt]").forEach(bindTilt);

  function bindMagnetic(el) {
    if (!finePointer || reduceMotion) return;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  }
  $$(".magnetic").forEach(bindMagnetic);

  document.addEventListener("click", (e) => {
    const b = e.target.closest(".btn, .chip-btn");
    if (!b) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
    const span = document.createElement("span");
    span.className = "ripple";
    Object.assign(span.style, { width: s + "px", height: s + "px", left: e.clientX - r.left - s / 2 + "px", top: e.clientY - r.top - s / 2 + "px" });
    if (getComputedStyle(b).position === "static") b.style.position = "relative";
    b.style.overflow = "hidden";
    b.appendChild(span); setTimeout(() => span.remove(), 700);
  });

  /* ---------------- Tabs ---------------- */
  const state = { tab: "paste", fileRows: null, fileHeaders: null, manual: [], rating: 0, result: null, filter: "all", topic: "", query: "" };
  const indicator = $(".tab-indicator");
  const tabsEl = $(".tabs");
  function moveIndicator() {
    const t = $(".tab.active");
    if (!t.offsetWidth) return;
    indicator.style.width = t.offsetWidth + "px";
    indicator.style.height = t.offsetHeight + "px";
    indicator.style.transform = `translate3d(${t.offsetLeft}px, ${t.offsetTop}px, 0)`;
    // enable the slide only after the first placement so it never grows in from 0
    if (!tabsEl.classList.contains("ready")) requestAnimationFrame(() => tabsEl.classList.add("ready"));
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));
  function setTab(name) {
    if (state.tab === name) return;
    state.tab = name;
    $$(".tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === name));
    $$(".panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === name));
    moveIndicator();
  }
  addEventListener("resize", moveIndicator);
  addEventListener("load", moveIndicator);
  setTimeout(moveIndicator, 50);
  document.fonts?.ready.then(moveIndicator);

  /* ---------------- Paste ---------------- */
  const paste = $("#pasteInput");
  const lines = () => paste.value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  paste.addEventListener("input", () => ($("#lineCount").textContent = `${lines().length} responses`));

  $$("[data-sample]").forEach((b) => b.addEventListener("click", () => {
    paste.value = SAMPLES[b.dataset.sample].map((s) => s[1]).join("\n");
    state.sampleKey = b.dataset.sample;
    paste.dispatchEvent(new Event("input"));
    toast(`Loaded ${SAMPLES[b.dataset.sample].length} sample ${b.dataset.sample} responses`);
  }));
  $$("[data-load-sample]").forEach((b) => b.addEventListener("click", () => {
    setTab("paste");
    $('[data-sample="customers"]').click();
    $("#analyzer").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => $("#analyzeBtn").click(), 900);
  }));

  /* ---------------- Upload ---------------- */
  const dz = $("#dropzone"), fileInput = $("#fileInput");
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("over"); }));
  dz.addEventListener("drop", (e) => e.dataTransfer.files[0] && readFile(e.dataTransfer.files[0]));
  fileInput.addEventListener("change", () => fileInput.files[0] && readFile(fileInput.files[0]));

  function readFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = () => {
      try {
        let table;
        if (ext === "xlsx" || ext === "xls") {
          if (!window.XLSX) throw new Error("Excel parser failed to load — save the sheet as CSV instead.");
          const wb = XLSX.read(reader.result, { type: "array", cellDates: true });
          table = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: "" });
        } else if (ext === "txt") {
          table = [["feedback"], ...String(reader.result).split(/\r?\n/).filter((l) => l.trim()).map((l) => [l])];
        } else {
          table = parseCSV(String(reader.result), ext === "tsv" ? "\t" : null);
        }
        table = table.filter((r) => r.some((c) => String(c).trim()));
        if (table.length < 2) throw new Error("The file looks empty.");
        setupColumns(file.name, table);
      } catch (err) { toast("⚠️ " + err.message); }
    };
    ext === "xlsx" || ext === "xls" ? reader.readAsArrayBuffer(file) : reader.readAsText(file);
  }

  function parseCSV(text, delim) {
    text = text.replace(/^﻿/, "");
    if (!delim) {
      const first = text.split(/\r?\n/)[0];
      delim = [",", ";", "\t", "|"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    }
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function setupColumns(name, table) {
    const headers = table[0].map((h, i) => String(h || `Column ${i + 1}`).trim());
    const body = table.slice(1);
    state.fileHeaders = headers; state.fileRows = body;
    const avgLen = headers.map((_, i) => body.slice(0, 50).reduce((a, r) => a + String(r[i] || "").length, 0));
    const find = (re) => headers.findIndex((h) => re.test(h));
    let ti = find(/feedback|comment|review|text|response|message|opinion|remarks?|suggestion/i);
    if (ti < 0) ti = avgLen.indexOf(Math.max(...avgLen));
    let di = find(/date|time|created|submitted|timestamp/i);
    let si = find(/source|type|channel|category|role|group|department/i);
    const opts = headers.map((h, i) => `<option value="${i}">${esc(h)}</option>`).join("");
    $("#colText").innerHTML = opts; $("#colText").value = ti;
    $("#colDate").innerHTML = `<option value="">— none —</option>` + opts; $("#colDate").value = di >= 0 ? di : "";
    $("#colSource").innerHTML = `<option value="">— none —</option>` + opts; $("#colSource").value = si >= 0 && si !== ti ? si : "";
    $("#fileName").textContent = name;
    $("#fileRows").textContent = `${body.length} rows · ${headers.length} columns`;
    $("#fileMeta").classList.remove("hidden");
    toast(`📄 ${name} loaded — ${body.length} rows`);
  }

  /* ---------------- Manual entry ---------------- */
  $$("#mfStars button").forEach((b) => {
    b.addEventListener("click", () => {
      state.rating = state.rating === +b.dataset.v ? 0 : +b.dataset.v;
      $$("#mfStars button").forEach((x) => x.classList.toggle("on", +x.dataset.v <= state.rating));
    });
  });
  const mfText = $("#mfText"), live = $("#liveSent");
  mfText.addEventListener("input", () => {
    const t = mfText.value.trim();
    if (!t) { $(".ls-face").textContent = "😐"; $(".ls-meter i").style.left = "50%"; $(".ls-label").textContent = "Start typing to see live sentiment"; return; }
    const s = SentiqNLP.sentiment(t);
    const face = s.score > .5 ? "😍" : s.score > .12 ? "😊" : s.score > -.12 ? "😐" : s.score > -.5 ? "🙁" : "😡";
    if ($(".ls-face").textContent !== face) { live.classList.add("bump"); setTimeout(() => live.classList.remove("bump"), 300); }
    $(".ls-face").textContent = face;
    $(".ls-meter i").style.left = ((s.score + 1) / 2) * 100 + "%";
    $(".ls-label").textContent = `${s.label} (${s.score > 0 ? "+" : ""}${s.score.toFixed(2)})`;
  });
  $("#manualForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = mfText.value.trim();
    if (!text) return;
    state.manual.push({ text, source: $("#mfSource").value, rating: state.rating || null, date: new Date().toISOString() });
    mfText.value = ""; mfText.dispatchEvent(new Event("input"));
    state.rating = 0; $$("#mfStars button").forEach((x) => x.classList.remove("on"));
    renderManual();
  });
  function renderManual() {
    $("#manualList").innerHTML = state.manual.map((m, i) => {
      const s = SentiqNLP.sentiment(m.text);
      return `<li><span>${s.label === "positive" ? "😊" : s.label === "negative" ? "😞" : "😐"}</span><p>${esc(m.text)}</p><span class="chip c-violet">${esc(m.source)}</span>${m.rating ? `<span class="chip c-amber">${"★".repeat(m.rating)}</span>` : ""}<button type="button" data-del="${i}" aria-label="Remove">✕</button></li>`;
    }).reverse().join("");
    $("#manualCount").textContent = `${state.manual.length} response${state.manual.length === 1 ? "" : "s"} added`;
  }
  $("#manualList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]");
    if (b) { state.manual.splice(+b.dataset.del, 1); renderManual(); }
  });

  /* ---------------- YouTube comments ---------------- */
  const YT_KEY = (window.SENTIQ_CONFIG && window.SENTIQ_CONFIG.youtubeApiKey || "").trim();
  const YT_API = "https://www.googleapis.com/youtube/v3/";
  const ytUrl = $("#ytUrl"), ytMsg = $("#ytMsg"), ytPreview = $("#ytPreview");
  state.yt = { id: null, video: null };

  function parseYouTubeId(input) {
    const s = String(input || "").trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    try {
      const u = new URL(/^https?:\/\//i.test(s) ? s : "https://" + s);
      const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
      if (host === "youtu.be") return u.pathname.slice(1, 12) || null;
      if (host === "youtube.com" || host === "youtube-nocookie.com") {
        if (u.searchParams.get("v")) return u.searchParams.get("v").slice(0, 11);
        const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/);
        if (m) return m[1];
      }
    } catch {}
    return null;
  }
  const compact = (n) => Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(+n || 0);
  function ytMessage(text, kind = "error") {
    if (!text) { ytMsg.classList.add("hidden"); return; }
    ytMsg.textContent = text; ytMsg.className = "yt-msg" + (kind === "info" ? " info" : "");
  }

  async function ytFetch(endpoint, params) {
    const url = YT_API + endpoint + "?" + new URLSearchParams({ ...params, key: YT_KEY });
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = data.error || {};
      const reason = (err.errors && err.errors[0] && err.errors[0].reason) || (err.details && err.details[0] && err.details[0].reason) || "";
      const msgs = {
        commentsDisabled: "Comments are turned off for this video.",
        videoNotFound: "That video couldn't be found. It may be private or deleted.",
        quotaExceeded: "Today's YouTube API quota is used up. Try again tomorrow.",
        dailyLimitExceeded: "Today's YouTube API quota is used up. Try again tomorrow.",
        keyInvalid: "The YouTube API key in config.js isn't valid.",
        API_KEY_INVALID: "The YouTube API key in config.js isn't valid.",
        API_KEY_HTTP_REFERRER_BLOCKED: "The API key doesn't allow requests from this site. Add this domain to the key's HTTP referrer list.",
        accessNotConfigured: "YouTube Data API v3 isn't enabled for this API key's Google Cloud project.",
        SERVICE_DISABLED: "YouTube Data API v3 isn't enabled for this API key's Google Cloud project.",
      };
      throw new Error(msgs[reason] || err.message || `YouTube request failed (${res.status}).`);
    }
    return data;
  }

  let ytLookupToken = 0;
  async function updateYouTubePreview() {
    const id = parseYouTubeId(ytUrl.value);
    if (id === state.yt.id) return;
    state.yt = { id, video: null };
    ytMessage("");
    if (!id) {
      ytPreview.classList.add("hidden");
      if (ytUrl.value.trim()) ytMessage("That doesn't look like a YouTube video link.");
      return;
    }
    const token = ++ytLookupToken;
    $("#ytThumb").src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    $("#ytTitle").textContent = "Loading video…"; $("#ytChannel").textContent = ""; $("#ytStats").innerHTML = "";
    ytPreview.classList.remove("hidden"); ytPreview.classList.add("yt-loading");
    if (!YT_KEY) {
      ytPreview.classList.remove("yt-loading");
      $("#ytTitle").textContent = "Video found";
      ytMessage("Add your YouTube Data API key to config.js to fetch comments.", "info");
      return;
    }
    try {
      const data = await ytFetch("videos", { part: "snippet,statistics", id });
      if (token !== ytLookupToken) return;
      const v = data.items && data.items[0];
      if (!v) throw new Error("That video couldn't be found. It may be private or deleted.");
      state.yt.video = v;
      $("#ytTitle").textContent = v.snippet.title;
      $("#ytChannel").textContent = v.snippet.channelTitle;
      const st = v.statistics || {};
      $("#ytStats").innerHTML = [
        st.viewCount && `<span class="chip c-gray">👁 ${compact(st.viewCount)} views</span>`,
        st.likeCount && `<span class="chip c-green">👍 ${compact(st.likeCount)}</span>`,
        `<span class="chip ${st.commentCount ? "c-violet" : "c-red"}">💬 ${st.commentCount ? compact(st.commentCount) + " comments" : "comments off"}</span>`,
      ].filter(Boolean).join("");
    } catch (err) {
      if (token !== ytLookupToken) return;
      $("#ytTitle").textContent = "Couldn't load video details";
      ytMessage(err.message);
    } finally {
      if (token === ytLookupToken) ytPreview.classList.remove("yt-loading");
    }
  }
  let ytDebounce;
  ytUrl.addEventListener("input", () => { clearTimeout(ytDebounce); ytDebounce = setTimeout(updateYouTubePreview, 350); });
  ytUrl.addEventListener("paste", () => setTimeout(updateYouTubePreview, 0));
  ytUrl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("#analyzeBtn").click(); } });
  $("#ytPasteBtn").addEventListener("click", async () => {
    try { ytUrl.value = (await navigator.clipboard.readText()).trim(); updateYouTubePreview(); }
    catch { ytUrl.focus(); toast("Press ⌘V / Ctrl+V to paste the link"); }
  });

  async function fetchYouTubeComments(onProgress) {
    const id = parseYouTubeId(ytUrl.value);
    if (!id) throw new Error(ytUrl.value.trim() ? "That doesn't look like a YouTube video link." : "Paste a YouTube video link first.");
    if (!YT_KEY) throw new Error("Add your YouTube Data API key to config.js to fetch comments.");
    const limit = +$("#ytLimit").value, order = $("#ytOrder").value;
    const items = [];
    let pageToken = "";
    do {
      const data = await ytFetch("commentThreads", {
        part: "snippet", videoId: id, maxResults: "100", order, textFormat: "plainText", ...(pageToken && { pageToken }),
      });
      for (const t of data.items || []) {
        const c = t.snippet.topLevelComment.snippet;
        items.push({ text: c.textOriginal || c.textDisplay || "", date: c.publishedAt, source: c.authorDisplayName, likes: c.likeCount });
      }
      onProgress(items.length);
      pageToken = data.nextPageToken;
    } while (pageToken && items.length < limit);
    if (!items.length) throw new Error("This video has no public comments yet.");
    return items.slice(0, limit);
  }

  /* ---------------- Collect + analyze ---------------- */
  function collect() {
    if (state.tab === "paste") {
      const ls = lines();
      const sample = state.sampleKey && SAMPLES[state.sampleKey];
      // keep dates when the textarea still holds the untouched sample
      if (sample && ls.length === sample.length && ls.every((l, i) => l === sample[i][1])) return sample.map(([date, text, source]) => ({ date, text, source }));
      return ls.map((text) => ({ text }));
    }
    if (state.tab === "upload") {
      if (!state.fileRows) return [];
      const ti = +$("#colText").value, di = $("#colDate").value, si = $("#colSource").value;
      return state.fileRows.map((r) => ({ text: String(r[ti] || ""), date: di !== "" ? r[+di] : null, source: si !== "" ? r[+si] : null })).filter((r) => r.text.trim());
    }
    return state.manual.slice();
  }

  $("#clearBtn").addEventListener("click", () => {
    if (state.tab === "paste") { paste.value = ""; state.sampleKey = null; paste.dispatchEvent(new Event("input")); }
    if (state.tab === "upload") { state.fileRows = null; fileInput.value = ""; $("#fileMeta").classList.add("hidden"); }
    if (state.tab === "manual") { state.manual = []; renderManual(); }
    if (state.tab === "youtube") { ytUrl.value = ""; state.yt = { id: null, video: null }; ytPreview.classList.add("hidden"); ytMessage(""); }
  });

  let analyzing = false;
  $("#analyzeBtn").addEventListener("click", async () => {
    if (analyzing) return;
    const proc = $("#processing"), steps = $$(".proc-steps li");
    let items;
    state.label = null;
    if (state.tab === "youtube") {
      analyzing = true;
      const firstStep = steps[0].textContent;
      steps.forEach((s) => s.classList.remove("active", "done"));
      proc.classList.remove("hidden");
      steps[0].classList.add("active");
      $("#procBar").style.width = "4%";
      const limit = +$("#ytLimit").value;
      try {
        items = await fetchYouTubeComments((n) => {
          steps[0].textContent = `Fetching YouTube comments… ${n}`;
          $("#procBar").style.width = Math.min(18, 4 + (n / limit) * 14) + "%";
        });
        const title = state.yt.video && state.yt.video.snippet.title;
        state.label = `${items.length} YouTube comments analyzed` + (title ? ` · ${title}` : "");
        ytMessage("");
      } catch (err) {
        proc.classList.add("hidden");
        ytMessage(err.message);
        toast("⚠️ " + err.message);
        shake($(".analyzer"));
        return;
      } finally {
        steps[0].textContent = firstStep;
        analyzing = false;
      }
    } else {
      items = collect();
    }
    if (items.length < 1) { toast("Add some feedback first ✍️"); shake($(".analyzer")); return; }
    analyzing = true;
    proc.classList.remove("hidden");
    steps.forEach((s) => s.classList.remove("active", "done"));
    const result = SentiqNLP.analyze(items);
    const per = reduceMotion ? 50 : 520;
    for (let i = 0; i < steps.length; i++) {
      steps[i].classList.add("active");
      $("#procBar").style.width = ((i + 0.5) / steps.length) * 100 + "%";
      await sleep(per);
      steps[i].classList.replace("active", "done");
    }
    $("#procBar").style.width = "100%";
    await sleep(300);
    proc.classList.add("hidden");
    state.result = result;
    render(result);
    const res = $("#results");
    res.classList.remove("hidden", "show"); void res.offsetWidth; res.classList.add("show");
    setTimeout(() => res.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    if (result.counts.positive / result.total >= 0.5) confetti();
    analyzing = false;
  });

  /* ---------------- Render ---------------- */
  function render(r) {
    const pc = (n) => Math.round((n / r.total) * 100);
    $("#resultsTitle").textContent = state.label || `${r.total} responses analyzed`;
    animateNum($("#kTotal"), r.total);
    animateNum($("#kPos"), pc(r.counts.positive), "%");
    animateNum($("#kNeu"), pc(r.counts.neutral), "%");
    animateNum($("#kNeg"), pc(r.counts.negative), "%");
    animateNum($("#kScore"), r.satisfaction, "/100");
    $("#gaugeFill").style.width = "0"; requestAnimationFrame(() => setTimeout(() => ($("#gaugeFill").style.width = r.satisfaction + "%"), 50));

    // summary w/ typewriter
    $("#summaryMeta").textContent = `Generated ${new Date().toLocaleString()}`;
    typewrite($("#summaryText"), r.summary.text);
    $("#takeaways").innerHTML = r.summary.takeaways.map((t, i) => `<div class="takeaway" style="animation-delay:${0.4 + i * 0.12}s"><span>${t.icon}</span><p>${esc(t.text)}</p></div>`).join("");

    renderList($("#issuesList"), r.issues, "No recurring issues found — nice! 🎉");
    renderList($("#praiseList"), r.praise, "No strong praise patterns yet.");
    renderCloud(r.keywords);
    renderCharts(r);

    $("#topicFilter").innerHTML = `<option value="">All topics</option>` + r.topics.map((t) => `<option>${esc(t.topic)}</option>`).join("");
    state.filter = "all"; state.topic = ""; state.query = ""; $("#tableSearch").value = "";
    $$("#sentFilter button").forEach((b) => b.classList.toggle("active", b.dataset.f === "all"));
    renderTable();
    $("#trendHint").textContent = r.trend.mode === "order" ? "grouped by order received (add a date column for time trends)" : `average sentiment per ${r.trend.mode}`;
  }

  function renderList(el, items, empty) {
    if (!items.length) { el.innerHTML = `<li class="empty">${empty}</li>`; return; }
    const max = Math.max(...items.map((i) => i.count));
    el.innerHTML = items.map((it, i) => `<li style="animation-delay:${i * 0.08}s"><span class="bar" data-w="${(it.count / max) * 100}"></span>
      <div class="row"><b>${esc(it.label)}</b><span class="count">×${it.count}</span></div>
      ${it.examples[0] ? `<q>${esc(trunc(it.examples[0], 110))}</q>` : ""}</li>`).join("");
    setTimeout(() => $$(".bar", el).forEach((b) => (b.style.width = b.dataset.w + "%")), 200);
  }

  function renderCloud(kws) {
    const el = $("#wordcloud");
    if (!kws.length) { el.innerHTML = `<p class="empty">Not enough text for a keyword cloud.</p>`; return; }
    const max = kws[0].count, min = kws[kws.length - 1].count;
    const shuffled = kws.map((k, i) => ({ ...k, i })).sort(() => Math.random() - 0.5);
    el.innerHTML = shuffled.map((k) => {
      const size = 0.8 + ((k.count - min) / Math.max(1, max - min)) * 1.9;
      const color = k.avg > 0.15 ? "var(--green)" : k.avg < -0.15 ? "var(--red)" : k.avg > 0 ? "var(--sky)" : "var(--slate)";
      return `<span title="${k.count} mentions · avg ${k.avg.toFixed(2)}" style="font-size:${size}rem;color:${color};animation-delay:${k.i * 0.025}s;opacity:${0.65 + (size / 2.7) * 0.35}">${esc(k.word)}</span>`;
    }).join("");
  }

  /* ---------------- Charts ---------------- */
  const charts = {};
  function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
  function renderCharts(r) {
    if (!window.Chart) { toast("Charts failed to load (offline?)"); return; }
    const ink = css("--ink-2"), grid = css("--line");
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    Chart.defaults.color = ink;
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(18,20,43,.92)";
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    const G = css("--green"), N = css("--slate"), R = css("--red"), V = css("--violet");
    Object.values(charts).forEach((c) => c.destroy());

    charts.s = new Chart($("#chartSentiment"), {
      type: "doughnut",
      data: { labels: ["Positive", "Neutral", "Negative"], datasets: [{ data: [r.counts.positive, r.counts.neutral, r.counts.negative], backgroundColor: [G, N, R], borderWidth: 0, hoverOffset: 14, spacing: 3, borderRadius: 8 }] },
      options: { maintainAspectRatio: false, cutout: "68%", animation: { animateRotate: true, duration: 1600, easing: "easeOutQuart" },
        plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 18 } } } },
      plugins: [{ id: "center", afterDraw(c) {
        const { ctx, chartArea: a } = c; ctx.save();
        ctx.font = "800 28px 'Plus Jakarta Sans'"; ctx.fillStyle = css("--ink"); ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(r.satisfaction, (a.left + a.right) / 2, (a.top + a.bottom) / 2 - 8);
        ctx.font = "600 11px 'Plus Jakarta Sans'"; ctx.fillStyle = css("--muted");
        ctx.fillText("satisfaction", (a.left + a.right) / 2, (a.top + a.bottom) / 2 + 16); ctx.restore();
      } }],
    });

    const tps = r.topics.slice(0, 8);
    charts.t = new Chart($("#chartTopics"), {
      type: "bar",
      data: { labels: tps.map((t) => `${t.icon} ${t.topic}`), datasets: [
        { label: "Positive", data: tps.map((t) => t.positive), backgroundColor: G, borderRadius: 6 },
        { label: "Neutral", data: tps.map((t) => t.neutral), backgroundColor: N, borderRadius: 6 },
        { label: "Negative", data: tps.map((t) => t.negative), backgroundColor: R, borderRadius: 6 },
      ] },
      options: { indexAxis: "y", maintainAspectRatio: false, animation: { duration: 1400, easing: "easeOutQuart", delay: (c) => c.dataIndex * 80 },
        scales: { x: { stacked: true, grid: { color: grid }, ticks: { precision: 0 } }, y: { stacked: true, grid: { display: false } } },
        plugins: { legend: { position: "bottom", labels: { usePointStyle: true } } },
        onClick: (_, els) => { if (els[0]) { $("#topicFilter").value = tps[els[0].index].topic; state.topic = tps[els[0].index].topic; renderTable(); $(".fb-table").scrollIntoView({ behavior: "smooth", block: "center" }); } } },
    });

    const pts = r.trend.points, ctx = $("#chartTrend").getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, "rgba(124,92,255,.35)"); grad.addColorStop(1, "rgba(124,92,255,0)");
    charts.tr = new Chart(ctx, {
      data: { labels: pts.map((p) => p.label), datasets: [
        { type: "line", label: "Avg sentiment", data: pts.map((p) => +p.avg.toFixed(3)), borderColor: V, backgroundColor: grad, fill: true, tension: .4, pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: "#fff", pointBorderWidth: 2, yAxisID: "y", borderWidth: 3 },
        { type: "bar", label: "Positive", data: pts.map((p) => p.positive), backgroundColor: G + "55", borderRadius: 4, yAxisID: "y1", stack: "s" },
        { type: "bar", label: "Negative", data: pts.map((p) => p.negative), backgroundColor: R + "55", borderRadius: 4, yAxisID: "y1", stack: "s" },
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
        animations: { y: { duration: 1400, easing: "easeOutQuart", from: (c) => (c.type === "data" ? c.chart.scales.y?.getPixelForValue(0) : undefined) } },
        scales: { y: { min: -1, max: 1, grid: { color: grid }, title: { display: true, text: "sentiment" } }, y1: { position: "right", grid: { display: false }, ticks: { precision: 0 }, title: { display: true, text: "responses" } }, x: { grid: { display: false } } },
        plugins: { legend: { position: "bottom", labels: { usePointStyle: true } } } },
    });

    const emo = Object.entries(r.emotions).sort((a, b) => b[1] - a[1]);
    const emoIcon = { Joy: "😄", Trust: "🤝", Surprise: "😮", Anger: "😠", Sadness: "😢", Frustration: "😤", Fear: "😨" };
    charts.e = new Chart($("#chartEmotion"), {
      type: "polarArea",
      data: { labels: emo.length ? emo.map(([e]) => `${emoIcon[e]} ${e}`) : ["No strong emotions"], datasets: [{ data: emo.length ? emo.map(([, n]) => n) : [1],
        backgroundColor: ["#7c5cffaa", "#22a8eeaa", "#14c39aaa", "#f5a524aa", "#ff5c8aaa", "#f0466baa", "#8a8fb0aa"], borderWidth: 0 }] },
      options: { maintainAspectRatio: false, animation: { animateRotate: true, animateScale: true, duration: 1600 },
        scales: { r: { grid: { color: grid }, ticks: { display: false } } }, plugins: { legend: { position: "right", labels: { usePointStyle: true } } } },
    });
  }

  /* ---------------- Table ---------------- */
  const chipFor = (l) => (l === "positive" ? "c-green" : l === "negative" ? "c-red" : "c-gray");
  function renderTable() {
    const r = state.result; if (!r) return;
    const q = state.query.toLowerCase();
    const rows = r.rows.filter((x) => (state.filter === "all" || x.label === state.filter) && (!state.topic || x.topics.includes(state.topic)) && (!q || x.text.toLowerCase().includes(q)));
    const shown = rows.slice(0, 300);
    $("#tableBody").innerHTML = shown.map((x) => {
      let t = esc(x.text);
      if (q) t = t.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "<mark>$1</mark>");
      return `<tr><td class="muted">${x.id}</td><td>${t}${x.source ? `<div><span class="chip c-violet" style="margin-top:6px">${esc(x.source)}</span></div>` : ""}</td>
        <td><span class="chip ${chipFor(x.label)}">${x.label === "positive" ? "😊" : x.label === "negative" ? "😞" : "😐"} ${x.label}</span></td>
        <td class="score-pill" style="color:var(${x.score > 0.12 ? "--green" : x.score < -0.12 ? "--red" : "--slate"})">${x.score > 0 ? "+" : ""}${x.score.toFixed(2)}</td>
        <td>${x.topics.map((t) => `<span class="chip c-blue">${SentiqNLP.TOPIC_ICON[t] || ""} ${esc(t)}</span>`).join("")}</td></tr>`;
    }).join("") || `<tr><td colspan="5" class="empty">No responses match these filters.</td></tr>`;
    $("#tableFoot").textContent = `Showing ${shown.length} of ${rows.length} matching (${r.total} total)`;
  }
  $("#tableSearch").addEventListener("input", (e) => { state.query = e.target.value; renderTable(); });
  $("#topicFilter").addEventListener("change", (e) => { state.topic = e.target.value; renderTable(); });
  $("#sentFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    state.filter = b.dataset.f;
    $$("#sentFilter button").forEach((x) => x.classList.toggle("active", x === b));
    renderTable();
  });

  /* ---------------- Export ---------------- */
  $("#exportCsv").addEventListener("click", () => {
    const r = state.result; if (!r) return;
    const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const csv = ["id,feedback,sentiment,score,topics,date,source", ...r.rows.map((x) => [x.id, q(x.text), x.label, x.score, q(x.topics.join("; ")), q(x.date || ""), q(x.source || "")].join(","))].join("\n");
    download("sentiq-results.csv", csv, "text/csv");
  });
  $("#exportReport").addEventListener("click", () => {
    const r = state.result; if (!r) return;
    const pc = (n) => Math.round((n / r.total) * 100);
    const md = `# SentiQ Feedback Report\n\n_Generated ${new Date().toLocaleString()}_\n\n## Summary\n\n${r.summary.text}\n\n## Key numbers\n\n- Responses: ${r.total}\n- Positive: ${pc(r.counts.positive)}%\n- Neutral: ${pc(r.counts.neutral)}%\n- Negative: ${pc(r.counts.negative)}%\n- Satisfaction score: ${r.satisfaction}/100\n\n## Key takeaways\n\n${r.summary.takeaways.map((t) => `- ${t.icon} ${t.text}`).join("\n")}\n\n## Topics\n\n| Topic | Mentions | Positive | Negative | Avg score |\n|---|---|---|---|---|\n${r.topics.map((t) => `| ${t.topic} | ${t.total} | ${t.positive} | ${t.negative} | ${t.avg.toFixed(2)} |`).join("\n")}\n\n## Recurring issues\n\n${r.issues.map((i) => `- ${i.label} (×${i.count})`).join("\n") || "- None"}\n\n## What people love\n\n${r.praise.map((i) => `- ${i.label} (×${i.count})`).join("\n") || "- None"}\n\n## Top keywords\n\n${r.keywords.slice(0, 20).map((k) => k.word).join(", ")}\n`;
    download("sentiq-report.md", md, "text/markdown");
  });
  $("#printBtn").addEventListener("click", () => print());
  function download(name, content, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`⬇ ${name} downloaded`);
  }

  /* ---------------- Effects ---------------- */
  function animateNum(el, end, suf = "") {
    const t0 = performance.now(), dur = 1400;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4))) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  let typeToken = 0;
  async function typewrite(el, text) {
    const my = ++typeToken;
    el.textContent = ""; el.classList.add("typing");
    if (reduceMotion) { el.textContent = text; el.classList.remove("typing"); return; }
    for (let i = 0; i < text.length; i++) {
      if (my !== typeToken) return;
      el.textContent += text[i];
      await sleep(text[i] === "." ? 120 : 12);
    }
    el.classList.remove("typing");
  }
  function confetti() {
    if (reduceMotion) return;
    const colors = ["#7c5cff", "#22d3ee", "#14c39a", "#f5a524", "#ff5c8a"];
    for (let i = 0; i < 90; i++) {
      const c = document.createElement("i");
      c.className = "confetti";
      c.style.background = colors[i % colors.length];
      document.body.appendChild(c);
      const x0 = innerWidth / 2, y0 = innerHeight * 0.35, ang = Math.random() * Math.PI * 2, v = 200 + Math.random() * 380;
      c.animate([
        { transform: `translate(${x0}px, ${y0}px) rotate(0)`, opacity: 1 },
        { transform: `translate(${x0 + Math.cos(ang) * v}px, ${y0 + Math.sin(ang) * v + 420}px) rotate(${Math.random() * 900}deg)`, opacity: 0 },
      ], { duration: 1600 + Math.random() * 1000, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => c.remove();
    }
  }
  function shake(el) { el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(-6px)" }, { transform: "translateX(0)" }], { duration: 400 }); }
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function trunc(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  /* ---------------- Sample data: [date, text, source] ---------------- */
  const SAMPLES = {
    customers: [
      ["2026-05-03", "The app is fast and the design is beautiful, love it!", "App Store"],
      ["2026-05-05", "Customer support never replied to my email. Very disappointed.", "Email"],
      ["2026-05-08", "Pricing is too expensive for small teams.", "Survey"],
      ["2026-05-11", "Checkout keeps failing with a payment error, really frustrating.", "App Store"],
      ["2026-05-14", "Delivery was late by a week and the package arrived damaged.", "Survey"],
      ["2026-05-18", "The app keeps crashing when I upload photos.", "App Store"],
      ["2026-05-22", "Not bad, but the interface is a bit confusing at first.", "Survey"],
      ["2026-05-27", "Slow loading on the dashboard, takes forever to open reports.", "Support"],
      ["2026-06-02", "Support agent Maria was super friendly and resolved my issue quickly!", "Chat"],
      ["2026-06-04", "Checkout keeps failing on mobile, I gave up and used another store.", "App Store"],
      ["2026-06-07", "Great product quality, very durable material.", "Survey"],
      ["2026-06-10", "The subscription price went up again, not worth it anymore.", "Email"],
      ["2026-06-13", "Delivery was on time and packaging was nice.", "Survey"],
      ["2026-06-16", "I can't log in since the last update, getting an error every time.", "Support"],
      ["2026-06-20", "It's okay. Does what it says.", "Survey"],
      ["2026-06-24", "Dark mode is beautiful and the navigation is intuitive.", "App Store"],
      ["2026-07-01", "Customer support was helpful and polite, thank you!", "Chat"],
      ["2026-07-03", "The search feature is missing filters, please add them.", "Survey"],
      ["2026-07-06", "Fast delivery and great support, highly recommend 👍", "Survey"],
      ["2026-07-09", "Slow loading again today, the app is laggy on older phones.", "App Store"],
      ["2026-07-12", "Love the new export feature, saves me so much time!", "Email"],
      ["2026-07-15", "Refund took three weeks, unacceptable.", "Support"],
      ["2026-07-19", "The interface is clean and easy to use.", "App Store"],
      ["2026-07-23", "Pricing is fair for what you get.", "Survey"],
      ["2026-07-28", "Notifications are annoying and I can't turn them off.", "App Store"],
      ["2026-08-02", "Support team went above and beyond to help me 😍", "Chat"],
      ["2026-08-05", "Absolutely amazing experience, five stars!", "App Store"],
      ["2026-08-08", "Checkout is much smoother now, the bug was fixed.", "Survey"],
      ["2026-08-12", "Product arrived quickly and works perfectly.", "Survey"],
      ["2026-08-16", "The new dashboard design is gorgeous and reports load fast now.", "Email"],
      ["2026-08-20", "Still a bit expensive, but the quality is excellent.", "Survey"],
      ["2026-08-24", "Integration with Slack would be a great feature to add.", "Survey"],
      ["2026-08-28", "Best shopping app I've used, really impressed.", "App Store"],
      ["2026-09-02", "Delivery tracking is accurate and the courier was polite.", "Survey"],
      ["2026-09-06", "Customer support replied within minutes, great service!", "Chat"],
      ["2026-09-10", "The app is stable now, no more crashes. Well done!", "App Store"],
    ],
    students: [
      ["2026-01-15", "The professor explains concepts clearly and is very engaging.", "Student"],
      ["2026-01-18", "Too many assignments every week, the workload is overwhelming.", "Student"],
      ["2026-01-22", "Lecture slides are outdated and confusing.", "Student"],
      ["2026-01-29", "The labs were fun and really helped me learn.", "Student"],
      ["2026-02-03", "Wifi in the library is terrible, keeps disconnecting.", "Student"],
      ["2026-02-07", "Grading is unfair and feedback on exams is unclear.", "Student"],
      ["2026-02-12", "The teacher is patient and always willing to help after class.", "Student"],
      ["2026-02-18", "Deadlines are too close together, very stressful.", "Student"],
      ["2026-02-24", "Course content is interesting and relevant to industry.", "Student"],
      ["2026-03-02", "Classroom is too crowded and noisy.", "Student"],
      ["2026-03-06", "Tutorials are well organized and informative.", "Student"],
      ["2026-03-11", "The workload is too heavy, I barely have time to sleep.", "Student"],
      ["2026-03-17", "Lectures are boring, the instructor just reads the slides.", "Student"],
      ["2026-03-23", "Great course, I learned a lot! 🎉", "Student"],
      ["2026-03-29", "The cafeteria food is cold and expensive.", "Student"],
      ["2026-04-04", "Exams were fair and matched the syllabus.", "Student"],
      ["2026-04-09", "Assignment instructions are unclear and confusing.", "Student"],
      ["2026-04-14", "Professor is knowledgeable and inspiring.", "Student"],
      ["2026-04-20", "Library wifi is still slow, please fix it.", "Student"],
      ["2026-04-26", "The new lab equipment is excellent.", "Student"],
      ["2026-05-02", "Feedback on assignments is now much more helpful.", "Student"],
      ["2026-05-08", "The course was okay overall.", "Student"],
      ["2026-05-14", "Really enjoyed the group project, very engaging.", "Student"],
      ["2026-05-20", "Teaching quality improved a lot this semester, well done!", "Student"],
    ],
    employees: [
      ["2026-02-01", "My manager is supportive and gives great recognition.", "Engineering"],
      ["2026-02-05", "Too much micromanagement, I feel I'm not trusted.", "Sales"],
      ["2026-02-11", "Flexible remote work is the best benefit here.", "Engineering"],
      ["2026-02-17", "Workload is overwhelming and overtime is expected every week.", "Support"],
      ["2026-02-23", "Career growth opportunities are unclear.", "Marketing"],
      ["2026-03-01", "Colleagues are friendly and the culture is welcoming.", "Design"],
      ["2026-03-07", "Salary is below market, I feel underpaid.", "Support"],
      ["2026-03-13", "Communication from leadership is poor and inconsistent.", "Sales"],
      ["2026-03-19", "Onboarding was well organized and helpful.", "Engineering"],
      ["2026-03-25", "Office wifi is slow and the meeting rooms are always booked.", "Marketing"],
      ["2026-04-02", "I love my team, we support each other.", "Design"],
      ["2026-04-08", "Burnout is real, the deadlines are not realistic.", "Support"],
      ["2026-04-15", "Training budget is generous, I appreciate it.", "Engineering"],
      ["2026-04-22", "Management ignores feedback from the team.", "Sales"],
      ["2026-04-29", "Work-life balance has improved with flexible hours.", "Marketing"],
      ["2026-05-06", "Benefits are good but the promotion process is not fair.", "Support"],
      ["2026-05-13", "Leadership communication is much better after the town halls.", "Sales"],
      ["2026-05-20", "Proud to work here, great culture and respected by my manager.", "Engineering"],
      ["2026-05-27", "Overtime is still too frequent in support.", "Support"],
      ["2026-06-03", "New office is comfortable and modern.", "Design"],
    ],
  };
})();
