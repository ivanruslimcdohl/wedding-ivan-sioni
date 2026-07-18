/* ============================================================
   WeddingFX — mesin animasi sinematik (GSAP)
   Dipakai oleh main.js. Jika GSAP gagal dimuat, main.js
   otomatis jatuh ke animasi CSS sederhana.
   ============================================================ */

window.WeddingFX = (function () {
  "use strict";
  if (!window.gsap) return null;

  var hasSplit = !!window.SplitText;
  if (hasSplit) gsap.registerPlugin(SplitText);

  var splits = { heroName: null, heroDate: null, closingName: null };
  var ready = false;
  var activeTl = null;
  var persist = []; // tween ambient per-slide (Ken Burns, pulse) — dibunuh saat pindah slide

  /* ---------- Util ---------- */

  function q(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  function killPersist() {
    persist.forEach(function (t) { t.kill(); });
    persist = [];
  }

  function circleLen(c) {
    return 2 * Math.PI * parseFloat(c.getAttribute("r"));
  }

  // Gambar-sendiri lingkaran monogram + pop teksnya
  function monoDraw(tl, slide, at) {
    q(slide, ".monogram-svg circle").forEach(function (c, i) {
      var len = circleLen(c);
      gsap.set(c, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(c, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, at + i * 0.15);
    });
    tl.from(q(slide, ".mono-text"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.8, ease: "back.out(2)" }, at + 0.55);
  }

  function divider(tl, slide, at) {
    tl.from(q(slide, ".gold-divider"), { scaleX: 0, opacity: 0, duration: 0.7, ease: "power3.out" }, at);
  }

  function titleIn(tl, slide, at) {
    tl.from(q(slide, ".section-title"), { y: -34, opacity: 0, duration: 0.8, ease: "power3.out" }, at);
    divider(tl, slide, at + 0.15);
  }

  /* ---------- Persiapan (split teks setelah font siap) ---------- */

  function prepare() {
    if (!hasSplit) { ready = true; return; }
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
    ready = true;
  }

  /* ---------- Timeline per slide ---------- */

  var builders = {
    // 0 — HERO: nama naik per kata, monogram menggambar diri, tanggal roll
    0: function (tl, slide) {
      monoDraw(tl, slide, 0);
      tl.from(q(slide, ".eyebrow"), { opacity: 0, letterSpacing: "0.7em", duration: 1, ease: "power2.out" }, 0.35);
      var nameTargets = (splits.heroName && splits.heroName.words.length) ? splits.heroName.words : q(slide, ".script-name");
      tl.from(nameTargets, { yPercent: 130, opacity: 0, rotation: 6, duration: 1.1, stagger: 0.14, ease: "back.out(1.7)" }, 0.55);
      divider(tl, slide, 1.1);
      var dateTargets = (splits.heroDate && splits.heroDate.chars.length) ? splits.heroDate.chars : q(slide, ".hero-date");
      tl.from(dateTargets, { yPercent: 110, duration: 0.7, stagger: 0.045, ease: "power3.out" }, 1.2);
      tl.from(q(slide, ".quote"), { opacity: 0, y: 24, duration: 0.9, ease: "power2.out" }, 1.55);
      tl.from(q(slide, ".swipe-hint"), { opacity: 0, duration: 0.8 }, 1.9);
    },

    // 1 — MEMPELAI: foto reveal lingkaran + ring berputar, nama masuk miring
    1: function (tl, slide) {
      tl.from(q(slide, ".eyebrow"), { opacity: 0, y: -18, duration: 0.6, ease: "power2.out" }, 0);
      tl.from(q(slide, ".section-intro"), { opacity: 0, y: 18, duration: 0.7, ease: "power2.out" }, 0.15);
      q(slide, ".person").forEach(function (person, i) {
        var at = 0.35 + i * 0.5;
        var ring = person.querySelector(".photo-ring");
        var img = person.querySelector("img");
        tl.fromTo(ring,
          { clipPath: "circle(0% at 50% 50%)", rotation: -150 },
          { clipPath: "circle(75% at 50% 50%)", rotation: 0, duration: 1.1, ease: "power3.out" }, at);
        tl.from(img, { rotation: 150, scale: 1.25, duration: 1.1, ease: "power3.out" }, at);
        tl.from(person.querySelector(".person-name"), { x: i % 2 ? 46 : -46, skewX: i % 2 ? 8 : -8, opacity: 0, duration: 0.7, ease: "power3.out" }, at + 0.45);
        tl.from(person.querySelector(".person-parents"), { opacity: 0, y: 14, duration: 0.6 }, at + 0.6);
      });
      tl.from(q(slide, ".script-amp"), { scale: 0, opacity: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" }, 0.95);
    },

    // 2 — ACARA: kartu flip 3D dari atas, isi cascade, pin drop
    2: function (tl, slide) {
      titleIn(tl, slide, 0);
      q(slide, ".event-card").forEach(function (card, i) {
        var at = 0.35 + i * 0.3;
        tl.from(card, {
          rotationX: -80, y: 46, opacity: 0, transformOrigin: "50% 0%",
          transformPerspective: 900, duration: 1, ease: "power3.out",
        }, at);
        tl.from(q(card, ".event-name, .event-date, .event-time, .event-venue, .event-address"), {
          opacity: 0, y: 14, duration: 0.45, stagger: 0.06, ease: "power2.out",
        }, at + 0.35);
        tl.from(card.querySelector(".btn-outline"), { opacity: 0, scale: 0.7, duration: 0.5, ease: "back.out(2)" }, at + 0.6);
        tl.from(card.querySelector(".pin-icon"), { y: -16, duration: 0.6, ease: "bounce.out" }, at + 0.75);
      });
    },

    // 3 — COUNTDOWN: kotak jatuh membal, tombol glow pulse
    3: function (tl, slide) {
      titleIn(tl, slide, 0);
      tl.from(q(slide, ".section-intro"), { opacity: 0, y: 16, duration: 0.6 }, 0.25);
      tl.from(q(slide, ".count-box"), { y: -100, opacity: 0, duration: 0.9, stagger: 0.11, ease: "bounce.out" }, 0.4);
      var btn = slide.querySelector(".btn-gold");
      if (btn) {
        tl.from(btn, { scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(2.2)" }, 1.1);
        persist.push(gsap.to(btn, {
          boxShadow: "0 4px 34px rgba(212,175,55,0.75)", duration: 1.3,
          repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.9,
        }));
      }
    },

    // 4 — GALERI: tile wipe bergantian arah + Ken Burns pelan
    4: function (tl, slide) {
      titleIn(tl, slide, 0);
      var imgs = q(slide, ".gallery-grid img");
      gsap.set(imgs, { scale: 1, xPercent: 0, yPercent: 0 });
      imgs.forEach(function (img, i) {
        tl.fromTo(img,
          { clipPath: i % 2 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", scale: 1.18 },
          { clipPath: "inset(0 0% 0 0%)", scale: 1, duration: 0.85, ease: "power3.inOut" },
          0.3 + i * 0.12);
        img.style.transformOrigin = i % 2 ? "30% 60%" : "70% 40%";
      });
      persist.push(gsap.to(imgs, {
        scale: 1.07, duration: 7, ease: "sine.inOut",
        yoyo: true, repeat: -1, stagger: { each: 0.5 }, delay: 1.4,
      }));
    },

    // 5 — RSVP: field masuk zig-zag, ucapan float-in
    5: function (tl, slide) {
      titleIn(tl, slide, 0);
      var fields = q(slide, ".rsvp-form > *");
      fields.forEach(function (f, i) {
        tl.from(f, { x: i % 2 ? 64 : -64, opacity: 0, duration: 0.6, ease: "power3.out" }, 0.3 + i * 0.09);
      });
      var wishes = q(slide, ".wish").slice(0, 8);
      if (wishes.length) tl.from(wishes, { y: 30, opacity: 0, duration: 0.55, stagger: 0.07, ease: "power2.out" }, 0.7);
      tl.from(slide.querySelector(".wishes"), { opacity: 0, duration: 0.5 }, 0.65);
    },

    // 6 — AMPLOP: kartu flip masuk seperti kartu kredit (sheen via CSS)
    6: function (tl, slide) {
      titleIn(tl, slide, 0);
      tl.from(q(slide, ".section-intro"), { opacity: 0, y: 16, duration: 0.6 }, 0.25);
      tl.from(q(slide, ".gift-card"), {
        rotationY: -100, x: -40, opacity: 0, transformOrigin: "0% 50%",
        transformPerspective: 1000, duration: 1, stagger: 0.18, ease: "power3.out",
      }, 0.4);
    },

    // 7 — PENUTUP: monogram menggambar diri + burst emas
    7: function (tl, slide) {
      monoDraw(tl, slide, 0);
      tl.add(function () {
        if (window.WeddingParticles) {
          window.WeddingParticles.burst(window.innerWidth / 2, window.innerHeight * 0.32);
        }
      }, 0.6);
      tl.from(q(slide, ".section-intro"), { opacity: 0, y: 20, duration: 0.7 }, 0.5);
      tl.from(q(slide, ".eyebrow, .closing-sign"), { opacity: 0, y: 14, duration: 0.6, stagger: 0.12 }, 0.85);
      var nameTargets = (splits.closingName && splits.closingName.words.length) ? splits.closingName.words : q(slide, ".script-name");
      tl.from(nameTargets, { yPercent: 120, opacity: 0, duration: 1, stagger: 0.13, ease: "back.out(1.7)" }, 1.05);
      divider(tl, slide, 1.5);
      tl.from(q(slide, ".credit"), { opacity: 0, duration: 0.8 }, 1.7);
    },
  };

  function play(index) {
    if (!ready) return;
    var slide = document.querySelectorAll("#main-swiper .swiper-slide")[index];
    if (!slide || !builders[index]) return;

    killPersist();
    if (activeTl) activeTl.progress(1).kill(); // selesaikan dulu agar .from() berikutnya bersih

    activeTl = gsap.timeline();
    builders[index](activeTl, slide);
  }

  /* ---------- Opening sinematik (tirai emas) ---------- */

  function openCover(onDone) {
    var cover = document.getElementById("cover");
    var tl = gsap.timeline({
      onComplete: function () {
        cover.style.display = "none";
        if (onDone) onDone();
      },
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
    // Hero mulai masuk tepat saat tirai membelah, bukan setelahnya
    tl.add(function () { play(0); }, 0.95);
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
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(prepare);
      // jaga-jaga bila fonts.ready menggantung
      setTimeout(function () { if (!ready) prepare(); }, 2500);
    } else {
      prepare();
    }
  }

  return {
    init: init,
    play: play,
    openCover: openCover,
    flipDigit: flipDigit,
    initTilt: initTilt,
  };
})();
