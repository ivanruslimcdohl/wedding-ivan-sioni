// ============================================================
//  KONFIGURASI UNDANGAN
//  Semua data acara ada di file ini. Ganti nilai yang
//  bertanda GANTI_INI, lalu simpan — tidak perlu edit file lain.
// ============================================================

window.WEDDING_CONFIG = {
  couple: {
    groom: {
      nick: "Ivan",
      full: "Ivan Rusli",
      parents: "Putra dari Bapak Lie Sje Foek & Ibu Irene Khoe",
      instagram: "", // contoh: "ivanrusli" (tanpa @). Kosongkan jika tidak ingin ditampilkan.
      photo: "../assets/img/groom.svg",
    },
    bride: {
      nick: "Sioni",
      full: "Sara Sioni Santoso",
      parents: "Putri dari Bapak Sie Djing San & Ibu Njoo Eng Lian",
      instagram: "",
      photo: "../assets/img/bride.svg",
    },
  },

  event: {
    // Tanggal utama acara (dipakai untuk countdown & Save the Date).
    // Format: "YYYY-MM-DDTHH:mm:ss+07:00" (WIB = +07:00)
    mainDateISO: "2026-10-03T09:00:00+07:00",

    // "akad" = acara pertama (Holy Matrimony), "resepsi" = acara kedua.
    akad: {
      title: "Holy Matrimony",
      dateLabel: "Sabtu, 3 Oktober 2026",
      timeLabel: "09.00 – 11.00 WIB",
      venue: "Wahid Prime Hotel — Ballroom B",
      address:
        "Jl. Jend. Sudirman No.95, Kutowinangun Kidul, Kec. Tingkir, Kota Salatiga, Jawa Tengah 50742",
      mapsUrl: "https://maps.app.goo.gl/NZdKFmt1VzuZAKi99",
    },
    resepsi: {
      title: "Resepsi",
      dateLabel: "Sabtu, 3 Oktober 2026",
      timeLabel: "13.00 WIB – selesai",
      venue: "Wahid Prime Hotel — Ballroom B",
      address:
        "Jl. Jend. Sudirman No.95, Kutowinangun Kidul, Kec. Tingkir, Kota Salatiga, Jawa Tengah 50742",
      mapsUrl: "https://maps.app.goo.gl/NZdKFmt1VzuZAKi99",
    },

    // Untuk tombol "Save the Date" (Google Calendar)
    calendar: {
      title: "Pernikahan Ivan & Sioni",
      details: "Kami menantikan kehadiran Anda di hari bahagia kami.",
      location:
        "Wahid Prime Hotel Ballroom B, Jl. Jend. Sudirman No.95, Salatiga",
      // Jam mulai mengikuti mainDateISO; durasi dalam jam:
      durationHours: 6,
    },
  },

  // Amplop digital — bisa lebih dari satu rekening / e-wallet
  gifts: [
    {
      bank: "BCA",
      number: "0810889161",
      holder: "Sara Sioni Santoso",
    },
    {
      bank: "BCA",
      number: "7370264435",
      holder: "Ivan Rusli",
    },
  ],

  // Galeri foto — ganti dengan path foto pre-wedding kalian,
  // contoh: "../assets/img/prewed-1.jpg"
  gallery: [
    "../assets/img/placeholder.svg",
    "../assets/img/placeholder.svg",
    "../assets/img/placeholder.svg",
    "../assets/img/placeholder.svg",
    "../assets/img/placeholder.svg",
    "../assets/img/placeholder.svg",
  ],

  // File musik latar. Taruh file mp3 di assets/audio/ lalu sesuaikan nama.
  musicSrc: "../assets/audio/music.mp3",

  // URL Web App Google Apps Script untuk RSVP & ucapan.
  // Kosongkan dulu; isi setelah setup (lihat README.md bagian "Setup RSVP").
  appsScriptUrl:
    "https://script.google.com/macros/s/AKfycbzkQVshxLqWLdxb7A_Nu7HPDt4DAW0htnmfuKA1okQ6bwrxcOleXI5oxUmTgcKwylD3/exec",

  // Kutipan pembuka & penutup
  quote: {
    text: "Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.",
    source: "Markus 10:9",
  },
  closing: {
    text: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.",
  },
};
