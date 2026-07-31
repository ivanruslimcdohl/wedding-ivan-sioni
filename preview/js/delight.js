/* ============================================================
   Delight Layer — kejutan, satisfying & lucu ✨
   Micro-interactions & easter egg di atas undangan:
   - tap = kilau; double-tap foto = hujan hati
   - mainan fidget (kotak countdown, "&", monogram)
   - payoff RSVP / salin rekening / scene penutup
   - goyang HP = hujan berkat; kunang-kunang saat idle
   - not musik melayang dari tombol musik
   Terhubung longgar ke main.js via CustomEvent & window.WeddingUI.
   ============================================================ */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return; // tanpa kejutan bergerak untuk yang memilih tenang

  var P = window.WeddingParticles;
  var UI = window.WeddingUI || { toast: function () {} };
  var hasGsap = !!window.gsap;
  var opened = false;

  window.addEventListener("wedding:opened", function () {
    opened = true;
    helloGuest();
    armIdleFirefly();
    armScrollSurprises();
  });

  /* ---------- Kejutan mikro di titik scroll tak terduga (sekali saja) ---------- */

  function armScrollSurprises() {
    if (!hasGsap || !window.ScrollTrigger) return;

    // 1. Tengah scene mempelai: sebutir hati terbang dari pria ke wanita
    ScrollTrigger.create({
      trigger: ".scene-couple", start: "30% top", once: true,
      onEnter: heartFlight,
    });

    // 2. Scene acara: ikon pin lokasi bergoyang minta diperhatikan
    ScrollTrigger.create({
      trigger: ".scene-event", start: "55% center", once: true,
      onEnter: function () {
        gsap.fromTo(".pin-icon", { rotation: -14 },
          { rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.3)", stagger: 0.15, transformOrigin: "50% 100%" });
      },
    });

    // 3. Menjelang galeri: bintang jatuh melintas diagonal
    ScrollTrigger.create({
      trigger: ".scene-gallery", start: "top 90%", once: true,
      onEnter: shootingStar,
    });

    // 4. Daftar ucapan tampil: percikan kecil menyambut doa-doa
    ScrollTrigger.create({
      trigger: "#wishes", start: "top 75%", once: true,
      onEnter: function () {
        if (!P) return;
        var el = document.getElementById("wishes");
        var r = el.getBoundingClientRect();
        P.burst(r.left + r.width / 2, r.top, 10, { speed: 0.6 });
      },
    });
  }

  function heartFlight() {
    var g = document.getElementById("groom-photo");
    var b = document.getElementById("bride-photo");
    if (!g || !b) return;
    var r1 = g.getBoundingClientRect(), r2 = b.getBoundingClientRect();
    var x0 = r1.left + r1.width / 2, y0 = r1.top + r1.height / 2;
    var x1 = r2.left + r2.width / 2, y1 = r2.top + r2.height / 2;
    var fly = document.createElement("div");
    fly.className = "love-drift";
    fly.textContent = "♥";
    document.body.appendChild(fly);
    var st = { p: 0 };
    gsap.set(fly, { x: x0, y: y0, opacity: 0 });
    gsap.to(fly, { opacity: 1, duration: 0.35 });
    gsap.to(st, {
      p: 1, duration: 2.2, ease: "power1.inOut",
      onUpdate: function () {
        gsap.set(fly, {
          x: x0 + (x1 - x0) * st.p,
          y: y0 + (y1 - y0) * st.p - Math.sin(st.p * Math.PI) * 60,
        });
      },
      onComplete: function () {
        if (P) P.burst(x1, y1, 8, { shape: "heart", up: true });
        fly.remove();
      },
    });
  }

  function shootingStar() {
    var star = document.createElement("div");
    star.className = "firefly shooting-star";
    document.body.appendChild(star);
    var x0 = -30, y0 = window.innerHeight * 0.12;
    var x1 = window.innerWidth + 30, y1 = window.innerHeight * 0.34;
    gsap.set(star, { x: x0, y: y0 });
    gsap.to(star, {
      x: x1, y: y1, duration: 1.1, ease: "power1.in",
      onComplete: function () { star.remove(); },
    });
  }

  /* ---------- A1. Tap di mana saja = percikan emas ---------- */

  var lastSparkle = 0;
  document.addEventListener("pointerdown", function (e) {
    if (!opened || !P) return;
    if (e.target.closest("input, select, textarea, button, a, .dots")) return;
    var now = Date.now();
    if (now - lastSparkle < 150) return;
    lastSparkle = now;
    P.burst(e.clientX, e.clientY, 9, { speed: 0.55 });
  }, { passive: true });

  /* ---------- A2. Double-tap foto = ledakan hati ---------- */

  function heartTap(el) {
    var last = 0;
    el.addEventListener("pointerdown", function (e) {
      var now = Date.now();
      if (now - last < 350 && P) {
        var r = el.getBoundingClientRect();
        P.burst(r.left + r.width / 2, r.top + r.height / 2, 14, { shape: "heart", up: true });
        if (hasGsap) {
          gsap.fromTo(el, { scale: 1 }, { scale: 1.1, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out", overwrite: "auto" });
        }
        if (navigator.vibrate) navigator.vibrate(12);
      }
      last = now;
    }, { passive: true });
  }

  function armHeartTaps() {
    Array.prototype.forEach.call(document.querySelectorAll(".photo-ring, .gframe"), heartTap);
  }

  /* ---------- B3. Kotak countdown = wobble ---------- */

  function armCountBoxes() {
    Array.prototype.forEach.call(document.querySelectorAll(".count-box"), function (box) {
      box.addEventListener("click", function () {
        if (!hasGsap) return;
        gsap.fromTo(box, { rotation: -11 }, { rotation: 0, duration: 0.9, ease: "elastic.out(1, 0.25)", overwrite: "auto" });
        var span = box.querySelector("span");
        if (span && !span.__flipping) {
          gsap.fromTo(span, { rotationX: 0 }, { rotationX: 360, duration: 0.6, ease: "power2.inOut" });
        }
        if (navigator.vibrate) navigator.vibrate(6);
      });
    });
  }

  /* ---------- B4. "&" berubah jadi hati sebentar ---------- */

  function armAmp() {
    Array.prototype.forEach.call(document.querySelectorAll(".script-amp"), function (amp) {
      var busy = false;
      amp.addEventListener("click", function () {
        if (busy || !hasGsap) return;
        busy = true;
        var orig = amp.textContent;
        gsap.timeline({ onComplete: function () { busy = false; } })
          .to(amp, { scale: 0, duration: 0.16, ease: "power2.in" })
          .add(function () { amp.textContent = "❤"; amp.style.color = "#e8a1a4"; })
          .to(amp, { scale: 1.35, duration: 0.3, ease: "back.out(2.5)" })
          .to(amp, { scale: 0, duration: 0.16, ease: "power2.in" }, "+=0.7")
          .add(function () { amp.textContent = orig; amp.style.color = ""; })
          .to(amp, { scale: 1, duration: 0.3, ease: "back.out(2)" });
      });
    });
  }

  /* ---------- B5. Monogram berputar & menggambar ulang ---------- */

  function armMonograms() {
    Array.prototype.forEach.call(document.querySelectorAll(".monogram-svg"), function (svg) {
      var busy = false;
      svg.addEventListener("click", function () {
        if (busy || !hasGsap) return;
        busy = true;
        gsap.fromTo(svg, { rotation: 0 }, {
          rotation: 360, duration: 1, ease: "power2.inOut", transformOrigin: "50% 50%",
          onComplete: function () { busy = false; },
        });
        Array.prototype.forEach.call(svg.querySelectorAll("circle"), function (c, i) {
          var len = 2 * Math.PI * parseFloat(c.getAttribute("r"));
          gsap.fromTo(c, { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", delay: i * 0.1 });
        });
      });
    });
  }

  /* ---------- C6. RSVP terkirim = hujan konfeti ---------- */

  window.addEventListener("wedding:rsvp", function () {
    if (P) P.rain(110, "confetti");
    if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
  });

  /* ---------- C7. Salin rekening = semburan koin ---------- */

  window.addEventListener("wedding:copy", function (e) {
    if (P) P.burst(e.detail.x, e.detail.y, 20, { shape: "coin", up: true, speed: 1.2 });
    if (navigator.vibrate) navigator.vibrate(10);
  });

  /* ---------- C8. Puncak finale = hujan konfeti besar ----------
     Menunggu wedding:finale dari timeline "Langit Berbintang" —
     bukan saat masuk scene, supaya kegelapan pembuka tidak terganggu */

  var closingCelebrated = false;
  window.addEventListener("wedding:finale", function () {
    if (closingCelebrated) return;
    closingCelebrated = true;
    if (P) P.rain(90, "confetti");
  });

  /* ---------- C8b. Cincin 💍 progress ikut merayakan garis finis ---------- */

  var ringDone = false;
  window.addEventListener("scroll", function () {
    if (ringDone || !opened) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0 || window.scrollY / max < 0.99) return;
    ringDone = true;
    var ring = document.getElementById("progress-ring");
    if (ring && hasGsap) {
      // main.js menimpa style.transform tiap frame scroll — pakai properti
      // rotate/scale terpisah agar salto cincin tak ikut tertimpa
      var st = { r: 0, s: 1 };
      gsap.timeline({ onUpdate: function () { ring.style.rotate = st.r + "deg"; ring.style.scale = st.s; } })
        .to(st, { r: 360, s: 1.7, duration: 0.55, ease: "power2.out" })
        .to(st, { s: 1, duration: 0.4, ease: "back.out(2)" });
    }
    if (P) P.burst(window.innerWidth - 24, 14, 12, { speed: 0.7 });
  }, { passive: true });

  /* ---------- C9. Sapaan personal ---------- */

  function helloGuest() {
    var name = (new URLSearchParams(location.search).get("to") || "").trim();
    if (!name) return;
    setTimeout(function () { UI.toast("Shalom, " + name.slice(0, 40) + " 🤍"); }, 2600);
  }

  /* ---------- D10. Goyang HP = hujan berkat ---------- */

  var lastShake = 0;
  var lastMag = null;
  window.addEventListener("devicemotion", function (e) {
    if (!opened || !P) return;
    var acc = e.accelerationIncludingGravity;
    if (!acc || acc.x == null) return;
    var mag = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    if (lastMag !== null && Math.abs(mag - lastMag) > 26) {
      var now = Date.now();
      if (now - lastShake > 3000) {
        lastShake = now;
        P.rain(90, "dot");
        UI.toast("✨ Hujan berkat! ✨");
        if (navigator.vibrate) navigator.vibrate(30);
      }
    }
    lastMag = mag;
  });

  /* ---------- D11. Kunang-kunang saat idle ---------- */

  var idleTimer = null;
  var IDLE_MS = 18000;

  function armIdleFirefly() {
    ["scroll", "pointerdown", "touchmove", "keydown"].forEach(function (ev) {
      window.addEventListener(ev, resetIdle, { passive: true });
    });
    resetIdle();
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(flyFirefly, IDLE_MS);
  }

  function flyFirefly() {
    if (!opened || document.hidden || !hasGsap) { resetIdle(); return; }
    var fly = document.createElement("div");
    fly.className = "firefly";
    document.body.appendChild(fly);

    var fromLeft = Math.random() < 0.5;
    var y0 = window.innerHeight * (0.2 + Math.random() * 0.5);
    var amp = 30 + Math.random() * 50;
    var x0 = fromLeft ? -20 : window.innerWidth + 20;
    var x1 = fromLeft ? window.innerWidth + 20 : -20;
    var state = { p: 0 };

    gsap.set(fly, { x: x0, y: y0 });
    gsap.to(state, {
      p: 1, duration: 6.5 + Math.random() * 2, ease: "none",
      onUpdate: function () {
        gsap.set(fly, {
          x: x0 + (x1 - x0) * state.p,
          y: y0 + Math.sin(state.p * Math.PI * 3.5) * amp,
        });
      },
      onComplete: function () {
        fly.remove();
        // masih idle? kirim kunang-kunang berikutnya
        clearTimeout(idleTimer);
        idleTimer = setTimeout(flyFirefly, 4500);
      },
    });
  }

  /* ---------- D13. Not musik melayang dari tombol ---------- */

  function armMusicNotes() {
    var btn = document.getElementById("music-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!hasGsap) return;
      var r = btn.getBoundingClientRect();
      ["♪", "♫", "♪"].forEach(function (glyph, i) {
        var note = document.createElement("span");
        note.className = "music-note";
        note.textContent = glyph;
        note.style.left = r.left + r.width / 2 + "px";
        note.style.top = r.top + "px";
        document.body.appendChild(note);
        gsap.fromTo(note,
          { x: 0, y: 0, opacity: 1, scale: 0.7 },
          {
            x: (i - 1) * 26 + (Math.random() - 0.5) * 10,
            y: -60 - i * 18, opacity: 0, scale: 1.15,
            duration: 1.1 + i * 0.15, ease: "power1.out", delay: i * 0.08,
            onComplete: function () { note.remove(); },
          });
      });
    });
  }

  /* ---------- Init ---------- */

  armHeartTaps();
  armCountBoxes();
  armAmp();
  armMonograms();
  armMusicNotes();
})();
