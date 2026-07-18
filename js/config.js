// ============================================================
//  KONFIGURASI UNDANGAN
//  Semua data acara ada di file ini. Ganti nilai yang
//  bertanda GANTI_INI, lalu simpan — tidak perlu edit file lain.
// ============================================================

window.WEDDING_CONFIG = {
  couple: {
    groom: {
      nick: "Ivan",
      full: "GANTI_INI Nama Lengkap Mempelai Pria",
      parents: "Putra dari Bapak GANTI_INI & Ibu GANTI_INI",
      instagram: "", // contoh: "ivanrusli" (tanpa @). Kosongkan jika tidak ingin ditampilkan.
      photo: "assets/img/groom.svg",
    },
    bride: {
      nick: "Sioni",
      full: "GANTI_INI Nama Lengkap Mempelai Wanita",
      parents: "Putri dari Bapak GANTI_INI & Ibu GANTI_INI",
      instagram: "",
      photo: "assets/img/bride.svg",
    },
  },

  event: {
    // Tanggal utama acara (dipakai untuk countdown & Save the Date).
    // Format: "YYYY-MM-DDTHH:mm:ss+07:00" (WIB = +07:00)
    mainDateISO: "2026-12-12T08:00:00+07:00", // GANTI_INI

    akad: {
      title: "Akad Nikah",
      dateLabel: "Sabtu, 12 Desember 2026", // GANTI_INI
      timeLabel: "08.00 – 10.00 WIB", // GANTI_INI
      venue: "GANTI_INI Nama Gedung / Masjid",
      address: "GANTI_INI Alamat lengkap lokasi akad",
      mapsUrl: "https://maps.google.com", // GANTI_INI link Google Maps
    },
    resepsi: {
      title: "Resepsi",
      dateLabel: "Sabtu, 12 Desember 2026", // GANTI_INI
      timeLabel: "11.00 – 14.00 WIB", // GANTI_INI
      venue: "GANTI_INI Nama Gedung Resepsi",
      address: "GANTI_INI Alamat lengkap lokasi resepsi",
      mapsUrl: "https://maps.google.com", // GANTI_INI link Google Maps
    },

    // Untuk tombol "Save the Date" (Google Calendar)
    calendar: {
      title: "Pernikahan Ivan & Sioni",
      details: "Kami menantikan kehadiran Anda di hari bahagia kami.",
      location: "GANTI_INI Alamat lokasi acara",
      // Jam mulai mengikuti mainDateISO; durasi dalam jam:
      durationHours: 6,
    },
  },

  // Amplop digital — bisa lebih dari satu rekening / e-wallet
  gifts: [
    {
      bank: "BCA", // GANTI_INI
      number: "1234567890", // GANTI_INI
      holder: "GANTI_INI Nama Pemilik Rekening",
    },
    {
      bank: "GoPay / OVO / DANA", // GANTI_INI
      number: "081234567890", // GANTI_INI
      holder: "GANTI_INI Nama Pemilik",
    },
  ],

  // Galeri foto — ganti dengan path foto pre-wedding kalian,
  // contoh: "assets/img/prewed-1.jpg"
  gallery: [
    "assets/img/placeholder.svg",
    "assets/img/placeholder.svg",
    "assets/img/placeholder.svg",
    "assets/img/placeholder.svg",
    "assets/img/placeholder.svg",
    "assets/img/placeholder.svg",
  ],

  // File musik latar. Taruh file mp3 di assets/audio/ lalu sesuaikan nama.
  musicSrc: "assets/audio/music.mp3",

  // URL Web App Google Apps Script untuk RSVP & ucapan.
  // Kosongkan dulu; isi setelah setup (lihat README.md bagian "Setup RSVP").
  appsScriptUrl: "",

  // Kutipan pembuka & penutup
  quote: {
    text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
    source: "QS. Ar-Rum: 21",
  },
  closing: {
    text: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.",
  },
};
