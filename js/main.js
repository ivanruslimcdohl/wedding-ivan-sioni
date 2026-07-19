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

  /* ---------- Partikel emas (ambient + burst) ---------- */

  window.WeddingParticles = (function () {
    var canvas = $("particles");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var COUNT = 34;
    var running = false;
    var started = false;
    var boost = 1;

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

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (boost > 1) boost = Math.max(1, boost - 0.02);

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];

        if (p.burst) {
          p.x += p.bvx;
          p.y += p.bvy;
          p.bvy += 0.045 * dpr; // gravitasi halus
          p.life -= p.decay;
          if (p.life <= 0) { particles.splice(i, 1); continue; }
        } else {
          p.y -= p.vy * boost;
          p.x += p.vx;
          if (p.y < -12 * dpr) particles[i] = spawn(false);
        }

        p.tw += p.twSpeed;
        var a = (p.burst ? p.alpha * p.life : p.alpha) * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212, 175, 55, " + Math.max(0, a).toFixed(3) + ")";
        ctx.shadowColor = "rgba(243, 229, 171, 0.8)";
        ctx.shadowBlur = 6 * dpr;
        ctx.fill();
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

    // Ledakan partikel emas dari titik (x, y) layar
    function burst(x, y, n) {
      if (!started) return;
      n = n || 26;
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * Math.PI * 2;
        var speed = (Math.random() * 2.6 + 1.2) * dpr;
        var p = spawn(true);
        p.burst = true;
        p.x = x * dpr;
        p.y = y * dpr;
        p.bvx = Math.cos(ang) * speed;
        p.bvy = Math.sin(ang) * speed - 1.2 * dpr;
        p.r = (Math.random() * 2 + 0.8) * dpr;
        p.alpha = 0.9;
        p.life = 1;
        p.decay = Math.random() * 0.012 + 0.008;
        particles.push(p);
      }
    }

    function boostUp() { boost = 2.4; }

    return { start: start, burst: burst, boostUp: boostUp };
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

    // Tanggal hero: "03 . 10 . 2026"
    var d = new Date(CFG.event.mainDateISO);
    if (!isNaN(d)) {
      var pad = function (n) { return String(n).padStart(2, "0"); };
      fillText("hero-date", pad(d.getDate()) + " . " + pad(d.getMonth() + 1) + " . " + d.getFullYear());
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

    // Galeri
    var grid = $("gallery-grid");
    CFG.gallery.forEach(function (src, i) {
      var img = document.createElement("img");
      img.src = src;
      img.alt = "Galeri foto " + (i + 1);
      img.loading = "lazy";
      grid.appendChild(img);
    });

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
      card.querySelector(".btn-copy").addEventListener("click", function () {
        copyText(gift.number);
      });
      giftList.appendChild(card);
    });

    // Save the Date (Google Calendar)
    $("save-date-btn").href = buildCalendarUrl();

    // Musik
    $("bg-music").src = CFG.musicSrc;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Nomor tersalin ✓"); },
        function () { fallbackCopy(text); }
      );
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast("Nomor tersalin ✓");
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

  /* ---------- Navigasi section: dots + section aktif ---------- */

  var sections = Array.prototype.slice.call(document.querySelectorAll(".story .panel"));
  var dotsNav = $("dots");
  var dotBtns = [];
  var activeIdx = -1;
  var opened = false;

  sections.forEach(function (sec, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Ke bagian " + (i + 1));
    b.addEventListener("click", function () {
      sec.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
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
    // Burst emas menyambut section penutup
    if (i === sections.length - 1) {
      window.WeddingParticles.burst(window.innerWidth / 2, window.innerHeight * 0.32);
    }
  }

  // Section dianggap aktif saat melewati pita tengah layar
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var i = sections.indexOf(en.target);
      en.target.classList.toggle("in-view", en.isIntersecting);
      if (en.isIntersecting) setActive(i);
    });
  }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
  sections.forEach(function (s) { io.observe(s); });

  /* ---------- Progress bar scroll ---------- */

  var progressEl = $("scroll-progress");
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progressEl.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
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

    // iOS butuh izin gyro dari gesture user; Android langsung jalan
    if (FX) {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission()
          .then(function () { FX.initTilt(); })
          .catch(function () { FX.initTilt(); }); // fallback pointer tetap aktif
      } else {
        FX.initTilt();
      }
      FX.openCover(unlockScroll);
    } else {
      $("cover").classList.add("open");
      unlockScroll();
    }
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

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        $("countdown").hidden = true;
        $("countdown-over").hidden = false;
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
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
        toast("Terima kasih atas ucapannya! 🤍");
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
