/* ============================================================
   Undangan "Garden Fresco" — logika utama.
   Sengaja tanpa GSAP/scroll-scrub: hanya IntersectionObserver
   + transisi CSS (transform/opacity) yang stabil di iOS.
   ============================================================ */

(function () {
  "use strict";

  var CFG = window.WEDDING_CONFIG;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ---------- Foto opsional: tampilkan bila diisi di config ---------- */

  function setPhoto(imgId, src) {
    var img = $(imgId);
    if (!img || !src) return;
    img.src = src;
    img.hidden = false;
  }

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
    setPhoto("groom-photo", g.photo);
    setupInstagram("groom-ig", g.instagram);

    fillText("bride-full", b.full);
    fillText("bride-parents", b.parents);
    setPhoto("bride-photo", b.photo);
    setupInstagram("bride-ig", b.instagram);

    setPhoto("cover-photo", CFG.coverPhoto);
    setPhoto("closing-photo", CFG.closingPhoto || CFG.coverPhoto);
    if (CFG.coverPhoto) $("cover").classList.add("has-photo");

    // Tanggal: "03 . 10 . 2026"
    var d = new Date(CFG.event.mainDateISO);
    if (!isNaN(d)) {
      var pad = function (n) { return String(n).padStart(2, "0"); };
      fillText("hero-date", pad(d.getDate()) + " . " + pad(d.getMonth() + 1) + " . " + d.getFullYear());
    }

    fillText("quote-text", CFG.quote.text);
    fillText("quote-source", CFG.quote.source);
    fillText("closing-text", CFG.closing.text);

    // Kisah cinta
    var storyBox = $("story-list");
    (CFG.loveStory || []).forEach(function (item) {
      var div = document.createElement("div");
      div.className = "story-item rv";
      div.innerHTML =
        "<h3>" + escapeHtml(item.title) + "</h3>" +
        "<p>" + escapeHtml(item.text) + "</p>";
      storyBox.appendChild(div);
    });

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

    // Galeri: item pertama & terakhir tampil lebar penuh
    var grid = $("gallery-grid");
    var murals = [
      "40 60 400 300", "20 260 220 300", "240 240 220 300",
      "80 340 240 320", "160 100 240 320", "40 380 400 300",
    ];
    CFG.gallery.forEach(function (src, i) {
      var frame = document.createElement("figure");
      frame.className = "gframe rv" + (i === 0 || i === CFG.gallery.length - 1 ? " wide" : "");
      if (src) {
        var img = document.createElement("img");
        img.src = src;
        img.alt = "Galeri foto " + (i + 1);
        img.loading = "lazy";
        frame.appendChild(img);
      } else {
        frame.innerHTML =
          '<svg viewBox="' + murals[i % murals.length] + '" preserveAspectRatio="xMidYMid slice">' +
          '<use href="#muralArt"/></svg>' +
          '<span class="g-hint">Foto ' + (i + 1) + "</span>";
      }
      grid.appendChild(frame);
    });

    // Amplop digital (muncul setelah tombol ditekan)
    var giftList = $("gift-list");
    CFG.gifts.forEach(function (gift) {
      var card = document.createElement("div");
      card.className = "gift-card";
      card.innerHTML =
        '<span class="gift-bank">' + escapeHtml(gift.bank) + "</span>" +
        '<span class="gift-number">' + escapeHtml(gift.number) + "</span>" +
        '<span class="gift-holder">a.n. ' + escapeHtml(gift.holder) + "</span>" +
        '<button type="button" class="btn small ghost btn-copy">Salin Nomor</button>';
      card.querySelector(".btn-copy").addEventListener("click", function () {
        copyText(gift.number);
      });
      giftList.appendChild(card);
    });

    $("gift-toggle").addEventListener("click", function () {
      var list = $("gift-list");
      list.hidden = !list.hidden;
    });

    // Save the Date (Google Calendar)
    $("save-date-btn").href = buildCalendarUrl();

    // Musik
    $("bg-music").src = CFG.musicSrc;
  }

  /* ---------- Salin nomor rekening ---------- */

  function copiedFx() { toast("Tersalin! Tuhan memberkati kemurahan hatimu"); }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(copiedFx, function () { fallbackCopy(text); });
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
      copiedFx();
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
    if (name) $("guest-name").textContent = name.slice(0, 60);
  }

  /* ---------- Reveal saat elemen masuk layar ---------- */

  function initReveals() {
    var els = document.querySelectorAll(".rv");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("on"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("on");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Sampul ---------- */

  var opened = false;
  $("open-btn").addEventListener("click", function () {
    if (opened) return;
    opened = true;
    startMusic();
    $("cover").classList.add("open");
    document.body.classList.remove("locked");
    window.scrollTo(0, 0);
    // Putar ulang rakitan "paper craft" mural untuk panel hero
    document.body.classList.remove("assemble");
    void document.body.offsetWidth;
    document.body.classList.add("assemble");
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
      function () { musicBtn.hidden = true; }
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

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        $("countdown").hidden = true;
        $("countdown-over").hidden = false;
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      fillText("cd-days", String(Math.floor(s / 86400)));
      fillText("cd-hours", String(Math.floor((s % 86400) / 3600)));
      fillText("cd-mins", String(Math.floor((s % 3600) / 60)));
      fillText("cd-secs", String(s % 60));
    }
    tick();
    var timer = setInterval(tick, 1000);
  }

  /* ---------- RSVP & ucapan ---------- */

  function renderWishes(wishes) {
    var box = $("wishes");
    if (!wishes || !wishes.length) {
      box.innerHTML = '<p class="wishes-empty">Belum ada ucapan. Jadilah yang pertama!</p>';
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
        toast(data.get("attendance") === "Hadir"
          ? "Yeay! Sampai jumpa di sana"
          : "Terima kasih, doamu sangat berarti");
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
  initReveals();
  startCountdown();
  loadWishes();
})();
