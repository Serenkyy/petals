/* ================= 给自怡宝贝的小花园 ================= */
(function () {
  "use strict";

  /* ---------- 工具 ---------- */
  const $ = (s) => document.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- 声音（WebAudio：在第一次触摸时创建+解锁，iOS 最可靠、延迟最低） ---------- */
  let actx = null;
  let master = null;
  let audioPrimed = false;

  function unlockAudio() {
    if (audioPrimed) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) {
        actx = new AC({ latencyHint: "interactive" });
        master = actx.createGain();
        master.gain.value = 0.55;
        master.connect(actx.destination);
      }
      audioPrimed = true;
      /* 播放一段静音让 iOS 真正开始出声 */
      try {
        const buf = actx.createBuffer(1, 1, actx.sampleRate);
        const src = actx.createBufferSource();
        src.buffer = buf;
        src.connect(master);
        src.start(0);
      } catch (err) { /* 静音解锁失败也不影响后续 */ }
      if (actx.state === "suspended") actx.resume().catch(() => {});
    } catch (err) { actx = null; }
  }
  /* capture 阶段解锁：保证任何按钮的第一次点击就能发声 */
  document.addEventListener("pointerdown", unlockAudio, { capture: true, passive: true });

  /* 等音频上下文真正跑起来再发声，避免 iOS 第一声延迟；可指定输出到某个音量通道 */
  function playNote(freq, when = 0, dur = 0.85, vol = 0.5, dest) {
    if (!actx) return;
    const out = dest || master;
    const fire = () => {
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
      osc.connect(g).connect(out);
      osc2.connect(g2).connect(out);
      osc.start(t); osc.stop(t + dur + 0.05);
      osc2.start(t); osc2.stop(t + dur + 0.05);
    };
    if (actx.state === "suspended") actx.resume().then(fire).catch(() => {});
    else fire();
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
  const toppingHint = $("#toppingHint");

  function playSlurp() {
    if (!actx) return;
    const fire = () => {
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
    };
    if (actx.state === "suspended") actx.resume().then(fire).catch(() => {});
    else fire();
  }

  function slurpMsg(text) {
    const m = document.createElement("div");
    m.className = "slurp-msg";
    m.textContent = text;
    bowlWrap.appendChild(m);
    setTimeout(() => m.remove(), 1400);
  }

  /* —— 加配料 —— */
  const TOP_SOUND = { egg: 523.25, veg: 587.33, shrimp: 659.25, spice: 783.99 };
  const TOP_NAMES = { egg: "荷包蛋", veg: "小青菜", shrimp: "大虾虾", spice: "小辣椒" };
  const SLURP_MSGS = ["吸溜～", "好好吃！", "呼——烫烫的", "再来一口！", "全世界最好吃的面！", "汤都喝光光！"];
  const collected = new Set();
  const toppings = Array.from(document.querySelectorAll(".topping"));

  function updateToppingHint() {
    const left = 4 - collected.size;
    if (left === 0) toppingHint.textContent = "全部下锅！豪华面面马上好 ✨";
    else if (left === 4) toppingHint.textContent = "点点配料，给面面加料～";
    else toppingHint.textContent = "还差 " + left + " 样就完美啦～";
  }

  toppings.forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      unlockAudio();
      const t = btn.dataset.t;
      if (collected.has(t)) return;
      collected.add(t);
      btn.classList.add("on");
      const label = btn.querySelector(".tp-label");
      if (label) label.textContent = "已加✓";
      playNote(TOP_SOUND[t], 0, 0.3, 0.45);
      dropToBowl(btn, btn.querySelector(".tp-emoji").textContent);
      bowlWrap.classList.remove("plop");
      void bowlWrap.offsetWidth;
      bowlWrap.classList.add("plop");
      slurpMsg(TOP_NAMES[t] + " 下锅啦～");
      updateToppingHint();
      if (collected.size === 4) celebrateNoodles();
    });
  });

  /* 配料从按钮飞进碗里，落碗时溅起小水花 */
  function dropToBowl(btn, emoji) {
    const from = btn.getBoundingClientRect();
    const to = bowlWrap.querySelector(".bowl-emoji").getBoundingClientRect();
    const d = document.createElement("span");
    d.className = "topping-drop";
    d.textContent = emoji;
    d.style.left = from.left + from.width / 2 + "px";
    d.style.top = from.top + from.height / 2 + "px";
    document.body.appendChild(d);
    requestAnimationFrame(() => {
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      d.style.transform = "translate(calc(" + dx + "px - 50%), calc(" + dy + "px - 50%)) scale(.72)";
    });
    setTimeout(() => {
      d.remove();
      const s = document.createElement("span");
      s.className = "bowl-splash";
      s.textContent = pick(["💦", "✨", "💗"]);
      s.style.left = to.left + to.width / 2 + "px";
      s.style.top = to.top + to.height / 2 + "px";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 700);
    }, 620);
  }

  function celebrateNoodles() {
    bowlWrap.classList.add("celebrate");
    [523.25, 587.33, 659.25, 783.99, 1046.5].forEach((f, i) => playNote(f, i * 0.13, 0.55, 0.42));
    for (let i = 0; i < 8; i++) {
      const s = document.createElement("span");
      s.className = "spark-burst";
      s.textContent = pick(["✨", "⭐", "💛"]);
      s.style.left = rand(8, 92) + "%";
      s.style.top = rand(5, 85) + "%";
      bowlWrap.appendChild(s);
      setTimeout(() => s.remove(), 1400);
    }
    setTimeout(() => {
      playSlurp();
      noodleCount++;
      noodleNum.textContent = noodleCount;
      slurpMsg("豪华面面完成！开吃！🍜");
    }, 300);
    setTimeout(() => {
      bowlWrap.classList.remove("celebrate");
      collected.clear();
      toppings.forEach((b) => b.classList.remove("on"));
      updateToppingHint();
    }, 2800);
  }

  bowlWrap.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    bowlWrap.classList.remove("wiggle");
    void bowlWrap.offsetWidth; /* 重启动画 */
    bowlWrap.classList.add("wiggle");
    playSlurp();
    noodleCount++;
    noodleNum.textContent = noodleCount;
    if (noodleCount % 10 === 0) slurpMsg("今天的面里有爱心蛋！💛");
    else slurpMsg(pick(SLURP_MSGS));
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
    /* 第一段：轻轻哼唱 */
    [523.25, .5], [587.33, .5], [659.25, .5], [783.99, .5], [659.25, .5], [587.33, .5], [523.25, .75], [440.0, .25],
    [523.25, .5], [587.33, .5], [659.25, .5], [783.99, .5], [659.25, .5], [587.33, .5], [523.25, .75], [392.0, .25],
    [440.0, .5], [523.25, .5], [587.33, .5], [659.25, .5], [587.33, .5], [523.25, .5], [440.0, .75], [392.0, .25],
    [329.63, .5], [392.0, .5], [440.0, .5], [523.25, .5], [440.0, .5], [392.0, .5], [329.63, .75], [261.63, .25],
    /* 第二段：亮起来 */
    [659.25, .5], [783.99, .5], [880.0, .5], [783.99, .5], [659.25, .5], [587.33, .5], [523.25, .75], [440.0, .25],
    [440.0, .5], [523.25, .5], [587.33, .5], [659.25, .5], [587.33, .5], [523.25, .5], [440.0, .75], [392.0, .25],
    [392.0, .5], [440.0, .5], [523.25, .5], [587.33, .5], [523.25, .5], [440.0, .5], [392.0, .75], [329.63, .25],
    /* 第三段：慢慢回家 */
    [329.63, .5], [392.0, .5], [440.0, .5], [523.25, .5], [440.0, .5], [392.0, .5], [329.63, 1.0], [261.63, 1.0],
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

  /* 歌曲专用音量：点“停止”就能立刻把整首歌静音 */
  let songGain = null;

  singBtn.addEventListener("pointerdown", () => {
    if (singing) { stopSinging(); return; }
    singing = true;
    singBtn.textContent = "⏹ 先休息一下";
    unlockAudio();
    /* 为这首歌建一个独立音量通道，方便随时停掉 */
    if (actx) {
      songGain = actx.createGain();
      songGain.gain.value = 1;
      songGain.connect(master);
    }
    let t = 0;
    LULLABY.forEach(([f, d]) => { playNote(f, t, d * 0.9, 0.4, songGain || undefined); t += d * 0.42; });
    spawnBubble();
    singTimer = setInterval(spawnBubble, 260);
    setTimeout(stopSinging, t * 1000 + 400);
  });

  function stopSinging() {
    if (!singing) return;
    singing = false;
    singBtn.textContent = "🎶 点我一起唱";
    clearInterval(singTimer);
    /* 立刻让整首歌安静下来 */
    if (songGain && actx) {
      try {
        const t = actx.currentTime;
        songGain.gain.cancelScheduledValues(t);
        songGain.gain.setValueAtTime(1, t);
        songGain.gain.linearRampToValueAtTime(0.0001, t + 0.05);
      } catch (err) { /* 静音失败也不影响 */ }
      const g = songGain;
      setTimeout(() => { try { g.disconnect(); } catch (err) {} }, 80);
      songGain = null;
    }
  }

  /* ---------- 🎾 陪自怡打球（时机游戏：看准球落进圆圈的瞬间点一下） ---------- */
  const court = $("#court");
  const ball = $("#ball");
  const rallyEl = $("#rally");
  const bestEl = $("#best");
  const BALL = 46;
  let bx = 0, by = 10, vy = 0.5;
  let rally = 0;
  let best = parseInt(localStorage.getItem("petalBest") || "0", 10);
  bestEl.textContent = best;
  let over = false;
  let g = 0.07;   /* 重力：小一点，球落得慢，好瞄准时机 */
  /* 球场尺寸：随屏幕变化实时更新，小球的活动范围永远等于球场 */
  let cw = court.clientWidth, ch = court.clientHeight;
  window.addEventListener("resize", () => { cw = court.clientWidth; ch = court.clientHeight; });
  /* 接球圈（球拍）位置 */
  const racketCY = () => ch - 84;          // 圆圈中心 y
  const ZONE_TOP = () => racketCY() - 40;  // 球心进入此范围 = 可以接
  const ZONE_BOT = () => racketCY() + 34;  // 球心超过此范围 = 接空了

  function courtMsg(text, ms = 900) {
    court.querySelectorAll(".court-msg").forEach((m) => m.remove());
    const m = document.createElement("div");
    m.className = "court-msg";
    m.textContent = text;
    court.appendChild(m);
    setTimeout(() => m.remove(), ms);
  }

  function resetBall() {
    over = false;
    ball.classList.remove("over");
    rally = 0;
    rallyEl.textContent = rally;
    g = 0.07;                              // 速度重新变慢
    bx = cw / 2 - BALL / 2;                // 球从圆圈正上方落下
    by = 10;
    vy = 0.5;
    ball.style.left = bx + "px";
    ball.style.top = by + "px";
  }

  function gameOver() {
    if (over) return;
    over = true;
    ball.classList.add("over");
    courtMsg(rally >= 10 ? "哇！超厉害，再来一次 🎾" : "哎呀，接空了！再来一次 🎾", 1100);
    if (rally > best) {
      best = rally;
      localStorage.setItem("petalBest", String(best));
      bestEl.textContent = best;
    }
    setTimeout(() => resetBall(), 1100);
  }

  court.addEventListener("pointerdown", () => {
    unlockAudio();
    if (over) { resetBall(); return; }
    const cy = by + BALL / 2;              // 球心当前位置
    if (cy < ZONE_TOP()) {                 // 太早
      courtMsg("还没到呢，再等等～", 500);
      return;
    }
    if (cy <= ZONE_BOT()) {                // 时机对了！
      const perfect = Math.abs(cy - racketCY()) < 26;
      rally++;
      rallyEl.textContent = rally;
      g = 0.07 + rally * 0.004;            // 越接越快，但慢慢来
      vy = -(perfect ? rand(5, 6.2) : rand(3.8, 4.8));
      playNote(523.25 + Math.min(rally, 32) * 9, 0, 0.22, 0.3);
      ball.classList.remove("hit");
      void ball.offsetWidth;
      ball.classList.add("hit");
      courtMsg(perfect ? "完美接球！🎯" : "好球！", 650);
    } else {                               // 太晚了
      gameOver();
    }
  });

  /* 开场提示 */
  courtMsg("等球落进圆圈，点一下接住它！🎾", 2600);

  (function loop() {
    if (!over) {
      vy += g;
      by += vy;
      if (by < 0) { by = 0; vy = Math.abs(vy) * 0.6; }
      if (by > ch - BALL) { by = ch - BALL; gameOver(); }
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
