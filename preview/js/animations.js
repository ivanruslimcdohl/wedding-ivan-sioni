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
  // URL bar mobile muncul/hilang memicu resize → refresh yang membuat
  // posisi scrub melompat di tengah scroll; abaikan resize semacam itu
  ScrollTrigger.config({ ignoreMobileResize: true });
  var hasSplit = !!window.SplitText;
  if (hasSplit) gsap.registerPlugin(SplitText);

  var splits = { heroName: null, heroDate: null, closingName: null };
  var ready = false;
  var built = false;
  var introTl = null; // timeline heroIntro — dimatikan saat user mulai scroll

  /* ---------- Util ---------- */

  function q(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  function circleLen(c) {
    return 2 * Math.PI * parseFloat(c.getAttribute("r"));
  }

  // Panjang goresan SVG diukur langsung (pathLength attr tidak konsisten
  // antar versi WebKit — bisa tampak sebagai garis putus-putus)
  function strokeLen(el) {
    try { return el.getTotalLength(); } catch (e) { return 0; }
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
    // Dengan stagger, immediateRender hanya merender target PERTAMA saat
    // build — sisanya bocor terlihat sebelum waktunya. Set manual semuanya.
    if (v.to.stagger) gsap.set(targets, v.from);
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
        splits.closingName = new SplitText(".finale-names .script-name", { type: "words" });
        splits.heroDate = new SplitText("#hero-date", { type: "chars" });
        splits.personNames = new SplitText(".slide-couple .person-name", { type: "chars" });
        splits.eventDates = new SplitText(".slide-event .event-date", { type: "chars" });
        // inline-block agar transform per karakter bekerja
        [].concat(splits.heroDate.chars, splits.personNames.chars, splits.eventDates.chars)
          .forEach(function (ch) { ch.style.display = "inline-block"; });
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
    // 7 (penutup): TANPA fase masuk — panel memasuki nightfall dalam
    // gelap total; seluruh konten dimunculkan timeline finale (pinned[7])
  };

  /* ---------- Fase PINNED: panel terkunci, scroll = timeline ---------- */

  var pinned = {
    // 0 — HERO zoom-through: kamera "menembus" monogram, teks berpencar
    0: function (tl, panel) {
      T(tl, q(panel, ".swipe-hint"), { opacity: 0, y: 40, duration: 0.12, ease: "none" }, 0);
      T(tl, q(panel, ".monogram-svg"), { scale: 6, rotation: 10, opacity: 0, transformOrigin: "50% 50%", duration: 0.55, ease: "power2.in" }, 0.05);
      // Cahaya emas mengembang menjual efek kamera mendorong maju
      var glow = panel.querySelector(".hero-glow");
      if (glow) {
        tl.fromTo(glow, { scale: 0.6, opacity: 0 },
          { scale: 1.4, opacity: 0.55, duration: 0.28, ease: "power1.in", immediateRender: false }, 0.08);
        tl.to(glow, { scale: 1.9, opacity: 0, duration: 0.3, ease: "power1.out" }, 0.36);
      }
      // Percikan emas tepat saat "menembus" cincin monogram
      tl.add(function () {
        onceFx("hero-ring", function () {
          if (window.WeddingParticles) {
            window.WeddingParticles.burst(window.innerWidth / 2, window.innerHeight * 0.42, 18, { speed: 1.4 });
          }
        });
      }, 0.3);
      // (letterSpacing sengaja TIDAK di-scrub — memicu reflow tiap frame)
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

    // 1 — MEMPELAI: cerita berurutan — pria, "&", wanita.
    // Nama merakit diri huruf demi huruf; titik emas menelusuri cincin foto
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
        // Titik emas menutup lintasan cincin bersamaan clip membuka
        var orbit = p.querySelector(".orbit");
        if (orbit) {
          tl.fromTo(orbit, { rotation: -260, opacity: 1 },
            { rotation: 0, opacity: 1, duration: 0.3, ease: "power2.out", immediateRender: true }, at);
          tl.to(orbit, { opacity: 0, duration: 0.08 }, at + 0.3);
        }
        // Nama merakit diri: huruf berkumpul dari kiri-kanan bergantian
        var nameEl = p.querySelector(".person-name");
        var chars = (splits.personNames && splits.personNames.chars.length)
          ? splits.personNames.chars.filter(function (ch) { return nameEl.contains(ch); })
          : null;
        if (chars && chars.length) {
          F(tl, chars, {
            x: function (ci) { return ci % 2 ? 34 : -34; },
            opacity: 0, duration: 0.16, stagger: 0.012, ease: "power2.out",
          }, at + 0.14);
        } else {
          F(tl, [nameEl], { x: i % 2 ? 70 : -70, skewX: i % 2 ? 10 : -10, opacity: 0, duration: 0.18, ease: "power2.out" }, at + 0.14);
        }
        F(tl, [p.querySelector(".person-parents")], { y: 26, opacity: 0, duration: 0.16, ease: "power2.out" }, at + 0.22);
      });
      F(tl, q(panel, ".script-amp"), { scale: 0, rotation: 220, opacity: 0, duration: 0.2, ease: "back.out(2)" }, 0.36);
      // "&" bernafas pelan di ekor timeline saat scroll santai
      var amp = panel.querySelector(".script-amp");
      if (amp) {
        tl.to(amp, { scale: 1.14, duration: 0.12, ease: "sine.inOut" }, 0.78);
        tl.to(amp, { scale: 1, duration: 0.14, ease: "sine.inOut" }, 0.9);
      }
      tl.to({}, { duration: 0.1 });
    },

    // 2 — ACARA: kartu Holy Matrimony dulu, lalu Resepsi.
    // Garis emas menggambar keliling kartu; tanggal flip ala papan bandara
    2: function (tl, panel) {
      q(panel, ".event-card").forEach(function (card, i) {
        var at = i * 0.42;
        F(tl, [card], {
          rotationX: 70, y: 140, opacity: 0, transformOrigin: "50% 0%",
          transformPerspective: 900, duration: 0.28, ease: "power2.out",
        }, at);
        // Bingkai emas menggambar dirinya setelah kartu mendarat
        var trace = card.querySelector(".card-trace rect");
        var traceLen = trace ? strokeLen(trace) : 0;
        if (traceLen) {
          tl.fromTo(trace, { strokeDasharray: traceLen, strokeDashoffset: traceLen },
            { strokeDashoffset: 0, duration: 0.24, ease: "none", immediateRender: true }, at + 0.12);
        }
        F(tl, q(card, ".event-name, .event-time, .event-venue, .event-address"),
          { y: 24, opacity: 0, duration: 0.14, stagger: 0.025, ease: "power2.out" }, at + 0.12);
        // Tanggal: karakter membalik seperti papan keberangkatan
        var dateEl = card.querySelector(".event-date");
        var dchars = (splits.eventDates && splits.eventDates.chars.length)
          ? splits.eventDates.chars.filter(function (ch) { return dateEl.contains(ch); })
          : q(card, ".event-date");
        F(tl, dchars, {
          rotationX: -90, opacity: 0, transformPerspective: 500,
          duration: 0.16, stagger: 0.012, ease: "power2.out",
        }, at + 0.14);
        F(tl, [card.querySelector(".btn-outline")], { scale: 0.6, opacity: 0, duration: 0.12, ease: "back.out(2)" }, at + 0.2);
      });
      // Benang emas menghubungkan kedua acara
      var thread = panel.querySelector(".event-thread");
      if (thread) {
        F(tl, [thread], { scaleY: 0, opacity: 0, transformOrigin: "50% 0%", duration: 0.14, ease: "none" }, 0.32);
      }
      tl.to({}, { duration: 0.16 });
    },

    // 3 — COUNTDOWN: angka hari raksasa parallax di kedalaman, kotak
    // merakit diri berputar 3D, denyut cincin waktu, tombol pop
    3: function (tl, panel) {
      var ghost = panel.querySelector(".count-ghost");
      if (ghost) {
        tl.fromTo(ghost, { y: "12vh", scale: 1.15 },
          { y: "-18vh", scale: 1, ease: "none", immediateRender: true, duration: 1 }, 0);
      }
      q(panel, ".time-rings i").forEach(function (ring, i) {
        tl.fromTo(ring, { scale: 0.8, opacity: 0.2 },
          { scale: 1.3, opacity: 0, ease: "none", immediateRender: true, duration: 0.5 }, 0.08 + i * 0.28);
      });
      q(panel, ".count-box").forEach(function (box, i) {
        F(tl, [box], {
          rotationY: i % 2 ? 90 : -90, x: i % 2 ? 44 : -44, opacity: 0,
          transformPerspective: 600, duration: 0.2, ease: "back.out(1.4)",
        }, i * 0.14);
      });
      F(tl, q(panel, ".btn-gold"), { scale: 0.5, opacity: 0, duration: 0.2, ease: "back.out(2)" }, 0.62);
      tl.add(function () {
        onceFx("countdown-btn", function () {
          var btn = panel.querySelector(".btn-gold");
          if (btn && window.WeddingParticles) {
            var r = btn.getBoundingClientRect();
            window.WeddingParticles.burst(r.left + r.width / 2, r.top + r.height / 2, 10, { up: true, speed: 0.7 });
          }
        });
      }, 0.8);
      tl.to({}, { duration: 0.18 });
    },

    // 4 — GALERI: filmstrip cover-flow digerakkan scroll, foto tengah
    // membesar + menghadap kamera. Layout diukur sekali per refresh;
    // onUpdate murni aritmetika + quickSetter (nol layout read per frame).
    4: function (tl, panel) {
      var strip = panel.querySelector(".gallery-strip");
      var viewport = panel.querySelector(".gallery-viewport");
      var counter = panel.querySelector(".gallery-counter");
      var frames = q(panel, ".gframe");
      if (!strip || !frames.length) return;

      var m = { w: 0, gap: 0, pad: 0, cx: 0, vw: 1, max: 0 };
      var setters = frames.map(function (f) {
        return {
          scale: gsap.quickSetter(f, "scale"),
          rotY: gsap.quickSetter(f, "rotationY", "deg"),
        };
      });
      function measure() {
        var s = getComputedStyle(strip);
        m.w = frames[0].offsetWidth;
        m.gap = parseFloat(s.columnGap || s.gap) || 0;
        m.pad = parseFloat(s.paddingLeft) || 0;
        m.vw = Math.max(1, viewport.clientWidth);
        m.cx = m.vw / 2;
        m.max = Math.max(0, strip.scrollWidth - m.vw);
      }
      measure();
      ScrollTrigger.addEventListener("refreshInit", measure);

      tl.fromTo(strip, { x: 0 }, {
        x: function () { return -m.max; },
        duration: 1, ease: "none", immediateRender: false,
      }, 0);

      var lastIdx = 0;
      tl.eventCallback("onUpdate", function () {
        var n = frames.length;
        var x = -tl.progress() * m.max;
        if (counter) {
          var idx = Math.min(n, Math.max(1, Math.round(tl.progress() * (n - 1)) + 1));
          if (idx !== lastIdx) { lastIdx = idx; flipDigit(counter, idx + " / " + n); }
        }
        for (var i = 0; i < n; i++) {
          var off = m.pad + i * (m.w + m.gap) + m.w / 2 + x - m.cx;
          var d = Math.abs(off) / m.vw;
          setters[i].scale(Math.max(0.92, 1.06 - d * 0.28));
          setters[i].rotY((off < 0 ? 1 : -1) * Math.min(14, d * 36));
        }
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
      // Koin emas berhamburan saat pintu terakhir selesai terbuka
      tl.add(function () {
        onceFx("gift-coins", function () {
          if (!window.WeddingParticles) return;
          q(panel, ".gift-card").forEach(function (card) {
            var r = card.getBoundingClientRect();
            window.WeddingParticles.burst(r.left + r.width / 2, r.top + r.height / 2, 10, { shape: "coin", up: true });
          });
        });
      }, 0.72);
      tl.to({}, { duration: 0.2 });
    },

    // 7 — PENUTUP "Langit Berbintang" (≈400svh scroll): gelap total →
    // bintang bermunculan → tersambung jadi rasi hati + monogram →
    // kembang api emas + nama menyala → ucapan terima kasih
    7: function (tl, panel) {
      var sky = panel.querySelector(".finale-sky");
      var decor = panel.querySelector(".slide-decor");

      // A (0–0.12) GELAP: dunia padam, hanya bara partikel tersisa
      if (decor) tl.fromTo(decor, { opacity: 0.07 }, { opacity: 0, ease: "none", immediateRender: false, duration: 0.08 }, 0);
      tl.fromTo(panel.querySelector(".night-veil"), { opacity: 0 },
        { opacity: 1, ease: "none", immediateRender: false, duration: 0.12 }, 0);

      // B (0.10–0.28) BINTANG: dua layer + drift paralaks; kelip via class
      tl.fromTo(panel.querySelector(".stars-a"), { opacity: 0, y: 24 },
        { opacity: 1, y: -10, ease: "none", immediateRender: false, duration: 0.18 }, 0.1);
      tl.fromTo(panel.querySelector(".stars-b"), { opacity: 0, y: 40 },
        { opacity: 0.8, y: -22, ease: "none", immediateRender: false, duration: 0.18 }, 0.12);
      var lastTw = false;
      tl.eventCallback("onUpdate", function () {
        var tw = tl.progress() > 0.18;
        if (tw !== lastTw && sky) { lastTw = tw; sky.classList.toggle("twinkling", tw); }
      });

      // C (0.26–0.52) RASI: bintang pop berurutan, garis hati menggambar
      // dirinya menyambungkan mereka, monogram menyala di tengahnya
      F(tl, q(panel, ".c-star"), { scale: 0, opacity: 0, transformOrigin: "50% 50%", duration: 0.1, stagger: 0.015, ease: "back.out(2)" }, 0.26);
      var heart = panel.querySelector(".c-heart");
      var heartLen = heart ? strokeLen(heart) : 0;
      if (heartLen) {
        tl.fromTo(heart, { strokeDasharray: heartLen, strokeDashoffset: heartLen },
          { strokeDashoffset: 0, ease: "none", immediateRender: true, duration: 0.16 }, 0.35);
      }
      q(panel, ".c-ring").forEach(function (c, i) {
        var len = circleLen(c);
        tl.fromTo(c, { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, ease: "none", immediateRender: true, duration: 0.08 }, 0.44 + i * 0.02);
      });
      F(tl, q(panel, ".c-mono"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.06, ease: "back.out(2)" }, 0.48);

      // D (0.50–0.75) KEMBANG API + NAMA: canvas partikel pulih dari
      // nightfall, ledakan emas, nama membara masuk kata demi kata
      tl.fromTo("#particles", { opacity: 0.25 }, { opacity: 1, ease: "none", immediateRender: false, duration: 0.08 }, 0.44);
      tl.add(fireFinale, 0.53);
      var words = (splits.closingName && splits.closingName.words.length)
        ? splits.closingName.words : q(panel, ".finale-names .script-name");
      F(tl, words, { yPercent: 120, scale: 1.3, opacity: 0, duration: 0.14, stagger: 0.05, ease: "back.out(1.6)" }, 0.54);
      F(tl, q(panel, ".finale-names .hero-date"), { y: 26, opacity: 0, duration: 0.1, ease: "power2.out" }, 0.68);

      // E (0.75–1) TERIMA KASIH: pesan penutup naik berurutan, lalu hening
      F(tl, q(panel, ".finale-thanks > *"), { y: 30, opacity: 0, duration: 0.08, stagger: 0.035, ease: "power2.out" }, 0.78);
      tl.to({}, { duration: 0.1 }); // resting frame: langit + rasi + nama
    },
  };

  /* ---------- Fase transisi: signature berbeda tiap batas scene ----------
     Registry per indeks scene MASUK. Tiap entri boleh punya:
       out(tl, prevPanel, prevInner) : nasib panel lama (default: defaultOut)
       clip [from, to]               : clip-path panel masuk (wipe)
       hold                          : panel masuk ditahan diam selayar penuh
                                       (counter-translate y) supaya wipe terbaca
                                       sebagai tirai/iris, bukan slide biasa
       build(tl, panel, prevPanel)   : tween tambahan (veil, seam, mask, burst)
       unmount(panel) / remount(panel): lepas & pasang ulang mask khusus
     Cleanup: saat transisi tuntas, clip/mask dilepas (hemat layer GPU);
     saat user scroll balik, keadaan "terbuka penuh" dipulihkan dulu. */

  function dimTo(tl, panel, val) {
    tl.fromTo(panel, { "--dim": 0 }, { "--dim": val, ease: "none", immediateRender: false, duration: 1 }, 0);
  }

  function defaultOut(tl, prevPanel, prevInner) {
    tl.fromTo(prevInner, { scale: 1, yPercent: 0 },
      { scale: 0.9, yPercent: -5, ease: "none", immediateRender: false, duration: 1 }, 0);
    dimTo(tl, prevPanel, 0.55);
  }

  // Callback partikel di timeline scrub bisa terpicu bolak-balik — beri jeda
  var fxAt = {};
  function onceFx(key, fn) {
    var now = Date.now();
    if (fxAt[key] && now - fxAt[key] < 1500) return;
    fxAt[key] = now;
    fn();
  }

  // Puncak finale: kembang api emas bertahap + kabar ke delight layer.
  // Latch sekali per kunjungan — scrub bolak-balik tidak mengulanginya.
  var finaleFired = false;
  function fireFinale() {
    if (finaleFired) return;
    finaleFired = true;
    var P = window.WeddingParticles;
    if (P) {
      var w = window.innerWidth, h = window.innerHeight;
      P.burst(w * 0.25, h * 0.33, 18, { speed: 1.5 });
      gsap.delayedCall(0.28, function () { P.burst(w * 0.5, h * 0.22, 18, { speed: 1.6 }); });
      gsap.delayedCall(0.55, function () { P.burst(w * 0.75, h * 0.33, 18, { speed: 1.5 }); });
    }
    if (navigator.vibrate) navigator.vibrate([18, 50, 18, 50, 30]);
    window.dispatchEvent(new CustomEvent("wedding:finale", { detail: {} }));
  }

  /* Catatan v2: clip/mask layar penuh + "hold" (panel ditahan diam via
     counter-translate) DIHAPUS — di iOS (toolbar muncul-hilang) jarak
     scroll transisi tak lagi sama dengan tinggi panel svh, sehingga panel
     tampak bergeser & melompat. Signature kini murni efek per-elemen:
     aman di semua perangkat, mekanik tumpukan sticky tetap jadi wipe-nya. */

  var transitions = {
    // hero → mempelai : BLOOM — lanjutan kamera zoom-through; hero
    // membesar & memutih oleh kilatan cahaya emas
    1: {
      out: function (tl, prevPanel, prevInner) {
        tl.fromTo(prevInner, { scale: 1 }, { scale: 1.15, ease: "none", immediateRender: false, duration: 1 }, 0);
        var veil = prevPanel.querySelector(".flash-veil");
        if (veil) {
          tl.fromTo(veil, { opacity: 0 }, { opacity: 0.9, ease: "power1.in", immediateRender: false, duration: 0.6 }, 0);
          tl.to(veil, { opacity: 0, ease: "power1.out", duration: 0.4 }, 0.6);
        }
      },
    },

    // mempelai → acara : SEAM — garis belah emas menyala di panel acara
    // yang naik, gema tirai pembuka; panel lama bergeser miring
    2: {
      out: function (tl, prevPanel, prevInner) {
        tl.fromTo(prevInner, { xPercent: 0, scale: 1 },
          { xPercent: -6, scale: 0.94, ease: "none", immediateRender: false, duration: 1 }, 0);
        dimTo(tl, prevPanel, 0.55);
      },
      build: function (tl, panel) {
        var seam = panel.querySelector(".wipe-edge");
        if (seam) tl.fromTo(seam, { opacity: 1 }, { opacity: 0, ease: "power1.out", immediateRender: false, duration: 0.6 }, 0.2);
      },
    },

    // acara → countdown : TILT AWAY — kartu acara rebah menjauh ke dalam
    3: {
      out: function (tl, prevPanel, prevInner) {
        defaultOut(tl, prevPanel, prevInner);
        tl.fromTo(q(prevPanel, ".event-card"), { rotationX: 0 },
          { rotationX: -26, transformOrigin: "50% 100%", transformPerspective: 900,
            ease: "none", immediateRender: false, duration: 1, stagger: 0.08 }, 0);
      },
    },

    // countdown → galeri : FILM GATE — kilatan emas menyilaukan sejenak
    4: {
      out: function (tl, prevPanel, prevInner) {
        defaultOut(tl, prevPanel, prevInner);
        var veil = prevPanel.querySelector(".flash-veil");
        if (veil) {
          tl.fromTo(veil, { opacity: 0 }, { opacity: 0.85, ease: "power2.in", immediateRender: false, duration: 0.45 }, 0);
          tl.to(veil, { opacity: 0, ease: "power2.out", duration: 0.55 }, 0.45);
        }
      },
    },

    // galeri → RSVP : GOLD HORIZON — paling kalem (form menyusul);
    // bar emas menyala di tepi atas panel RSVP lalu memudar
    5: {
      out: function (tl, prevPanel, prevInner) {
        tl.fromTo(prevInner, { x: 0, scale: 1 },
          { x: "-8vw", scale: 0.95, ease: "none", immediateRender: false, duration: 1 }, 0);
        dimTo(tl, prevPanel, 0.7);
      },
      build: function (tl, panel) {
        var edge = panel.querySelector(".wipe-edge");
        if (edge) {
          tl.fromTo(edge, { opacity: 0 }, { opacity: 1, ease: "power1.in", immediateRender: false, duration: 0.4 }, 0.1);
          tl.to(edge, { opacity: 0, ease: "power1.out", duration: 0.5 }, 0.5);
        }
      },
    },

    // RSVP → amplop : percikan koin menyambut amplop digital
    6: {
      build: function (tl) {
        tl.add(function () {
          onceFx("t6-coin", function () {
            if (window.WeddingParticles) {
              window.WeddingParticles.burst(window.innerWidth / 2, window.innerHeight * 0.4, 12, { shape: "coin", up: true });
            }
          });
        }, 0.55);
      },
    },

    // amplop → penutup : NIGHTFALL — dunia meredup; ini stage 0 finale.
    // Panel penutup masuk normal (sudah nyaris hitam), ambient ikut padam
    7: {
      out: function (tl, prevPanel, prevInner) {
        tl.fromTo(prevInner, { scale: 1, yPercent: 0 },
          { scale: 0.92, yPercent: -4, ease: "none", immediateRender: false, duration: 1 }, 0);
        dimTo(tl, prevPanel, 0.9);
      },
      build: function (tl) {
        tl.fromTo(".ambient", { opacity: 1 }, { opacity: 0.25, ease: "none", immediateRender: false, duration: 1 }, 0);
        tl.fromTo("#particles", { opacity: 1 }, { opacity: 0.25, ease: "none", immediateRender: false, duration: 1 }, 0);
      },
    },
  };

  function buildTransition(i, scene, panel, prevScene) {
    var prevPanel = prevScene.querySelector(".panel");
    var prevInner = prevPanel.querySelector(".slide-inner");
    var spec = transitions[i] || {};

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: scene, start: "top bottom", end: "top top",
        scrub: 0.3, invalidateOnRefresh: true,
      },
    });

    (spec.out || defaultOut)(tl, prevPanel, prevInner);
    if (spec.build) spec.build(tl, panel, prevPanel);
  }

  /* ---------- Build semua trigger ---------- */

  function buildScroll() {
    if (built) return;
    built = true;

    var scenes = q(document, ".story .scene");

    scenes.forEach(function (scene, i) {
      try {
        buildScene(scene, i, scenes);
      } catch (e) {
        // Satu scene gagal dibangun tidak boleh mematikan sisanya
        if (window.console && console.warn) console.warn("Scene " + i + " gagal dibangun:", e);
      }
    });

    try { velocityLayer(); } catch (e) { /* fitur tambahan, boleh gagal senyap */ }
    try { ringTravelers(scenes); } catch (e) { /* fitur tambahan, boleh gagal senyap */ }
  }

  function buildScene(scene, i, scenes) {
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

    // Fase transisi: tiap batas scene punya signature wipe sendiri
    if (i > 0) buildTransition(i, scene, panel, scenes[i - 1]);
  }

  /* ---------- Cincin emas penyerta ----------
     Dua cincin kecil menemani perjalanan: Ring A lahir dari monogram hero
     saat kamera menembusnya, Ring B menyusul di scene mempelai. Tiap batas
     scene keduanya meluncur ke dermaga baru di tepi layar, makin merapat,
     lalu MENYATU (interlock) tepat di atas rasi hati saat finale —
     dua menjadi satu. Semua posisi fraksi frame, dihitung ulang saat
     refresh (function-based + invalidateOnRefresh). */

  function ringTravelers(scenes) {
    var layer = document.getElementById("ring-travelers");
    if (!layer || scenes.length < 8) return;
    var rings = [layer.querySelector(".rt-a"), layer.querySelector(".rt-b")];

    // Dermaga [ringA, ringB] per scene (fraksi lebar frame × tinggi layar),
    // dipilih menjauhi teks; indeks 0 = titik lahir Ring A (pusat monogram)
    var dock = [
      [[0.5, 0.3], [0.5, 0.3]],
      [[0.12, 0.15], [0.88, 0.15]],
      [[0.15, 0.09], [0.85, 0.09]],
      [[0.22, 0.07], [0.78, 0.07]],
      [[0.28, 0.06], [0.72, 0.06]],
      [[0.34, 0.055], [0.66, 0.055]],
      [[0.42, 0.05], [0.58, 0.05]],
      [[0.485, 0.42], [0.515, 0.42]],
    ];
    function fx(f) { return function () { return f * layer.clientWidth - 13; }; }
    function fy(f) { return function () { return f * window.innerHeight - 13; }; }

    // Kelahiran: Ring A muncul saat zoom-through hero, Ring B saat mempelai
    gsap.fromTo(rings[0], { opacity: 0, scale: 0.3 }, {
      opacity: 0.65, scale: 1, ease: "none", immediateRender: true,
      scrollTrigger: { trigger: scenes[0], start: "20% top", end: "55% top", scrub: 0.4 },
    });
    gsap.fromTo(rings[1], { opacity: 0, scale: 0.3 }, {
      opacity: 0.65, scale: 1, ease: "none", immediateRender: true,
      scrollTrigger: { trigger: scenes[1], start: "top top", end: "40% top", scrub: 0.4 },
    });

    // Segmen perjalanan: saat scene i menutup scene sebelumnya, kedua
    // cincin meluncur dari dermaga i-1 ke dermaga i (fromTo eksplisit
    // per segmen agar scrub bolak-balik & refresh tetap deterministik)
    for (var i = 1; i < dock.length; i++) {
      (function (i) {
        rings.forEach(function (ring, r) {
          if (i === 1 && r === 1) return; // Ring B belum lahir sebelum scene 1
          gsap.fromTo(ring,
            { x: fx(dock[i - 1][r][0]), y: fy(dock[i - 1][r][1]) },
            {
              x: fx(dock[i][r][0]), y: fy(dock[i][r][1]),
              ease: "power1.inOut", immediateRender: i === 1 || (i === 2 && r === 1),
              scrollTrigger: {
                trigger: scenes[i], start: "top bottom", end: "top top",
                scrub: 0.4, invalidateOnRefresh: true,
              },
            });
        });
      })(i);
    }

    // Interlock: menyentuh rasi hati, keduanya memantul menyatu
    ScrollTrigger.create({
      trigger: scenes[scenes.length - 1], start: "42% top", once: true,
      onEnter: function () {
        gsap.fromTo(rings, { scale: 1.6 }, { scale: 1, duration: 0.8, ease: "bounce.out", stagger: 0.08 });
        gsap.to(rings, { opacity: 0.9, duration: 0.5 });
      },
    });
  }

  /* ---------- Lapisan reaktif kecepatan scroll ----------
     Fling cepat: medan partikel meregang vertikal, daun emas menekuk
     (skewX — tidak bentrok dengan sway rotasi / tilt x-y), dan guratan
     kecepatan melintas. Semua via quickTo, tanpa layout read. */

  function velocityLayer() {
    var liteMode = document.body.classList.contains("lite");
    var canvas = document.getElementById("particles");
    var canvasScale = canvas ? gsap.quickTo(canvas, "scaleY", { duration: 0.3, ease: "power2.out" }) : null;
    var leafBend = q(document, ".leaf").map(function (el) {
      return gsap.quickTo(el, "skewX", { duration: 0.45, ease: "power2.out" });
    });

    var resetT = null;
    function scheduleReset() {
      clearTimeout(resetT);
      resetT = setTimeout(function () {
        if (canvasScale) canvasScale(1);
        leafBend.forEach(function (to) { to(0); });
      }, 150);
    }

    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: function (self) {
        var v = self.getVelocity();
        var k = Math.max(-1, Math.min(1, v / 3200));
        if (canvasScale) canvasScale(1 + Math.abs(k) * 0.05);
        leafBend.forEach(function (to, i) { to(k * (i % 2 ? -6 : 6)); });
        if (Math.abs(v) > 2500 && !liteMode && window.WeddingParticles) {
          onceFx("vel-streak", function () {
            window.WeddingParticles.boostUp();
            window.WeddingParticles.streak(v > 0 ? -1 : 1);
          });
        }
        scheduleReset();
      },
    });
  }

  /* ---------- Intro hero (sekali, saat tirai terbuka) ---------- */

  function heroIntro() {
    var slide = document.querySelector(".slide-hero");
    if (!slide) return;
    var tl = gsap.timeline();
    introTl = tl;

    // Bila user langsung scroll, intro .from() akan berebut target dengan
    // tween scrub pinned[0] — tuntaskan intro seketika lalu lepaskan.
    function finishIntro() {
      if (window.scrollY <= 8) {
        window.addEventListener("scroll", finishIntro, { once: true, passive: true });
        return;
      }
      if (introTl) { introTl.progress(1).kill(); introTl = null; }
    }
    window.addEventListener("scroll", finishIntro, { once: true, passive: true });

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
    // Scroll dibuka + hero masuk tepat saat tirai membelah.
    // Cover langsung berhenti menangkap sentuhan — display:none baru
    // menyusul di onComplete, jadi ia tak boleh menghalangi scroll
    tl.set(cover, { pointerEvents: "none" }, 0.95);
    tl.add(function () {
      if (onReveal) onReveal();
      try {
        ScrollTrigger.refresh();
        heroIntro();
      } catch (e) { /* animasi gagal ≠ tamu terkunci */ }
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
