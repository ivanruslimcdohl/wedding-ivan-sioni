/* ============================================================
   WeddingFX — mesin animasi scroll-driven (GSAP + ScrollTrigger)
   Semua gerakan di-scrub: maju-mundur mengikuti posisi scroll,
   bukan diputar sekali setelah pindah section.
   Jika GSAP gagal dimuat, main.js jatuh ke animasi CSS sederhana.
   ============================================================ */

window.WeddingFX = (function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return null;

  gsap.registerPlugin(ScrollTrigger);
  var hasSplit = !!window.SplitText;
  if (hasSplit) gsap.registerPlugin(SplitText);

  var splits = { heroName: null, heroDate: null, closingName: null };
  var ready = false;
  var built = false;

  /* ---------- Util ---------- */

  function q(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  function circleLen(c) {
    return 2 * Math.PI * parseFloat(c.getAttribute("r"));
  }

  // fromTo eksplisit: .from() di timeline ter-scrub bisa salah merekam nilai
  // akhirnya saat ScrollTrigger me-refresh (elemen sedang di posisi "from"),
  // membuatnya macet. Dengan kedua ujung ditulis eksplisit, tidak ada yang
  // perlu direkam — deterministik. immediateRender menyembunyikan elemen
  // sejak build agar tidak berkedip sebelum discroll.
  var NEUTRAL = {
    x: 0, y: 0, xPercent: 0, yPercent: 0, opacity: 1,
    scale: 1, scaleX: 1, scaleY: 1,
    rotation: 0, rotationX: 0, rotationY: 0, skewX: 0, skewY: 0,
  };
  var CONFIG_KEYS = { duration: 1, ease: 1, stagger: 1 };

  function F(tl, targets, vars, pos) {
    if (!targets || (targets.length !== undefined && !targets.length)) return;
    var from = {}, to = { immediateRender: true };
    for (var k in vars) {
      if (CONFIG_KEYS[k]) {
        to[k] = vars[k];
      } else if (k === "transformOrigin" || k === "transformPerspective") {
        from[k] = vars[k];
        to[k] = vars[k];
      } else {
        from[k] = vars[k];
        to[k] = NEUTRAL.hasOwnProperty(k) ? NEUTRAL[k] : vars[k];
      }
    }
    tl.fromTo(targets, from, to, pos);
  }

  /* ---------- Persiapan (split teks setelah font siap) ---------- */

  function prepare() {
    if (ready) return;
    if (hasSplit) {
      try {
        splits.heroName = new SplitText(".slide-hero .script-name", { type: "words" });
        splits.closingName = new SplitText(".slide-closing .script-name", { type: "words" });
        splits.heroDate = new SplitText("#hero-date", { type: "chars" });
        splits.heroDate.chars.forEach(function (ch) {
          var wrap = document.createElement("span");
          wrap.style.cssText = "display:inline-block;overflow:hidden;vertical-align:bottom;";
          ch.parentNode.insertBefore(wrap, ch);
          wrap.appendChild(ch);
          ch.style.display = "inline-block";
        });
      } catch (e) { /* font/split gagal → pakai elemen utuh */ }
    }
    ready = true;
  }

  /* ---------- Timeline scrub per section (fase masuk) ----------
     Skala waktu relatif: total ± 1 "detik" timeline dipetakan ke
     rentang scroll "top 90% → top 20%" (section naik dari bawah
     layar sampai hampir penuh). */

  function titleIn(tl, sec) {
    F(tl, q(sec, ".section-title"), { y: 48, opacity: 0, duration: 0.3 }, 0);
    F(tl, q(sec, ".gold-divider"), { scaleX: 0, opacity: 0, duration: 0.25 }, 0.08);
  }

  var enter = {
    // 1 — MEMPELAI: foto reveal lingkaran berputar, nama masuk miring
    1: function (tl, sec) {
      F(tl, q(sec, ".eyebrow"), { y: 40, opacity: 0, duration: 0.3 }, 0);
      F(tl, q(sec, ".section-intro"), { y: 46, opacity: 0, duration: 0.35 }, 0.05);
      q(sec, ".person").forEach(function (p, i) {
        var at = 0.12 + i * 0.3;
        tl.fromTo(p.querySelector(".photo-ring"),
          { clipPath: "circle(0% at 50% 50%)", rotation: -120 },
          { clipPath: "circle(75% at 50% 50%)", rotation: 0, duration: 0.5, immediateRender: true }, at);
        tl.fromTo(p.querySelector("img"),
          { rotation: 120, scale: 1.35 },
          { rotation: 0, scale: 1, duration: 0.5, immediateRender: true }, at);
        F(tl, [p.querySelector(".person-name")], { x: i % 2 ? 70 : -70, skewX: i % 2 ? 10 : -10, opacity: 0, duration: 0.3 }, at + 0.18);
        F(tl, [p.querySelector(".person-parents")], { y: 26, opacity: 0, duration: 0.3 }, at + 0.26);
      });
      F(tl, q(sec, ".script-amp"), { scale: 0, rotation: 220, opacity: 0, duration: 0.35, ease: "back.out(2)" }, 0.42);
    },

    // 2 — ACARA: kartu bangkit sambil menegak 3D, isi menyusul
    2: function (tl, sec) {
      titleIn(tl, sec);
      q(sec, ".event-card").forEach(function (card, i) {
        var at = 0.15 + i * 0.28;
        F(tl, [card], {
          rotationX: 65, y: 130, opacity: 0, transformOrigin: "50% 0%",
          transformPerspective: 900, duration: 0.5,
        }, at);
        F(tl, q(card, ".event-name, .event-date, .event-time, .event-venue, .event-address"),
          { y: 22, opacity: 0, duration: 0.22, stagger: 0.04 }, at + 0.18);
        F(tl, [card.querySelector(".btn-outline")], { scale: 0.6, opacity: 0, duration: 0.2, ease: "back.out(2)" }, at + 0.3);
      });
    },

    // 3 — COUNTDOWN: kotak angka turun bergantian dengan puntiran
    3: function (tl, sec) {
      titleIn(tl, sec);
      F(tl, q(sec, ".section-intro"), { y: 30, opacity: 0, duration: 0.25 }, 0.1);
      F(tl, q(sec, ".count-box"), {
        y: -130, opacity: 0, duration: 0.45, stagger: 0.07, ease: "back.out(1.6)",
        rotation: function (i) { return i % 2 ? 7 : -7; },
      }, 0.22);
      F(tl, q(sec, ".btn-gold"), { scale: 0.5, opacity: 0, duration: 0.3, ease: "back.out(2)" }, 0.6);
    },

    // 4 — GALERI: tile wipe bergantian arah + zoom-settle
    4: function (tl, sec) {
      titleIn(tl, sec);
      q(sec, ".gallery-grid img").forEach(function (img, i) {
        tl.fromTo(img,
          { clipPath: i % 2 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", scale: 1.25 },
          { clipPath: "inset(0 0% 0 0%)", scale: 1, duration: 0.4, ease: "power2.inOut", immediateRender: true },
          0.12 + i * 0.1);
      });
    },

    // 5 — RSVP: field form zig-zag, daftar ucapan menyusul
    5: function (tl, sec) {
      titleIn(tl, sec);
      q(sec, ".rsvp-form > *").forEach(function (f, i) {
        F(tl, [f], { x: i % 2 ? 80 : -80, opacity: 0, duration: 0.3 }, 0.12 + i * 0.07);
      });
      F(tl, [sec.querySelector(".wishes")], { y: 70, opacity: 0, duration: 0.35 }, 0.5);
    },

    // 6 — AMPLOP: kartu rekening membuka seperti pintu emas
    6: function (tl, sec) {
      titleIn(tl, sec);
      F(tl, q(sec, ".section-intro"), { y: 34, opacity: 0, duration: 0.3 }, 0.1);
      F(tl, q(sec, ".gift-card"), {
        rotationY: -85, x: -60, opacity: 0, transformOrigin: "0% 50%",
        transformPerspective: 1000, duration: 0.5, stagger: 0.15,
      }, 0.2);
    },

    // 7 — PENUTUP: monogram menggambar diri mengikuti scroll
    7: function (tl, sec) {
      q(sec, ".monogram-svg circle").forEach(function (c, i) {
        var len = circleLen(c);
        tl.fromTo(c,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 0.5, ease: "none", immediateRender: true }, i * 0.06);
      });
      F(tl, q(sec, ".mono-text"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.3, ease: "back.out(2)" }, 0.25);
      F(tl, q(sec, ".section-intro"), { y: 40, opacity: 0, duration: 0.3 }, 0.2);
      F(tl, q(sec, ".eyebrow, .closing-sign"), { y: 24, opacity: 0, duration: 0.25, stagger: 0.06 }, 0.35);
      var nameTargets = (splits.closingName && splits.closingName.words.length) ? splits.closingName.words : q(sec, ".script-name");
      F(tl, nameTargets, { yPercent: 130, opacity: 0, duration: 0.4, stagger: 0.08, ease: "back.out(1.6)" }, 0.45);
      F(tl, q(sec, ".gold-divider"), { scaleX: 0, opacity: 0, duration: 0.25 }, 0.6);
      F(tl, q(sec, ".credit"), { opacity: 0, duration: 0.3 }, 0.7);
    },
  };

  /* ---------- Build semua trigger ---------- */

  function buildScroll() {
    if (built) return;
    built = true;

    var secs = q(document, ".story .panel");

    secs.forEach(function (sec, i) {
      // Kata dekoratif melayang berlawanan arah scroll (parallax dalam)
      var decor = sec.querySelector(".slide-decor");
      if (decor) {
        gsap.fromTo(decor, { y: "38vh" }, {
          y: "-38vh", ease: "none",
          scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true },
        });
      }

      // Fase keluar: konten melayang naik & meredup saat section ditinggalkan
      if (i < secs.length - 1) {
        gsap.to(sec.querySelector(".slide-inner"), {
          yPercent: -22, opacity: 0.15, ease: "power1.in",
          scrollTrigger: { trigger: sec, start: "bottom 92%", end: "bottom 35%", scrub: 0.4 },
        });
      }

      // Fase masuk (hero tidak: dia dapat intro sinematik saat cover dibuka)
      if (enter[i]) {
        enter[i](gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: sec, start: "top 90%", end: "top 20%", scrub: 0.4 },
        }), sec);
      }
    });

    // Hint scroll di hero memudar begitu mulai bergerak
    var hint = document.querySelector(".swipe-hint");
    if (hint) {
      gsap.to(hint, {
        opacity: 0, y: 30, ease: "none",
        scrollTrigger: { trigger: secs[0], start: "top top", end: "20% top", scrub: true },
      });
    }
  }

  /* ---------- Intro hero (sekali, saat tirai terbuka) ---------- */

  function heroIntro() {
    var slide = document.querySelector(".slide-hero");
    if (!slide) return;
    var tl = gsap.timeline();

    q(slide, ".monogram-svg circle").forEach(function (c, i) {
      var len = circleLen(c);
      gsap.set(c, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(c, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, i * 0.15);
    });
    tl.from(q(slide, ".mono-text"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.8, ease: "back.out(2)" }, 0.55);
    tl.from(q(slide, ".eyebrow"), { opacity: 0, letterSpacing: "0.7em", duration: 1, ease: "power2.out" }, 0.35);
    var nameTargets = (splits.heroName && splits.heroName.words.length) ? splits.heroName.words : q(slide, ".script-name");
    tl.from(nameTargets, { yPercent: 130, opacity: 0, rotation: 6, duration: 1.1, stagger: 0.14, ease: "back.out(1.7)" }, 0.55);
    tl.from(q(slide, ".gold-divider"), { scaleX: 0, opacity: 0, duration: 0.7, ease: "power3.out" }, 1.1);
    var dateTargets = (splits.heroDate && splits.heroDate.chars.length) ? splits.heroDate.chars : q(slide, ".hero-date");
    tl.from(dateTargets, { yPercent: 110, duration: 0.7, stagger: 0.045, ease: "power3.out" }, 1.2);
    tl.from(q(slide, ".quote"), { opacity: 0, y: 24, duration: 0.9, ease: "power2.out" }, 1.55);
    tl.from(q(slide, ".swipe-hint"), { opacity: 0, duration: 0.8 }, 1.9);
  }

  /* ---------- Opening sinematik (tirai emas) ---------- */

  function openCover(onReveal) {
    prepare();
    buildScroll();

    var cover = document.getElementById("cover");
    var tl = gsap.timeline({
      onComplete: function () { cover.style.display = "none"; },
    });

    // Matikan dulu animasi CSS entrance cover — fill-mode "both"-nya
    // menimpa inline style GSAP sehingga fade-out tidak terlihat
    tl.set(".cover-inner > *", { animation: "none" }, 0);
    tl.to("#open-btn", { scale: 1.12, boxShadow: "0 0 60px rgba(243,229,171,0.9)", duration: 0.35, ease: "power2.out" }, 0);
    tl.to(".cover-inner > *", { y: -28, opacity: 0, duration: 0.5, stagger: 0.045, ease: "power2.in" }, 0.25);
    tl.to(".cover-frame", { opacity: 0, duration: 0.4 }, 0.45);
    tl.fromTo(".cover-sweep", { xPercent: -130 }, { xPercent: 130, duration: 0.85, ease: "power2.inOut" }, 0.6);
    tl.add(function () {
      if (window.WeddingParticles) {
        window.WeddingParticles.burst(window.innerWidth / 2, window.innerHeight / 2);
      }
    }, 0.85);
    tl.to(".cover-panel-left", { xPercent: -102, duration: 1.15, ease: "power4.inOut" }, 0.95);
    tl.to(".cover-panel-right", { xPercent: 102, duration: 1.15, ease: "power4.inOut" }, 0.95);
    // Scroll dibuka + hero masuk tepat saat tirai membelah
    tl.add(function () {
      if (onReveal) onReveal();
      ScrollTrigger.refresh();
      heroIntro();
    }, 0.95);
  }

  /* ---------- Flip angka countdown ---------- */

  function flipDigit(el, val) {
    if (el.__flipping) { el.textContent = val; return; }
    el.__flipping = true;
    gsap.timeline({ onComplete: function () { el.__flipping = false; } })
      .to(el, { rotationX: -88, duration: 0.16, ease: "power2.in",
        onComplete: function () { el.textContent = val; } })
      .to(el, { rotationX: 0, duration: 0.26, ease: "back.out(2.2)" });
  }

  /* ---------- Gyro / pointer parallax layer ambient ---------- */

  function initTilt() {
    var leaves = q(document, ".leaf");
    var canvas = document.getElementById("particles");
    var last = 0;

    function apply(nx, ny) {
      var now = Date.now();
      if (now - last < 66) return; // throttle ~15fps cukup untuk ambience
      last = now;
      leaves.forEach(function (el) {
        var d = parseFloat(el.getAttribute("data-depth") || "1");
        gsap.to(el, { x: nx * 14 * d, y: ny * 10 * d, duration: 0.9, ease: "power2.out", overwrite: "auto" });
      });
      gsap.to(canvas, { x: nx * 7, y: ny * 6, duration: 0.9, ease: "power2.out", overwrite: "auto" });
    }

    window.addEventListener("deviceorientation", function (e) {
      if (e.gamma == null || e.beta == null) return;
      apply(Math.max(-1, Math.min(1, e.gamma / 40)), Math.max(-1, Math.min(1, (e.beta - 45) / 40)));
    });
    window.addEventListener("pointermove", function (e) {
      apply((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    });
  }

  /* ---------- Init ---------- */

  function ambientSway() {
    q(document, ".leaf").forEach(function (el, i) {
      gsap.to(el, {
        rotation: i % 2 ? 4 : -4,
        transformOrigin: "50% 100%",
        duration: 3.5 + i * 0.9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
  }

  function init() {
    ambientSway();
    function boot() { prepare(); buildScroll(); }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(boot);
      // jaga-jaga bila fonts.ready menggantung
      setTimeout(function () { if (!ready) boot(); }, 2500);
    } else {
      boot();
    }
  }

  return {
    init: init,
    openCover: openCover,
    flipDigit: flipDigit,
    initTilt: initTilt,
    refresh: function () { ScrollTrigger.refresh(); },
  };
})();
