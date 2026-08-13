/* ================= 给自怡宝贝的小花园 ================= */
(function () {
  "use strict";

  /* ---------- 工具 ---------- */
  const $ = (s) => document.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- 声音（WebAudio，iOS 需要手势后解锁） ---------- */
  let actx = null;
  let master = null;

  function unlockAudio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = 0.55;
      master.connect(actx.destination);
    }
    if (actx.state === "suspended") actx.resume();
  }
  document.addEventListener("pointerdown", unlockAudio, { once: false, passive: true });

  function playNote(freq, when = 0, dur = 0.85, vol = 0.5) {
    if (!actx) return;
    const t = actx.currentTime + when;
    const osc = actx.createOscillator();
    const osc2 = actx.createOscillator();
    const g = actx.createGain();
    const g2 = actx.createGain();
    osc.type = "sine";
    osc2.type = "triangle";
    osc.frequency.value = freq;
    osc2.frequency.value = freq * 2.01;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(vol * 0.18, t + 0.015);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.8);
    osc.connect(g).connect(master);
    osc2.connect(g2).connect(master);
    osc.start(t); osc.stop(t + dur + 0.05);
    osc2.start(t); osc2.stop(t + dur + 0.05);
  }

  /* 五声音阶：怎么弹都好听 */
  const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
  const JP = ["哆", "来", "咪", "嗦", "啦", "哆", "来", "咪"];

  /* ---------- 飘落的花瓣 ---------- */
  const petalsEl = $("#petals");
  let petalCount = 0;
  function spawnPetal() {
    if (petalCount >= 18) return;
    const p = document.createElement("span");
    p.className = "petal";
    const size = rand(9, 22);
    p.style.width = size + "px";
    p.style.height = (size * 1.15) + "px";
    p.style.left = rand(0, 100) + "vw";
    p.style.animationDuration = rand(8, 16) + "s";
    p.style.animationDelay = rand(-8, 0) + "s";
    petalsEl.appendChild(p);
    petalCount++;
    p.addEventListener("animationend", () => { p.remove(); petalCount--; });
  }
  for (let i = 0; i < 10; i++) spawnPetal();
  setInterval(spawnPetal, 900);

  /* ---------- 爱心冒泡 ---------- */
  const heroHeart = $("#heroHeart");
  heroHeart.addEventListener("pointerdown", () => {
    for (let i = 0; i < 6; i++) {
      const h = document.createElement("span");
      h.textContent = pick(["💗", "💖", "🌸", "✨"]);
      h.style.cssText = `position:fixed;left:${rand(30,70)}vw;top:${rand(20,45)}vh;font-size:${rand(18,34)}px;pointer-events:none;z-index:9;opacity:0;transition:all 1.2s ease-out;transform:translateY(0) scale(.6);`;
      document.body.appendChild(h);
      requestAnimationFrame(() => {
        h.style.opacity = "1";
        h.style.transform = `translateY(${-rand(60, 140)}px) translateX(${rand(-40, 40)}px) scale(1.15)`;
      });
      setTimeout(() => h.remove(), 1250);
    }
  });

  /* ---------- 🎹 小钢琴 ---------- */
  const piano = $("#pianoKeys");
  PENTA.forEach((freq, i) => {
    const k = document.createElement("div");
    k.className = "key";
    k.innerHTML = `<span class="key-note">${JP[i]}</span><span class="key-jp">${i < 5 ? "do re mi sol la".split(" ")[i] : "do re mi".split(" ")[i - 5] + "′"}</span>`;
    k.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      k.classList.add("pressed");
      playNote(freq, 0, 0.9, 0.5);
      const r = k.getBoundingClientRect();
      const n = document.createElement("span");
      n.className = "note-float";
      n.textContent = pick(["🎵", "🌸", "💗", "🎶"]);
      n.style.left = r.left + r.width / 2 + "px";
      n.style.top = r.top + "px";
      n.style.position = "fixed";
      document.body.appendChild(n);
      setTimeout(() => n.remove(), 950);
      setTimeout(() => k.classList.remove("pressed"), 120);
    });
    piano.appendChild(k);
  });

  $("#playMelody").addEventListener("pointerdown", () => {
    const seq = Array.from({ length: 8 }, () => pick(PENTA));
    seq.forEach((f, i) => playNote(f, i * 0.19, 0.7, 0.45));
    const hint = $("#pianoHint");
    hint.textContent = "这首小曲送给你，要一直开心呀 🥰";
    setTimeout(() => { hint.textContent = "这架小钢琴只会弹出好听的音——因为它是五声音阶，怎么按都对 🥰"; }, 4000);
  });

  /* ---------- 🍜 小厨房 ---------- */
  const bowlWrap = $("#bowlWrap");
  let noodleCount = 0;
  const noodleNum = $("#noodleCount");

  function playSlurp() {
    if (!actx) return;
    const t = actx.currentTime;
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.linearRampToValueAtTime(520, t + 0.09);
    osc.frequency.linearRampToValueAtTime(240, t + 0.22);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    osc.connect(g).connect(master);
    osc.start(t); osc.stop(t + 0.3);
  }

  bowlWrap.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    bowlWrap.classList.remove("wiggle");
    void bowlWrap.offsetWidth; /* 重启动画 */
    bowlWrap.classList.add("wiggle");
    playSlurp();
    noodleCount++;
    noodleNum.textContent = noodleCount;
    if (noodleCount % 5 === 0) {
      setTimeout(() => {
        const t = document.createElement("div");
        t.textContent = "好吃到转圈圈！🍥";
        t.style.cssText = "font-size:14px;color:#C4557F;margin-top:8px;animation:fadeUp .5s ease both;";
        bowlWrap.parentElement.querySelector(".noodle-count").after(t);
        setTimeout(() => t.remove(), 2200);
      }, 200);
    }
  });
  bowlWrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bowlWrap.dispatchEvent(new PointerEvent("pointerdown")); }
  });

  /* ---------- 📸 4s 小相机 ---------- */
  const CAPTIONS = ["今日份可爱", "自怡の微笑", "咔嚓！心动", "面条满分", "钢琴小能手", "球场上的自怡", "唱歌超好听", "可爱暴击", "4s 小剧场", "比花还好看"];
  const PH_BG = ["linear-gradient(135deg,#FFD9E4,#FFE9F0)", "linear-gradient(135deg,#E7DCF6,#F6EDFD)", "linear-gradient(135deg,#DDF3E9,#EAF7EF)", "linear-gradient(135deg,#FFF0D6,#FFE9E0)", "linear-gradient(135deg,#FFE9F0,#E7DCF6)"];
  const STICKERS = ["🌸", "🎀", "⭐", "🎵", "💗", "🌷", "🍓", "🩰"];
  let photoCount = 0;
  const shutter = $("#shutter");
  const flashEl = $("#flash");
  const strip = $("#strip");

  shutter.addEventListener("pointerdown", () => {
    unlockAudio();
    flashEl.classList.remove("on");
    void flashEl.offsetWidth;
    flashEl.classList.add("on");
    playNote(880, 0, 0.3, 0.25);
    playNote(1174.66, 0.08, 0.4, 0.2);

    const po = document.createElement("div");
    po.className = "polaroid";
    const rot = rand(-7, 7).toFixed(1);
    po.style.setProperty("--rot", rot + "deg");
    po.innerHTML = `<div class="ph" style="background:${pick(PH_BG)}">${pick(STICKERS)}</div><div class="pc">${pick(CAPTIONS)}</div>`;
    strip.prepend(po);
    while (strip.children.length > 6) strip.lastElementChild.remove();

    photoCount++;
    $("#photoCount").textContent = photoCount;
    setTimeout(() => flashEl.classList.remove("on"), 500);
  });

  /* ---------- 🎤 小舞台 ---------- */
  const singBtn = $("#singBtn");
  const stage = $("#stage");
  let singing = false;
  let singTimer = null;
  const LULLABY = [
    [523.25, .5], [587.33, .5], [659.25, .5], [783.99, .5], [659.25, .5], [587.33, .5], [523.25, .75], [440.0, .25],
    [523.25, .5], [587.33, .5], [659.25, .5], [783.99, .5], [659.25, .5], [587.33, .5], [523.25, .75], [392.0, .25],
    [440.0, .5], [523.25, .5], [587.33, .5], [659.25, .5], [587.33, .5], [523.25, .5], [440.0, .75], [392.0, .25],
    [329.63, .5], [392.0, .5], [440.0, .5], [523.25, .5], [440.0, .5], [392.0, .5], [329.63, .75], [261.63, .25],
  ];

  function spawnBubble() {
    const b = document.createElement("span");
    b.className = "note-bubble";
    b.textContent = pick(["🎵", "🎶", "✨", "💗", "⭐"]);
    b.style.left = rand(10, 85) + "%";
    b.style.fontSize = rand(18, 30) + "px";
    stage.appendChild(b);
    setTimeout(() => b.remove(), 1700);
  }

  singBtn.addEventListener("pointerdown", () => {
    if (singing) { stopSinging(); return; }
    singing = true;
    singBtn.textContent = "⏹ 先休息一下";
    unlockAudio();
    let t = 0;
    LULLABY.forEach(([f, d]) => { playNote(f, t, d * 0.9, 0.4); t += d * 0.42; });
    spawnBubble();
    singTimer = setInterval(spawnBubble, 260);
    setTimeout(stopSinging, t * 1000 + 400);
  });

  function stopSinging() {
    singing = false;
    singBtn.textContent = "🎶 点我一起唱";
    clearInterval(singTimer);
  }

  /* ---------- 🎾 陪自怡打球 ---------- */
  const court = $("#court");
  const ball = $("#ball");
  const rallyEl = $("#rally");
  const bestEl = $("#best");
  const BALL = 46;
  let bx = 120, by = 20, vx = 0, vy = 2.2;
  let rally = 0;
  let best = parseInt(localStorage.getItem("petalBest") || "0", 10);
  bestEl.textContent = best;
  let over = false;

  function resetBall(keepRally = false) {
    over = false;
    ball.classList.remove("over");
    rally = keepRally ? rally : 0;
    rallyEl.textContent = rally;
    bx = rand(20, court.clientWidth - BALL - 20);
    by = 10;
    vx = rand(-1.5, 1.5);
    vy = rand(2, 3);
    ball.style.left = bx + "px";
    ball.style.top = by + "px";
  }

  court.addEventListener("pointerdown", (e) => {
    const r = court.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    if (over) { resetBall(); return; }
    const dx = px - (bx + BALL / 2);
    const dy = py - (by + BALL / 2);
    if (Math.hypot(dx, dy) <= BALL * 0.95) {
      vy = -rand(9.5, 13);
      vx = rand(-5, 5) + (dx > 0 ? 1.2 : -1.2);
      rally++;
      rallyEl.textContent = rally;
      playNote(523.25 + rally * 8, 0, 0.18, 0.28);
      ball.classList.remove("hit");
      void ball.offsetWidth;
      ball.classList.add("hit");
    }
  });

  function gameOver() {
    if (over) return;
    over = true;
    ball.classList.add("over");
    if (rally > best) {
      best = rally;
      localStorage.setItem("petalBest", String(best));
      bestEl.textContent = best;
    }
    setTimeout(() => resetBall(), 1100);
  }

  (function loop() {
    const h = court.clientHeight;
    if (!over) {
      by += vy;
      vx *= 0.995;
      bx += vx;
      if (bx < 0) { bx = 0; vx = Math.abs(vx) * 0.9; }
      if (bx > court.clientWidth - BALL) { bx = court.clientWidth - BALL; vx = -Math.abs(vx) * 0.9; }
      if (by + BALL >= h) { by = h - BALL; gameOver(); }
      ball.style.left = bx + "px";
      ball.style.top = by + "px";
    }
    requestAnimationFrame(loop);
  })();

  /* ---------- 💞 在一起的天数 ---------- */
  const START = new Date(2026, 1, 27); // 2026-02-27
  const now = new Date();
  const diff = Math.floor((now - START) / 86400000) + 1;
  $("#daysCount").textContent = (diff > 0 ? diff : 0) + " 天";
})();
