/* ============================================================
   Undangan Pernikahan — logika utama
   Animasi scroll-driven (GSAP ScrollTrigger) ada di js/animations.js;
   file ini memegang data, navigasi section, countdown, musik, RSVP.
   ============================================================ */

(function () {
  "use strict";

  var CFG = window.WEDDING_CONFIG;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mesin animasi GSAP; null bila CDN gagal / reduced motion → fallback CSS
  var FX = !reducedMotion && window.WeddingFX ? window.WeddingFX : null;
  if (FX) {
    document.body.classList.add("gsap-on");
    FX.init();
  }

  // Mode ringan untuk perangkat kelas bawah: tanpa backdrop-filter,
  // partikel ambient lebih sedikit, tanpa streak, satu layer bintang
  var lite = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  if (lite) document.body.classList.add("lite");

  /* ---------- Helper ---------- */

  function $(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  // API kecil untuk layer kejutan (js/delight.js)
  window.WeddingUI = { toast: toast };

  /* ---------- Partikel emas (ambient + burst) ---------- */

  window.WeddingParticles = (function () {
    var canvas = $("particles");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var COUNT = document.body.classList.contains("lite") ? 18 : 34;
    var MAX = 220; // cap total agar aman di HP kelas menengah
    var running = false;
    var started = false;
    var boost = 1;

    var CONFETTI_COLORS = ["#d4af37", "#f3e5ab", "#a8842c", "#f7f3e8", "#3f9b6e"];
    var HEART_COLORS = ["#d4af37", "#f3e5ab", "#e8a1a4"];

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    }

    function spawn(randomY) {
      return {
        x: Math.random() * canvas.width,
        y: randomY ? Math.random() * canvas.height : canvas.height + 10 * dpr,
        r: (Math.random() * 1.6 + 0.6) * dpr,
        vy: (Math.random() * 0.35 + 0.12) * dpr,
        vx: (Math.random() - 0.5) * 0.15 * dpr,
        alpha: Math.random() * 0.5 + 0.2,
        tw: Math.random() * Math.PI * 2,
        twSpeed: Math.random() * 0.03 + 0.01,
      };
    }

    function hexA(hex, a) {
      var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return "rgba(" + r + "," + g + "," + b + "," + Math.max(0, a).toFixed(3) + ")";
    }

    function drawHeart(p, a) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      var s = p.r / 5;
      ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(0, 3.2);
      ctx.bezierCurveTo(-6, -2.6, -3.2, -7.4, 0, -3.6);
      ctx.bezierCurveTo(3.2, -7.4, 6, -2.6, 0, 3.2);
      ctx.closePath();
      ctx.fillStyle = hexA(p.color, a);
      ctx.fill();
      ctx.restore();
    }

    function drawCoin(p, a) {
      var squash = Math.max(0.12, Math.abs(Math.cos(p.tw * 3))); // koin berputar
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * 0.3);
      ctx.scale(squash, 1);
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fillStyle = hexA("#d4af37", a);
      ctx.fill();
      ctx.lineWidth = 1.2 * dpr;
      ctx.strokeStyle = hexA("#a8842c", a);
      ctx.stroke();
      ctx.restore();
    }

    function drawConfetti(p, a) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.max(0.15, Math.abs(Math.sin(p.tw * 2)))); // kepakan kertas
      ctx.fillStyle = hexA(p.color, a);
      ctx.fillRect(-p.r, -p.r * 0.65, p.r * 2, p.r * 1.3);
      ctx.restore();
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (boost > 1) boost = Math.max(1, boost - 0.02);

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];

        if (p.burst) {
          p.x += p.bvx;
          p.y += p.bvy;
          p.bvy += (p.grav != null ? p.grav : 0.045 * dpr);
          if (p.sway) p.bvx += Math.sin(p.tw * 2) * 0.05 * dpr;
          p.life -= p.decay;
          p.rot += p.spin;
          if (p.life <= 0 || p.y > canvas.height + 24 * dpr) { particles.splice(i, 1); continue; }
        } else {
          p.y -= p.vy * boost;
          p.x += p.vx;
          if (p.y < -12 * dpr) particles[i] = spawn(false);
        }

        p.tw += p.twSpeed;
        var a = (p.burst ? p.alpha * Math.min(1, p.life * 1.6) : p.alpha) * (0.6 + 0.4 * Math.sin(p.tw));

        if (p.shape === "heart") { drawHeart(p, a); continue; }
        if (p.shape === "coin") { drawCoin(p, a); continue; }
        if (p.shape === "confetti") { drawConfetti(p, a); continue; }
        if (p.shape === "streak") {
          ctx.fillStyle = hexA("#f3e5ab", a * 0.8);
          ctx.fillRect(p.x - p.r / 2, p.y - p.len / 2, p.r, p.len);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212, 175, 55, " + Math.max(0, a).toFixed(3) + ")";
        ctx.shadowColor = "rgba(243, 229, 171, 0.8)";
        ctx.shadowBlur = 6 * dpr;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      requestAnimationFrame(frame);
    }

    function start() {
      if (started) return;
      started = true;
      resize();
      window.addEventListener("resize", resize);
      for (var i = 0; i < COUNT; i++) particles.push(spawn(true));
      running = true;
      requestAnimationFrame(frame);

      document.addEventListener("visibilitychange", function () {
        var wasRunning = running;
        running = !document.hidden;
        if (running && !wasRunning) requestAnimationFrame(frame);
      });
    }

    function decorate(p, shape, i) {
      p.shape = shape;
      p.rot = Math.random() * Math.PI * 2;
      p.spin = (Math.random() - 0.5) * 0.22;
      p.twSpeed = Math.random() * 0.06 + 0.02;
      if (shape === "heart") {
        p.color = HEART_COLORS[i % HEART_COLORS.length];
        p.r = (Math.random() * 3 + 4) * dpr;
      } else if (shape === "coin") {
        p.r = (Math.random() * 2.4 + 3) * dpr;
      } else if (shape === "confetti") {
        p.color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        p.r = (Math.random() * 2.6 + 2.4) * dpr;
        p.sway = true;
      }
    }

    // Ledakan partikel dari titik (x, y) layar
    function burst(x, y, n, opts) {
      if (!started) return;
      opts = opts || {};
      n = n || 26;
      for (var i = 0; i < n; i++) {
        if (particles.length >= MAX) break;
        var ang = opts.up
          ? -Math.PI / 2 + (Math.random() - 0.5) * 1.3
          : Math.random() * Math.PI * 2;
        var speed = (Math.random() * 2.6 + 1.2) * dpr * (opts.speed || 1);
        var p = spawn(true);
        p.burst = true;
        p.x = x * dpr;
        p.y = y * dpr;
        p.bvx = Math.cos(ang) * speed;
        p.bvy = Math.sin(ang) * speed - 1.2 * dpr;
        p.alpha = 0.95;
        p.life = 1;
        p.decay = Math.random() * 0.012 + 0.008;
        p.grav = 0.045 * dpr;
        if (opts.shape && opts.shape !== "dot") decorate(p, opts.shape, i);
        else { p.shape = "dot"; p.r = (Math.random() * 2 + 0.8) * dpr; p.rot = 0; p.spin = 0; }
        particles.push(p);
      }
    }

    // Hujan dari atas layar (konfeti / emas)
    function rain(n, shape) {
      if (!started) return;
      n = n || 100;
      for (var i = 0; i < n; i++) {
        if (particles.length >= MAX) break;
        var p = spawn(true);
        p.burst = true;
        p.x = Math.random() * canvas.width;
        p.y = -Math.random() * 0.7 * canvas.height - 10 * dpr;
        p.bvx = (Math.random() - 0.5) * 0.9 * dpr;
        p.bvy = (Math.random() * 1.8 + 1.6) * dpr;
        p.grav = 0.012 * dpr;
        p.alpha = 0.95;
        p.life = 1;
        p.decay = Math.random() * 0.003 + 0.0035;
        decorate(p, shape || "confetti", i);
        if ((shape || "confetti") === "dot") { p.shape = "dot"; p.r = (Math.random() * 2 + 1) * dpr; }
        particles.push(p);
      }
    }

    function boostUp() { boost = 2.4; }

    // Guratan kecepatan: garis emas singkat berlawanan arah scroll (fling)
    function streak(dir) {
      if (!started) return;
      for (var i = 0; i < 8; i++) {
        if (particles.length >= MAX) break;
        var p = spawn(true);
        p.burst = true;
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
        p.bvx = 0;
        p.bvy = dir * (Math.random() * 6 + 9) * dpr;
        p.grav = 0;
        p.alpha = 0.5;
        p.life = 0.5;
        p.decay = 0.05;
        p.shape = "streak";
        p.r = (Math.random() * 1.2 + 0.7) * dpr;
        p.len = (Math.random() * 26 + 18) * dpr;
        p.rot = 0;
        p.spin = 0;
        particles.push(p);
      }
    }

    function count() { return particles.length; }

    return { start: start, burst: burst, rain: rain, boostUp: boostUp, streak: streak, count: count };
  })();

  /* ---------- Isi data dari config ---------- */

  function fillText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  function setupInstagram(linkId, username) {
    var el = $(linkId);
    if (!el) return;
    if (username) {
      el.href = "https://instagram.com/" + username;
      el.querySelector("span").textContent = "@" + username;
      el.hidden = false;
    }
  }

  function populate() {
    var g = CFG.couple.groom, b = CFG.couple.bride;

    fillText("groom-full", g.full);
    fillText("groom-parents", g.parents);
    $("groom-photo").src = g.photo;
    setupInstagram("groom-ig", g.instagram);

    fillText("bride-full", b.full);
    fillText("bride-parents", b.parents);
    $("bride-photo").src = b.photo;
    setupInstagram("bride-ig", b.instagram);

    // Tanggal hero & finale: "03 . 10 . 2026"
    var d = new Date(CFG.event.mainDateISO);
    if (!isNaN(d)) {
      var pad = function (n) { return String(n).padStart(2, "0"); };
      var dateLabel = pad(d.getDate()) + " . " + pad(d.getMonth() + 1) + " . " + d.getFullYear();
      fillText("hero-date", dateLabel);
      fillText("finale-date", dateLabel);
    }

    fillText("quote-text", CFG.quote.text);
    fillText("quote-source", CFG.quote.source);
    fillText("closing-text", CFG.closing.text);

    // Acara
    ["akad", "resepsi"].forEach(function (key) {
      var ev = CFG.event[key];
      fillText(key + "-title", ev.title);
      fillText(key + "-date", ev.dateLabel);
      fillText(key + "-time", ev.timeLabel);
      fillText(key + "-venue", ev.venue);
      fillText(key + "-address", ev.address);
      $(key + "-maps").href = ev.mapsUrl;
    });

    // Galeri (filmstrip horizontal)
    var strip = $("gallery-strip");
    CFG.gallery.forEach(function (src, i) {
      var frame = document.createElement("figure");
      frame.className = "gframe";
      var img = document.createElement("img");
      img.src = src;
      img.alt = "Galeri foto " + (i + 1);
      img.loading = "lazy";
      frame.appendChild(img);
      strip.appendChild(frame);
    });
    $("gallery-counter").textContent = "1 / " + CFG.gallery.length;

    // Amplop digital
    var giftList = $("gift-list");
    CFG.gifts.forEach(function (gift) {
      var card = document.createElement("div");
      card.className = "gift-card";
      card.innerHTML =
        '<span class="gift-bank">' + escapeHtml(gift.bank) + "</span>" +
        '<span class="gift-number">' + escapeHtml(gift.number) + "</span>" +
        '<span class="gift-holder">a.n. ' + escapeHtml(gift.holder) + "</span>" +
        '<button type="button" class="btn-outline btn-copy">Salin Nomor</button>';
      card.querySelector(".btn-copy").addEventListener("click", function (ev) {
        var r = ev.currentTarget.getBoundingClientRect();
        copyText(gift.number, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      });
      giftList.appendChild(card);
    });

    // Save the Date (Google Calendar)
    $("save-date-btn").href = buildCalendarUrl();

    // Musik
    $("bg-music").src = CFG.musicSrc;
  }

  function copiedFx(pos) {
    toast("Tersalin! Tuhan memberkati kemurahan hatimu 🤍");
    if (pos) emit("wedding:copy", pos);
  }

  function copyText(text, pos) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { copiedFx(pos); },
        function () { fallbackCopy(text, pos); }
      );
    } else {
      fallbackCopy(text, pos);
    }
  }

  function fallbackCopy(text, pos) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      copiedFx(pos);
    } catch (e) {
      toast("Gagal menyalin, salin manual ya");
    }
    document.body.removeChild(ta);
  }

  function buildCalendarUrl() {
    var start = new Date(CFG.event.mainDateISO);
    if (isNaN(start)) return "#";
    var end = new Date(start.getTime() + (CFG.event.calendar.durationHours || 4) * 3600 * 1000);
    function fmt(dt) {
      return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    }
    var params = new URLSearchParams({
      action: "TEMPLATE",
      text: CFG.event.calendar.title,
      details: CFG.event.calendar.details,
      location: CFG.event.calendar.location,
      dates: fmt(start) + "/" + fmt(end),
    });
    return "https://calendar.google.com/calendar/render?" + params.toString();
  }

  /* ---------- Nama tamu dari ?to= ---------- */

  function setGuestName() {
    var params = new URLSearchParams(location.search);
    var name = (params.get("to") || "").trim();
    if (name) {
      $("guest-name").textContent = name.slice(0, 60);
    }
  }

  /* ---------- Navigasi scene: dots + scene aktif ---------- */

  var scenes = Array.prototype.slice.call(document.querySelectorAll(".story .scene"));
  var dotsNav = $("dots");
  var dotBtns = [];
  var activeIdx = -1;
  var opened = false;

  scenes.forEach(function (scene, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Ke bagian " + (i + 1));
    b.addEventListener("click", function () {
      scene.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
    dotsNav.appendChild(b);
    dotBtns.push(b);
  });

  function setActive(i) {
    if (i === activeIdx) return;
    activeIdx = i;
    dotBtns.forEach(function (b, j) { b.classList.toggle("active", j === i); });
    if (!opened) return;

    window.WeddingParticles.boostUp();
    if (navigator.vibrate) navigator.vibrate(8);
    // (Burst scene penutup dihapus — finale "Langit Berbintang" butuh
    //  masuk dalam kegelapan; perayaannya dipicu wedding:finale)
    emit("wedding:scene", { index: i, total: scenes.length });
  }

  /* Scene aktif = scene teratas yang panelnya sedang tampil.
     Karena scene saling tumpang-tindih (margin negatif), IO band tengah
     bisa memuat >1 scene — pilih yang indeksnya TERBESAR yang intersect. */
  var visible = [];
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var i = scenes.indexOf(en.target);
      en.target.classList.toggle("in-view", en.isIntersecting);
      visible[i] = en.isIntersecting;
    });
    for (var i = scenes.length - 1; i >= 0; i--) {
      if (visible[i]) { setActive(i); break; }
    }
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
  scenes.forEach(function (s) { io.observe(s); });

  /* ---------- Progress bar scroll ---------- */

  var progressEl = $("scroll-progress");
  var ringEl = $("progress-ring");
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      progressEl.style.transform = "scaleX(" + p + ")";
      // Cincin 💍 meluncur di ujung garis progress
      if (ringEl) ringEl.style.transform = "translateX(" + (p * (window.innerWidth - 20)).toFixed(1) + "px)";
    });
  }, { passive: true });

  /* ---------- Cover gate ---------- */

  function unlockScroll() {
    document.body.classList.remove("locked");
    window.scrollTo(0, 0);
  }

  $("open-btn").addEventListener("click", function () {
    if (opened) return;
    opened = true;

    // Mulai musik (dari gesture klik, jadi lolos kebijakan autoplay)
    startMusic();

    if (!reducedMotion) window.WeddingParticles.start();

    // iOS butuh izin gyro & motion dari gesture user; Android langsung jalan
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission().catch(function () {});
    }
    if (FX) {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission()
          .then(function () { FX.initTilt(); })
          .catch(function () { FX.initTilt(); }); // fallback pointer tetap aktif
      } else {
        FX.initTilt();
      }
      try {
        FX.openCover(unlockScroll);
      } catch (e) {
        // Timeline pembuka gagal → jangan pernah biarkan tamu terkunci
        $("cover").classList.add("open");
        unlockScroll();
      }
    } else {
      $("cover").classList.add("open");
      unlockScroll();
    }

    // Jaring pengaman: apa pun yang terjadi pada animasi pembuka,
    // 4 detik setelah klik halaman WAJIB bisa discroll & cover minggir
    setTimeout(function () {
      var cover = $("cover");
      if (document.body.classList.contains("locked")) unlockScroll();
      if (cover && getComputedStyle(cover).display !== "none") {
        cover.classList.add("open");
        cover.style.pointerEvents = "none";
      }
    }, 4000);

    emit("wedding:opened", {});
  });

  /* ---------- Musik ---------- */

  var music = $("bg-music");
  var musicBtn = $("music-btn");
  var musicOn = false;

  function startMusic() {
    music.play().then(
      function () {
        musicOn = true;
        musicBtn.hidden = false;
        musicBtn.classList.add("playing");
      },
      function () {
        // File belum ada / gagal load — sembunyikan tombol saja
        musicBtn.hidden = true;
      }
    );
  }

  musicBtn.addEventListener("click", function () {
    if (musicOn) {
      music.pause();
      musicOn = false;
      musicBtn.classList.remove("playing");
      musicBtn.classList.add("muted");
    } else {
      music.play();
      musicOn = true;
      musicBtn.classList.add("playing");
      musicBtn.classList.remove("muted");
    }
  });

  /* ---------- Countdown ---------- */

  function startCountdown() {
    var target = new Date(CFG.event.mainDateISO).getTime();
    if (isNaN(target)) return;

    var prev = {};
    function setDigit(id, val) {
      if (prev[id] === val) return;
      prev[id] = val;
      var el = $(id);
      if (FX && opened) FX.flipDigit(el, val);
      else el.textContent = val;
    }

    // Angka hari raksasa di latar scene countdown (parallax scrub)
    var ghost = document.querySelector(".count-ghost");
    var prevGhost = null;
    function setGhost(days) {
      if (!ghost || prevGhost === days) return;
      prevGhost = days;
      ghost.textContent = days;
    }

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        $("countdown").hidden = true;
        $("countdown-over").hidden = false;
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      setGhost(Math.floor(s / 86400));
      setDigit("cd-days", Math.floor(s / 86400));
      setDigit("cd-hours", Math.floor((s % 86400) / 3600));
      setDigit("cd-mins", Math.floor((s % 3600) / 60));
      setDigit("cd-secs", s % 60);
    }
    tick();
    var timer = setInterval(tick, 1000);
  }

  /* ---------- RSVP & ucapan ---------- */

  function renderWishes(wishes) {
    var box = $("wishes");
    if (!wishes || !wishes.length) {
      box.innerHTML = '<p class="wishes-empty">Belum ada ucapan. Jadilah yang pertama! ✨</p>';
      return;
    }
    box.innerHTML = wishes
      .map(function (w) {
        var badge = w.attendance
          ? '<span class="wish-badge">' + escapeHtml(w.attendance) + "</span>"
          : "";
        return (
          '<div class="wish">' +
          '<div class="wish-head"><span class="wish-name">' + escapeHtml(w.name || "Anonim") + "</span>" + badge + "</div>" +
          '<p class="wish-text">' + escapeHtml(w.message || "") + "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function loadWishes() {
    if (!CFG.appsScriptUrl) {
      $("wishes").innerHTML =
        '<p class="wishes-empty">Ucapan akan tampil di sini setelah backend dikonfigurasi.</p>';
      return;
    }
    fetch(CFG.appsScriptUrl)
      .then(function (r) { return r.json(); })
      .then(function (data) { renderWishes(data.wishes); })
      .catch(function () {
        $("wishes").innerHTML = '<p class="wishes-empty">Gagal memuat ucapan.</p>';
      });
  }

  $("rsvp-form").addEventListener("submit", function (e) {
    e.preventDefault();

    if (!CFG.appsScriptUrl) {
      toast("RSVP belum aktif — backend belum dikonfigurasi");
      return;
    }

    var btn = this.querySelector(".btn-submit");
    var data = new URLSearchParams({
      name: $("rsvp-name").value.trim(),
      attendance: $("rsvp-attendance").value,
      guests: $("rsvp-guests").value,
      message: $("rsvp-message").value.trim(),
    });

    btn.disabled = true;
    btn.textContent = "Mengirim…";

    fetch(CFG.appsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: data.toString(),
    })
      .then(function () {
        var att = data.get("attendance");
        toast(att === "Hadir"
          ? "Yeay! Sampai jumpa di sana 🎉"
          : "Terima kasih, doamu sangat berarti 🤍");
        emit("wedding:rsvp", { attendance: att });
        // Tampilkan langsung tanpa menunggu reload dari server
        var box = $("wishes");
        var empty = box.querySelector(".wishes-empty");
        if (empty) empty.remove();
        var div = document.createElement("div");
        div.className = "wish";
        div.innerHTML =
          '<div class="wish-head"><span class="wish-name">' + escapeHtml(data.get("name")) + "</span>" +
          '<span class="wish-badge">' + escapeHtml(data.get("attendance")) + "</span></div>" +
          '<p class="wish-text">' + escapeHtml(data.get("message")) + "</p>";
        box.prepend(div);
        $("rsvp-form").reset();
      })
      .catch(function () {
        toast("Gagal mengirim, coba lagi ya");
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = "Kirim Ucapan";
      });
  });

  /* ---------- Init ---------- */

  setGuestName();
  populate();
  startCountdown();
  loadWishes();
})();
