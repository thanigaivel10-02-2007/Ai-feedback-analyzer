/* SentiQ NLP engine — lexicon-based sentiment, topic detection,
   recurring-issue mining, emotions, keywords and summary generation.
   Runs entirely in the browser. */
(function (global) {
  "use strict";

  // ---------- Lexicons ----------
  const POS = {
    good: 2, great: 3, excellent: 4, amazing: 4, awesome: 4, fantastic: 4, wonderful: 4, love: 3, loved: 3, loving: 3, loves: 3,
    like: 1.5, liked: 1.5, likes: 1.5, nice: 2, happy: 3, glad: 2, pleased: 2.5, satisfied: 2.5, perfect: 4, best: 3.5, better: 2,
    helpful: 2.5, friendly: 2.5, fast: 2, quick: 2, quickly: 2, easy: 2, easily: 2, smooth: 2, clean: 1.5, clear: 1.5, beautiful: 3, intuitive: 2.5,
    reliable: 2.5, recommend: 2.5, recommended: 2.5, impressive: 3, impressed: 3, enjoy: 2.5, enjoyed: 2.5, enjoyable: 2.5, efficient: 2, convenient: 2,
    affordable: 2, worth: 2, valuable: 2.5, useful: 2, superb: 4, outstanding: 4, brilliant: 3.5, responsive: 2, professional: 2, polite: 2,
    knowledgeable: 2.5, engaging: 2.5, supportive: 2.5, thanks: 1.5, thank: 1.5, appreciate: 2.5, appreciated: 2.5, fun: 2, interesting: 2,
    excited: 3, exciting: 3, delighted: 3.5, seamless: 3, solid: 1.5, stable: 1.5, fair: 1, cool: 1.5, flexible: 2, inspiring: 3, motivated: 2.5,
    improved: 1.5, improvement: 1, works: 1, worked: 1, resolved: 2, fixed: 1.5, welcoming: 2.5, organized: 2, organised: 2, informative: 2.5,
    patient: 2, caring: 2.5, comfortable: 2, fresh: 1.5, tasty: 2.5, delicious: 3, accurate: 2, secure: 1.5, safe: 1.5, positive: 2, wow: 2.5,
    incredible: 4, lovely: 3, elegant: 2.5, modern: 1.5, powerful: 2, generous: 2.5, supported: 1.5, valued: 2.5, respected: 2.5, growth: 1,
  };
  const NEG = {
    bad: -2.5, terrible: -4, awful: -4, horrible: -4, worst: -4, poor: -2.5, hate: -3.5, hated: -3.5, dislike: -2, disliked: -2, slow: -2, slowly: -1.5,
    broken: -3, bug: -2, bugs: -2, buggy: -2.5, crash: -3, crashes: -3, crashed: -3, crashing: -3, error: -2, errors: -2, fail: -2.5, fails: -2.5,
    failed: -2.5, failing: -2.5, issue: -1.5, issues: -1.5, problem: -2, problems: -2, difficult: -2, hard: -1.2, confusing: -2.5, confused: -2,
    expensive: -2, overpriced: -3, pricey: -1.5, rude: -3, unhelpful: -3, useless: -3.5, annoying: -2.5, annoyed: -2.5, frustrating: -3, frustrated: -3,
    disappointed: -3, disappointing: -3, disappointment: -3, late: -2, delay: -2, delayed: -2, delays: -2, never: -1, waste: -3, wasted: -3,
    boring: -2.5, bored: -2, unclear: -2, messy: -2, cluttered: -2, laggy: -2.5, lag: -2, freeze: -2.5, freezes: -2.5, froze: -2.5, unreliable: -3,
    unresponsive: -3, complicated: -2, worse: -3, lacking: -2, lack: -1.5, missing: -1.5, outdated: -2, ugly: -2.5, unfair: -2.5, stressful: -2.5,
    stressed: -2.5, overwhelmed: -2.5, overworked: -3, underpaid: -3, toxic: -4, ignored: -2.5, ignore: -2, angry: -3, upset: -2.5, sad: -2,
    unhappy: -3, refund: -1, cancel: -1.5, cancelled: -1.5, canceled: -1.5, wrong: -2, damaged: -3, cold: -1, dirty: -3, noisy: -1.5, crowded: -1.5,
    rushed: -2, unprepared: -2.5, unorganized: -2.5, disorganized: -2.5, inconsistent: -2, scam: -4, fraud: -4, glitch: -2, glitches: -2, sucks: -3,
    meh: -1, mediocre: -1.5, lousy: -3, stuck: -2, impossible: -3, nothing: -0.5, unacceptable: -3.5, nightmare: -3.5, painful: -2.5, tedious: -2,
    burnout: -3, micromanagement: -2.5, micromanage: -2.5, unpaid: -2, leaking: -2.5, tired: -1.5, hidden: -1, spam: -2.5, slower: -2, harder: -1.5,
  };
  const EMOJI = { "😀": 2, "😃": 2, "😄": 2.5, "😁": 2.5, "😊": 2.5, "🙂": 1.5, "😍": 3.5, "🥰": 3.5, "❤️": 3, "❤": 3, "👍": 2, "🎉": 2.5, "🔥": 2, "⭐": 1.5, "💯": 2.5,
    "😐": 0, "😕": -1.5, "🙁": -2, "😞": -2.5, "😢": -2.5, "😭": -3, "😡": -3.5, "😠": -3, "👎": -2.5, "💩": -3, "🤬": -4 };
  const NEGATORS = new Set(["not", "no", "never", "dont", "don't", "doesnt", "doesn't", "didnt", "didn't", "isnt", "isn't", "wasnt", "wasn't", "arent", "aren't",
    "cant", "can't", "cannot", "couldnt", "couldn't", "wont", "won't", "wouldnt", "wouldn't", "hardly", "barely", "without", "neither", "nor", "lacks"]);
  const BOOST = { very: 1.5, really: 1.4, extremely: 1.8, super: 1.5, so: 1.3, too: 1.3, incredibly: 1.8, highly: 1.5, absolutely: 1.7, totally: 1.4,
    quite: 1.15, pretty: 1.1, most: 1.3, completely: 1.6, utterly: 1.7, truly: 1.4, insanely: 1.8, slightly: 0.6, somewhat: 0.7, bit: 0.7, little: 0.7, kinda: 0.7 };
  const PHRASES = [
    [/\bwaste of (time|money)\b/g, -3.5], [/\bnot worth\b/g, -3], [/\bwell done\b/g, 3], [/\bgo(es)? above and beyond\b/g, 4],
    [/\bcan'?t log ?in\b/g, -3], [/\bcould be better\b/g, -1.5], [/\bnot bad\b/g, 1.5], [/\bno complaints?\b/g, 2.5], [/\bkeeps? crashing\b/g, -3.5],
    [/\btakes? forever\b/g, -3], [/\bfive stars?\b|\b5 stars?\b/g, 3], [/\bone star\b|\b1 star\b/g, -3], [/\bhighly recommend\b/g, 2],
    [/\bnever (again|replied|responded|arrived|works?)\b/g, -2.5], [/\bon time\b/g, 1.5], [/\bwork-life balance\b/g, 0.3],
  ];
  const CONTRAST = new Set(["but", "however", "although", "though", "yet", "except"]);

  // ---------- Topics ----------
  const TOPICS = {
    "Pricing": ["price", "prices", "pricing", "cost", "costs", "expensive", "cheap", "affordable", "overpriced", "subscription", "fee", "fees", "pay", "paid", "money", "value", "worth", "plan", "plans", "billing", "charge", "charged", "refund", "discount", "salary", "pay"],
    "Customer Support": ["support", "service", "help", "helpdesk", "agent", "agents", "staff", "team", "reply", "replied", "respond", "response", "responded", "contact", "email", "chat", "call", "ticket", "rude", "polite", "friendly", "assist", "assistance"],
    "Performance": ["slow", "fast", "speed", "lag", "laggy", "loading", "load", "loads", "crash", "crashes", "crashing", "freeze", "freezes", "performance", "quick", "quickly", "responsive", "battery", "server", "downtime", "sluggish"],
    "Usability & UI": ["design", "interface", "ui", "ux", "layout", "navigation", "navigate", "intuitive", "confusing", "easy", "simple", "clean", "cluttered", "menu", "button", "buttons", "screen", "dashboard", "look", "looks", "beautiful", "ugly", "dark mode", "font"],
    "Bugs & Reliability": ["bug", "bugs", "buggy", "error", "errors", "glitch", "glitches", "broken", "fail", "fails", "failed", "failing", "crash", "crashes", "issue", "issues", "reliable", "unreliable", "stable", "login", "log in", "sync", "update"],
    "Features": ["feature", "features", "option", "options", "functionality", "integration", "integrations", "export", "import", "search", "filter", "notification", "notifications", "tool", "tools", "missing", "add", "request", "wish", "offline", "customization"],
    "Delivery & Shipping": ["delivery", "delivered", "shipping", "shipped", "package", "parcel", "order", "orders", "arrived", "arrive", "courier", "tracking", "late", "delay", "delayed", "damaged", "packaging"],
    "Product Quality": ["quality", "product", "material", "durable", "broke", "build", "cheap", "sturdy", "fresh", "taste", "tasty", "delicious", "size", "fit", "defective", "condition"],
    "Teaching & Content": ["teacher", "teachers", "professor", "lecturer", "instructor", "lecture", "lectures", "class", "classes", "course", "courses", "content", "material", "materials", "explain", "explains", "explained", "explanation", "assignment", "assignments", "exam", "exams", "homework", "syllabus", "lab", "labs", "tutorial", "slides", "curriculum", "learning", "learn", "grading", "notes"],
    "Workload & Schedule": ["workload", "schedule", "deadline", "deadlines", "hours", "overtime", "time", "timing", "busy", "pace", "rushed", "overwhelmed", "overworked", "balance", "shifts", "shift", "remote", "flexible", "flexibility"],
    "Management & Culture": ["manager", "managers", "management", "leadership", "boss", "culture", "colleagues", "coworkers", "team", "communication", "toxic", "respect", "recognition", "valued", "career", "growth", "promotion", "training", "onboarding", "micromanagement", "micromanage", "benefits", "office", "environment"],
    "Facilities": ["facility", "facilities", "campus", "classroom", "library", "wifi", "wi-fi", "parking", "cafeteria", "canteen", "food", "room", "rooms", "building", "equipment", "clean", "dirty", "noisy", "seating", "store", "location"],
  };
  const TOPIC_ICON = { "Pricing": "💰", "Customer Support": "🎧", "Performance": "⚡", "Usability & UI": "🎨", "Bugs & Reliability": "🐞", "Features": "🧩",
    "Delivery & Shipping": "📦", "Product Quality": "🏷️", "Teaching & Content": "📚", "Workload & Schedule": "⏱️", "Management & Culture": "🏢", "Facilities": "🏫", "General": "💬" };

  // ---------- Emotions ----------
  const EMOTIONS = {
    Joy: ["love", "happy", "great", "amazing", "awesome", "enjoy", "enjoyed", "fun", "delighted", "glad", "excited", "wonderful", "fantastic", "pleased", "😍", "😊", "🎉", "❤️"],
    Trust: ["reliable", "trust", "recommend", "safe", "secure", "professional", "helpful", "supportive", "knowledgeable", "consistent", "valued", "respected"],
    Surprise: ["surprised", "unexpected", "wow", "suddenly", "shocked", "impressed", "impressive", "incredible"],
    Anger: ["angry", "hate", "rude", "furious", "terrible", "awful", "worst", "scam", "unacceptable", "ridiculous", "toxic", "😡", "🤬"],
    Sadness: ["sad", "disappointed", "disappointing", "unhappy", "miss", "sorry", "lonely", "upset", "😢", "😞", "😭"],
    Frustration: ["frustrating", "frustrated", "annoying", "annoyed", "confusing", "slow", "stuck", "again", "still", "crash", "crashes", "keeps", "broken", "waste", "forever"],
    Fear: ["worried", "worry", "afraid", "scared", "concerned", "anxious", "risk", "unsafe", "stress", "stressful", "overwhelmed"],
  };

  const STOP = new Set(("a an the and or but if then so to of in on at by for with from up down out over under again further once here there when where why how all any both each few more most other some such " +
    "no nor not only own same than too very s t can will just don should now i me my myself we our ours you your yours he him his she her it its they them their what which who whom this that these those " +
    "am is are was were be been being have has had having do does did doing would could ought im ive id youre theyre its isnt arent wasnt werent dont doesnt didnt wont cant couldnt shouldnt " +
    "also get got really much many lot lots one two even still always every thing things way make made use used using us app it's i'm i've don't can't didn't doesn't isn't wasn't won't " +
    "about into through during before after above below between because while until like would been well quite bit little pretty though although however yet ever since").split(" "));

  // ---------- Helpers ----------
  const clean = (t) => String(t || "").replace(/\s+/g, " ").trim();
  function tokenize(text) {
    return text.toLowerCase().replace(/[’`]/g, "'").match(/[a-z][a-z'\-]*|[\u{1F300}-\u{1FAFF}☀-➿]️?|\d+/gu) || [];
  }
  const sentences = (t) => t.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

  // ---------- Sentiment ----------
  function sentiment(text) {
    const lower = text.toLowerCase().replace(/[’`]/g, "'");
    let score = 0, hits = 0;
    const posWords = [], negWords = [];

    for (const [re, v] of PHRASES) {
      const m = lower.match(re);
      if (m) { score += v * m.length; hits += m.length; (v > 0 ? posWords : negWords).push(m[0]); }
    }
    // Clause-level weighting: words after a contrast word count more.
    const tokens = tokenize(lower);
    let weight = 1;
    for (let i = 0; i < tokens.length; i++) {
      const w = tokens[i];
      if (CONTRAST.has(w)) { score *= 0.6; weight = 1.4; continue; }
      let v = POS[w] ?? NEG[w] ?? EMOJI[w] ?? EMOJI[w.replace(/️/, "")];
      if (v === undefined) continue;
      // skip words already counted by a phrase, e.g. "not bad"
      if (w === "bad" && tokens[i - 1] === "not") continue;
      if (w === "worth" && tokens[i - 1] === "not") continue;
      // intensifiers / negators in a 3-word window
      let mult = 1, negated = false;
      for (let j = Math.max(0, i - 3); j < i; j++) {
        const p = tokens[j];
        if (BOOST[p]) mult *= BOOST[p];
        if (NEGATORS.has(p) || p.endsWith("n't")) negated = !negated;
      }
      if (negated) v = v > 0 ? -v * 0.8 : -v * 0.5;
      v *= mult * weight;
      score += v; hits++;
      (v > 0 ? posWords : negWords).push(w);
    }
    const excl = (text.match(/!/g) || []).length;
    if (excl && score !== 0) score *= 1 + Math.min(excl, 3) * 0.08;
    if (/[A-Z]{4,}/.test(text) && score !== 0) score *= 1.15;

    // Normalise to -1..1 (VADER-style)
    const norm = score / Math.sqrt(score * score + 12);
    const label = norm >= 0.12 ? "positive" : norm <= -0.12 ? "negative" : "neutral";
    return { score: +norm.toFixed(3), label, hits, posWords, negWords };
  }

  // ---------- Topics ----------
  function topicsOf(text) {
    const lower = " " + text.toLowerCase().replace(/[^a-z0-9\s\-']/g, " ") + " ";
    const found = [];
    for (const [topic, words] of Object.entries(TOPICS)) {
      let n = 0;
      for (const w of words) if (lower.includes(" " + w + " ")) n++;
      if (n) found.push([topic, n]);
    }
    found.sort((a, b) => b[1] - a[1]);
    return found.length ? found.slice(0, 3).map((f) => f[0]) : ["General"];
  }

  function emotionsOf(tokens) {
    const out = {};
    for (const [emo, words] of Object.entries(EMOTIONS)) {
      let n = 0;
      for (const w of words) if (tokens.includes(w)) n++;
      if (n) out[emo] = n;
    }
    return out;
  }

  // ---------- Keyword extraction ----------
  function ngrams(tokens, n) {
    const words = tokens.filter((t) => /^[a-z]/.test(t));
    const out = [];
    for (let i = 0; i <= words.length - n; i++) {
      const g = words.slice(i, i + n);
      if (g.some((w) => STOP.has(w) || w.length < 3)) continue;
      out.push(g.join(" "));
    }
    return out;
  }

  // ---------- Main ----------
  function analyze(items) {
    const rows = items.map((it, idx) => {
      const text = clean(it.text);
      const tokens = tokenize(text);
      const s = sentiment(text);
      return {
        id: idx + 1, text, date: it.date || null, source: it.source || null, rating: it.rating || null,
        tokens, ...s, topics: topicsOf(text), emotions: emotionsOf(tokens),
      };
    }).filter((r) => r.text.length > 1);

    const total = rows.length;
    const counts = { positive: 0, neutral: 0, negative: 0 };
    rows.forEach((r) => counts[r.label]++);
    const avg = total ? rows.reduce((a, r) => a + r.score, 0) / total : 0;
    // 0–100 satisfaction score
    const satisfaction = Math.round(((avg + 1) / 2) * 100);

    // Topic stats
    const topicMap = {};
    rows.forEach((r) => r.topics.forEach((t) => {
      topicMap[t] ??= { topic: t, icon: TOPIC_ICON[t] || "💬", total: 0, positive: 0, neutral: 0, negative: 0, scoreSum: 0, rows: [] };
      const m = topicMap[t]; m.total++; m[r.label]++; m.scoreSum += r.score; m.rows.push(r);
    }));
    const topics = Object.values(topicMap).map((t) => ({ ...t, avg: t.scoreSum / t.total })).sort((a, b) => b.total - a.total);

    // Keywords with sentiment colouring
    const kw = {};
    rows.forEach((r) => {
      const seen = new Set();
      r.tokens.forEach((t) => {
        if (!/^[a-z]/.test(t) || t.length < 3 || STOP.has(t) || seen.has(t)) return;
        seen.add(t);
        kw[t] ??= { word: t, count: 0, scoreSum: 0 };
        kw[t].count++; kw[t].scoreSum += r.score;
      });
    });
    const keywords = Object.values(kw).filter((k) => k.count > (total > 30 ? 1 : 0))
      .map((k) => ({ ...k, avg: k.scoreSum / k.count })).sort((a, b) => b.count - a.count).slice(0, 45);

    // Recurring issues: frequent phrases in negative feedback, plus negative topic clusters
    const issues = minePhrases(rows.filter((r) => r.label === "negative"), topics, "negative");
    const praise = minePhrases(rows.filter((r) => r.label === "positive"), topics, "positive");

    // Emotions
    const emotions = {};
    rows.forEach((r) => Object.entries(r.emotions).forEach(([e, n]) => (emotions[e] = (emotions[e] || 0) + n)));

    // Trend
    const trend = buildTrend(rows);

    const result = { rows, total, counts, avg, satisfaction, topics, keywords, issues, praise, emotions, trend };
    result.summary = summarize(result);
    return result;
  }

  function minePhrases(subset, topics, polarity) {
    if (!subset.length) return [];
    const freq = {};
    subset.forEach((r) => {
      const seen = new Set();
      [...ngrams(r.tokens, 2), ...ngrams(r.tokens, 3)].forEach((g) => {
        if (seen.has(g)) return; seen.add(g);
        freq[g] ??= { label: g, count: 0, examples: [] };
        freq[g].count++; if (freq[g].examples.length < 2) freq[g].examples.push(r.text);
      });
    });
    let phrases = Object.values(freq).filter((p) => p.count >= 2).sort((a, b) => b.count - a.count || b.label.length - a.label.length);
    // drop bigrams contained in an equally-frequent trigram
    phrases = phrases.filter((p, _, arr) => !arr.some((q) => q !== p && q.label.includes(p.label) && q.count >= p.count));

    // topic clusters as fallback / complement
    const key = polarity;
    const clusters = topics.filter((t) => t.topic !== "General" && t[key] >= 1)
      .sort((a, b) => b[key] - a[key])
      .map((t) => {
        const ex = t.rows.filter((r) => r.label === key).sort((a, b) => (key === "negative" ? a.score - b.score : b.score - a.score));
        const words = {};
        ex.forEach((r) => (key === "negative" ? r.negWords : r.posWords).forEach((w) => (words[w] = (words[w] || 0) + 1)));
        const top = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 2).map((w) => w[0]);
        return { label: `${t.icon} ${t.topic}${top.length ? " — " + top.join(", ") : ""}`, count: t[key], examples: ex.slice(0, 1).map((r) => r.text), topic: true };
      });

    const merged = [...clusters.slice(0, 4), ...phrases.slice(0, 4).map((p) => ({ ...p, label: `“${p.label}”` }))];
    return merged.sort((a, b) => b.count - a.count).slice(0, 6);
  }

  function buildTrend(rows) {
    const dated = rows.filter((r) => r.date && !isNaN(new Date(r.date)));
    if (dated.length >= Math.max(3, rows.length * 0.5)) {
      const buckets = {};
      const span = Math.max(...dated.map((r) => +new Date(r.date))) - Math.min(...dated.map((r) => +new Date(r.date)));
      const byMonth = span > 1000 * 60 * 60 * 24 * 75;
      dated.forEach((r) => {
        const d = new Date(r.date);
        const k = byMonth ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : d.toISOString().slice(0, 10);
        buckets[k] ??= { label: k, n: 0, sum: 0, positive: 0, neutral: 0, negative: 0 };
        const b = buckets[k]; b.n++; b.sum += r.score; b[r.label]++;
      });
      const pts = Object.values(buckets).sort((a, b) => a.label.localeCompare(b.label)).map((b) => ({ ...b, avg: b.sum / b.n }));
      return { mode: byMonth ? "month" : "day", points: pts };
    }
    // Rolling buckets by order received
    const size = Math.max(1, Math.ceil(rows.length / Math.min(12, rows.length)));
    const pts = [];
    for (let i = 0; i < rows.length; i += size) {
      const chunk = rows.slice(i, i + size);
      const b = { label: `#${i + 1}–${i + chunk.length}`, n: chunk.length, sum: 0, positive: 0, neutral: 0, negative: 0 };
      chunk.forEach((r) => { b.sum += r.score; b[r.label]++; });
      pts.push({ ...b, avg: b.sum / b.n });
    }
    return { mode: "order", points: pts };
  }

  function pct(n, t) { return t ? Math.round((n / t) * 100) : 0; }

  function summarize(r) {
    const { total, counts, topics, issues, praise, trend, emotions } = r;
    if (!total) return { text: "No feedback to analyze yet.", takeaways: [] };
    const p = pct(counts.positive, total), n = pct(counts.negative, total), u = pct(counts.neutral, total);
    const diff = p - n;
    const mood = diff >= 45 ? "strongly positive" : diff >= 20 ? "mostly positive" : diff >= 8 ? "mixed, leaning positive"
      : diff > -8 ? "mixed" : diff > -20 ? "mixed, leaning negative" : diff > -45 ? "mostly negative" : "strongly negative";
    const real = topics.filter((t) => t.topic !== "General");
    const top = real[0];
    const worst = [...real].filter((t) => t.total >= 2).sort((a, b) => a.avg - b.avg)[0];
    const best = [...real].filter((t) => t.total >= 2).sort((a, b) => b.avg - a.avg)[0];
    const topEmo = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];

    let text = `Across ${total} response${total > 1 ? "s" : ""}, overall sentiment is ${mood} (${p}% positive, ${u}% neutral, ${n}% negative). `;
    if (top) text += `The most discussed theme is ${top.topic.toLowerCase()} (${pct(top.total, total)}% of responses). `;
    const parts = [];
    if (best && best.avg > 0.1) parts.push(`people are happiest with ${best.topic.toLowerCase()}`);
    if (worst && worst.avg < -0.05 && worst !== best) parts.push(`the biggest pain point is ${worst.topic.toLowerCase()}`);
    if (parts.length) { const s = parts.join(", while "); text += s[0].toUpperCase() + s.slice(1) + ". "; }
    if (trend.points.length >= 3) {
      const first = trend.points.slice(0, Math.ceil(trend.points.length / 3));
      const last = trend.points.slice(-Math.ceil(trend.points.length / 3));
      const a = first.reduce((s, x) => s + x.avg, 0) / first.length, b = last.reduce((s, x) => s + x.avg, 0) / last.length;
      const d = b - a;
      if (Math.abs(d) > 0.08) text += `Sentiment is trending ${d > 0 ? "upward 📈" : "downward 📉"} over ${trend.mode === "order" ? "the batch" : "time"}. `;
      else text += `Sentiment has stayed fairly stable over ${trend.mode === "order" ? "the batch" : "time"}. `;
    }
    if (topEmo) text += `The dominant emotion is ${topEmo[0].toLowerCase()}.`;

    const takeaways = [];
    if (issues[0]) takeaways.push({ icon: "🚨", text: `Fix first: ${stripIcon(issues[0].label)} (${issues[0].count} mention${issues[0].count > 1 ? "s" : ""}).` });
    if (praise[0]) takeaways.push({ icon: "💚", text: `Keep doing: ${stripIcon(praise[0].label)} (${praise[0].count} mention${praise[0].count > 1 ? "s" : ""}).` });
    if (worst && worst.avg < 0) takeaways.push({ icon: "🎯", text: `${worst.topic} has the lowest score (${worst.avg.toFixed(2)}) — prioritise improvements here.` });
    if (n >= 30) takeaways.push({ icon: "⚠️", text: `${n}% negative feedback is high — consider following up with unhappy respondents.` });
    else if (p >= 60) takeaways.push({ icon: "🌟", text: `${p}% positive — great moment to ask happy users for reviews or testimonials.` });
    if (u >= 35) takeaways.push({ icon: "🤔", text: `${u}% neutral responses — ask more specific questions to get clearer signals.` });
    return { text, takeaways: takeaways.slice(0, 4) };
  }
  const stripIcon = (s) => s.replace(/^[^\w“"]+\s*/u, "");

  global.SentiqNLP = { analyze, sentiment, topicsOf, TOPIC_ICON };
})(window);
