/* ============================================================
   WeddingFX — mesin animasi scene-stack (GSAP + ScrollTrigger)
   Tiap section = "scene": panel sticky terkunci di layar selagi
   scroll memainkan timeline-nya (scrub, bolak-balik mengikuti
   jari), lalu scene berikutnya menggeser naik menutupinya.
   Jika GSAP gagal dimuat, main.js jatuh ke fallback CSS.
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

  /* Semua tween scrub memakai fromTo eksplisit (kedua ujung ditulis,
     tidak ada perekaman nilai otomatis yang bisa meleset saat refresh).
     F  : tersembunyi → normal (build-in). immediateRender agar elemen
          tersembunyi sejak build, tidak berkedip sebelum discroll.
     T  : normal → keluar (build-out). immediateRender false agar tidak
          menimpa state saat build; render pertama terjadi saat discroll. */

  var NEUTRAL = {
    x: 0, y: 0, xPercent: 0, yPercent: 0, opacity: 1,
    scale: 1, scaleX: 1, scaleY: 1,
    rotation: 0, rotationX: 0, rotationY: 0, skewX: 0, skewY: 0,
  };
  var CONFIG_KEYS = { duration: 1, ease: 1, stagger: 1 };

  function splitVars(vars, immediate, invert) {
    var from = {}, to = { immediateRender: immediate };
    for (var k in vars) {
      if (CONFIG_KEYS[k]) {
        to[k] = vars[k];
      } else if (k === "transformOrigin" || k === "transformPerspective") {
        from[k] = vars[k];
        to[k] = vars[k];
      } else if (invert) { // T: dari netral menuju nilai vars
        from[k] = NEUTRAL.hasOwnProperty(k) ? NEUTRAL[k] : 0;
        to[k] = vars[k];
      } else { // F: dari nilai vars menuju netral
        from[k] = vars[k];
        to[k] = NEUTRAL.hasOwnProperty(k) ? NEUTRAL[k] : vars[k];
      }
    }
    return { from: from, to: to };
  }

  function F(tl, targets, vars, pos) {
    if (!targets || (targets.length !== undefined && !targets.length)) return;
    var v = splitVars(vars, true, false);
    tl.fromTo(targets, v.from, v.to, pos);
  }

  function T(tl, targets, vars, pos) {
    if (!targets || (targets.length !== undefined && !targets.length)) return;
    var v = splitVars(vars, false, true);
    tl.fromTo(targets, v.from, v.to, pos);
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
          ch.style.display = "inline-block";
        });
      } catch (e) { /* font/split gagal → pakai elemen utuh */ }
    }
    ready = true;
  }

  /* ---------- Fase MASUK: scene menggeser naik menutupi panel lama ----------
     Rentang: scene top dari dasar layar → puncak layar. Ringan saja
     (judul/pembuka); choreography utama main di fase pinned. */

  function titleIn(tl, panel) {
    F(tl, q(panel, ".section-title"), { y: 60, opacity: 0, duration: 0.35 }, 0.25);
    F(tl, q(panel, ".gold-divider"), { scaleX: 0, opacity: 0, duration: 0.3 }, 0.4);
  }

  var slideIn = {
    1: function (tl, panel) {
      F(tl, q(panel, ".eyebrow"), { y: 50, opacity: 0, duration: 0.35 }, 0.25);
      F(tl, q(panel, ".section-intro"), { y: 60, opacity: 0, duration: 0.4 }, 0.4);
    },
    2: function (tl, panel) { titleIn(tl, panel); },
    3: function (tl, panel) {
      titleIn(tl, panel);
      F(tl, q(panel, ".section-intro"), { y: 40, opacity: 0, duration: 0.3 }, 0.5);
    },
    4: function (tl, panel) {
      titleIn(tl, panel);
      F(tl, q(panel, ".gallery-viewport"), { y: 80, opacity: 0, duration: 0.4 }, 0.45);
      F(tl, q(panel, ".gallery-counter"), { opacity: 0, duration: 0.3 }, 0.6);
    },
    // RSVP (non-sticky): seluruh build terjadi saat naik
    5: function (tl, panel) {
      titleIn(tl, panel);
      q(panel, ".rsvp-form > *").forEach(function (f, i) {
        F(tl, [f], { x: i % 2 ? 80 : -80, opacity: 0, duration: 0.3 }, 0.35 + i * 0.08);
      });
      F(tl, [panel.querySelector(".wishes")], { y: 70, opacity: 0, duration: 0.3 }, 0.7);
    },
    6: function (tl, panel) {
      titleIn(tl, panel);
      F(tl, q(panel, ".section-intro"), { y: 40, opacity: 0, duration: 0.3 }, 0.5);
    },
    7: function (tl, panel) {
      F(tl, q(panel, ".section-intro"), { y: 50, opacity: 0, duration: 0.35 }, 0.3);
      F(tl, q(panel, ".eyebrow, .closing-sign"), { y: 30, opacity: 0, duration: 0.3, stagger: 0.08 }, 0.5);
    },
  };

  /* ---------- Fase PINNED: panel terkunci, scroll = timeline ---------- */

  var pinned = {
    // 0 — HERO zoom-through: kamera "menembus" monogram, teks berpencar
    0: function (tl, panel) {
      T(tl, q(panel, ".swipe-hint"), { opacity: 0, y: 40, duration: 0.12, ease: "none" }, 0);
      T(tl, q(panel, ".monogram-svg"), { scale: 6, opacity: 0, transformOrigin: "50% 50%", duration: 0.55, ease: "power2.in" }, 0.05);
      T(tl, q(panel, ".eyebrow"), { opacity: 0, y: -40, duration: 0.3, ease: "power1.in" }, 0.1);
      var words = (splits.heroName && splits.heroName.words.length) ? splits.heroName.words : q(panel, ".script-name");
      T(tl, words, {
        y: function (i) { return -(120 + i * 70); },
        opacity: 0, duration: 0.5, stagger: 0.06, ease: "power1.in",
      }, 0.22);
      T(tl, q(panel, ".gold-divider"), { scaleX: 0, opacity: 0, duration: 0.3, ease: "power1.in" }, 0.3);
      var chars = (splits.heroDate && splits.heroDate.chars.length) ? splits.heroDate.chars : q(panel, ".hero-date");
      T(tl, chars, {
        y: function (i) { return -(30 + (i % 4) * 26); },
        opacity: 0, duration: 0.4, stagger: 0.02, ease: "power1.in",
      }, 0.35);
      T(tl, q(panel, ".quote"), { y: -60, opacity: 0, duration: 0.4, ease: "power1.in" }, 0.42);
      tl.to({}, { duration: 0.18 }); // hening sejenak sebelum ditutup scene berikut
    },

    // 1 — MEMPELAI: cerita berurutan — pria, "&", wanita
    1: function (tl, panel) {
      var persons = q(panel, ".person");
      persons.forEach(function (p, i) {
        var at = i * 0.48;
        tl.fromTo(p.querySelector(".photo-ring"),
          { clipPath: "circle(0% at 50% 50%)", rotation: -120 },
          { clipPath: "circle(75% at 50% 50%)", rotation: 0, duration: 0.3, ease: "power2.out", immediateRender: true }, at);
        tl.fromTo(p.querySelector("img"),
          { rotation: 120, scale: 1.35 },
          { rotation: 0, scale: 1, duration: 0.3, ease: "power2.out", immediateRender: true }, at);
        F(tl, [p.querySelector(".person-name")], { x: i % 2 ? 70 : -70, skewX: i % 2 ? 10 : -10, opacity: 0, duration: 0.18, ease: "power2.out" }, at + 0.14);
        F(tl, [p.querySelector(".person-parents")], { y: 26, opacity: 0, duration: 0.16, ease: "power2.out" }, at + 0.22);
      });
      F(tl, q(panel, ".script-amp"), { scale: 0, rotation: 220, opacity: 0, duration: 0.2, ease: "back.out(2)" }, 0.36);
      tl.to({}, { duration: 0.1 });
    },

    // 2 — ACARA: kartu Holy Matrimony dulu, lalu Resepsi
    2: function (tl, panel) {
      q(panel, ".event-card").forEach(function (card, i) {
        var at = i * 0.42;
        F(tl, [card], {
          rotationX: 70, y: 140, opacity: 0, transformOrigin: "50% 0%",
          transformPerspective: 900, duration: 0.28, ease: "power2.out",
        }, at);
        F(tl, q(card, ".event-name, .event-date, .event-time, .event-venue, .event-address"),
          { y: 24, opacity: 0, duration: 0.14, stagger: 0.025, ease: "power2.out" }, at + 0.12);
        F(tl, [card.querySelector(".btn-outline")], { scale: 0.6, opacity: 0, duration: 0.12, ease: "back.out(2)" }, at + 0.2);
      });
      tl.to({}, { duration: 0.16 });
    },

    // 3 — COUNTDOWN: kotak jatuh satu-satu dengan puntiran, tombol pop
    3: function (tl, panel) {
      q(panel, ".count-box").forEach(function (box, i) {
        F(tl, [box], {
          y: -140, opacity: 0, rotation: i % 2 ? 9 : -9,
          duration: 0.2, ease: "back.out(1.6)",
        }, i * 0.14);
      });
      F(tl, q(panel, ".btn-gold"), { scale: 0.5, opacity: 0, duration: 0.2, ease: "back.out(2)" }, 0.62);
      tl.to({}, { duration: 0.18 });
    },

    // 4 — GALERI: filmstrip horizontal digerakkan scroll + foto tengah membesar
    4: function (tl, panel) {
      var strip = panel.querySelector(".gallery-strip");
      var viewport = panel.querySelector(".gallery-viewport");
      var counter = panel.querySelector(".gallery-counter");
      var frames = q(panel, ".gframe");
      if (!strip || !frames.length) return;

      tl.fromTo(strip, { x: 0 }, {
        x: function () { return -Math.max(0, strip.scrollWidth - viewport.clientWidth); },
        duration: 1, ease: "none", immediateRender: false,
      }, 0);

      tl.eventCallback("onUpdate", function () {
        var n = frames.length;
        if (counter) {
          var idx = Math.min(n, Math.max(1, Math.round(tl.progress() * (n - 1)) + 1));
          counter.textContent = idx + " / " + n;
        }
        var cx = window.innerWidth / 2;
        frames.forEach(function (f) {
          var r = f.getBoundingClientRect();
          var d = Math.abs(r.left + r.width / 2 - cx) / window.innerWidth;
          gsap.set(f, { scale: Math.max(0.92, 1.06 - d * 0.28) });
        });
      });
    },

    // 6 — AMPLOP: kartu rekening membuka bergantian seperti pintu emas
    6: function (tl, panel) {
      q(panel, ".gift-card").forEach(function (card, i) {
        F(tl, [card], {
          rotationY: -85, x: -60, opacity: 0, transformOrigin: "0% 50%",
          transformPerspective: 1000, duration: 0.3, ease: "power2.out",
        }, i * 0.35);
      });
      tl.to({}, { duration: 0.2 });
    },

    // 7 — PENUTUP: monogram menggambar diri mengikuti scroll, nama naik
    7: function (tl, panel) {
      q(panel, ".monogram-svg circle").forEach(function (c, i) {
        var len = circleLen(c);
        tl.fromTo(c,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 0.4, ease: "none", immediateRender: true }, i * 0.05);
      });
      F(tl, q(panel, ".mono-text"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.2, ease: "back.out(2)" }, 0.2);
      var nameTargets = (splits.closingName && splits.closingName.words.length) ? splits.closingName.words : q(panel, ".script-name");
      F(tl, nameTargets, { yPercent: 130, opacity: 0, duration: 0.25, stagger: 0.07, ease: "back.out(1.6)" }, 0.35);
      F(tl, q(panel, ".gold-divider"), { scaleX: 0, opacity: 0, duration: 0.15 }, 0.55);
      F(tl, q(panel, ".credit"), { opacity: 0, duration: 0.15 }, 0.65);
      tl.to({}, { duration: 0.25 }); // hold penutup
    },
  };

  /* ---------- Build semua trigger ---------- */

  function buildScroll() {
    if (built) return;
    built = true;

    var scenes = q(document, ".story .scene");

    scenes.forEach(function (scene, i) {
      var panel = scene.querySelector(".panel");

      // Kata dekoratif raksasa melayang sepanjang scene (parallax dalam)
      var decor = panel.querySelector(".slide-decor");
      if (decor) {
        gsap.fromTo(decor, { y: "26vh" }, {
          y: "-40vh", ease: "none",
          scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: true },
        });
      }

      // Fase masuk
      if (slideIn[i]) {
        slideIn[i](gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: scene, start: "top bottom", end: "top top", scrub: 0.4 },
        }), panel);
      }

      // Fase pinned (hold berakhir saat scene berikutnya mulai menutup)
      if (pinned[i]) {
        var endPos = i === scenes.length - 1 ? "bottom bottom" : "bottom 200%";
        pinned[i](gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: scene, start: "top top", end: endPos,
            scrub: 0.4, invalidateOnRefresh: true,
          },
        }), panel);
      }

      // Fase ditinggalkan: panel lama tenggelam saat scene ini menutupinya
      if (i > 0) {
        var prevPanel = scenes[i - 1].querySelector(".panel");
        var prevInner = prevPanel.querySelector(".slide-inner");
        var lt = gsap.timeline({
          scrollTrigger: { trigger: scene, start: "top bottom", end: "top top", scrub: 0.3 },
        });
        lt.fromTo(prevInner, { scale: 1, yPercent: 0 },
          { scale: 0.9, yPercent: -5, ease: "none", immediateRender: false }, 0);
        lt.fromTo(prevPanel, { "--dim": 0 },
          { "--dim": 0.55, ease: "none", immediateRender: false }, 0);
      }
    });
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
    tl.from(dateTargets, { opacity: 0, yPercent: 110, duration: 0.7, stagger: 0.045, ease: "power3.out" }, 1.2);
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
