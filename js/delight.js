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
  });

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

  /* ---------- C8. Scene penutup pertama kali = konfeti besar ---------- */

  var closingCelebrated = false;
  window.addEventListener("wedding:scene", function (e) {
    if (closingCelebrated || !e.detail || e.detail.index !== e.detail.total - 1) return;
    closingCelebrated = true;
    if (P) P.rain(130, "confetti");
  });

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
