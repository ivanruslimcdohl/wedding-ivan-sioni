// ============================================================
//  KONFIGURASI UNDANGAN — versi "Garden Fresco" (preview)
//  Semua data & foto diatur dari file ini.
//  Foto: isi path-nya (contoh "assets/img/prewed-1.jpg?v=2"),
//  atau biarkan "" untuk memakai ilustrasi bawaan.
// ============================================================

window.WEDDING_CONFIG = {
  couple: {
    groom: {
      nick: "Ivan",
      full: "Ivan Rusli",
      parents: "Putra dari Bapak Lie Sje Foek & Ibu Irene Khoe",
      instagram: "", // contoh: "ivanrusli" (tanpa @)
      photo: "assets/img/groom.jpg?v=20", // foto potret ("" = ilustrasi bawaan)
    },
    bride: {
      nick: "Sioni",
      full: "Sara Sioni Santoso",
      parents: "Putri dari Bapak Sie Djing San & Ibu Njoo Eng Lian",
      instagram: "",
      photo: "assets/img/bride.jpg?v=16",
    },
  },

  // Foto sampul (layar pembuka). "" = mural ilustrasi.
  coverPhoto: "assets/img/cover.jpg?v=2",
  // "light" = foto sampul terang (teks jadi hijau tinta),
  // "dark" = foto gelap (teks putih + veil gelap).
  coverPhotoTone: "light",

  // Foto bingkai lengkung di bagian penutup. "" = ikut coverPhoto/mural.
  closingPhoto: "assets/img/gallery-5.jpg?v=2",

  // Kisah cinta — sunting bebas; hapus item jika tidak ingin ditampilkan.
  loveStory: [
    {
      title: "Awal Bertemu",
      text: "Tuhan mempertemukan kami dengan cara yang sederhana, namun sejak saat itu semuanya perlahan berubah.",
    },
    {
      title: "Bertumbuh Bersama",
      text: "Dalam suka dan duka kami belajar saling mengenal, saling menguatkan, dan bertumbuh di dalam kasih-Nya.",
    },
    {
      title: "Menjadi Satu",
      text: "Kini, dengan penuh syukur, kami melangkah ke babak baru — menjadi satu di hadapan Tuhan dan keluarga.",
    },
  ],

  event: {
    // Tanggal utama acara (countdown & Save the Date).
    mainDateISO: "2026-10-03T09:00:00+07:00",

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
      title: "Reception",
      dateLabel: "Sabtu, 3 Oktober 2026",
      timeLabel: "13.00 WIB – selesai",
      venue: "Wahid Prime Hotel — Ballroom B",
      address:
        "Jl. Jend. Sudirman No.95, Kutowinangun Kidul, Kec. Tingkir, Kota Salatiga, Jawa Tengah 50742",
      mapsUrl: "https://maps.app.goo.gl/NZdKFmt1VzuZAKi99",
    },

    calendar: {
      title: "The Wedding of Ivan & Sioni",
      details: "Kami menantikan kehadiran Anda di hari bahagia kami.",
      location:
        "Wahid Prime Hotel Ballroom B, Jl. Jend. Sudirman No.95, Salatiga",
      durationHours: 6,
    },
  },

  gifts: [
    { bank: "BCA", number: "0810889161", holder: "Sara Sioni Santoso" },
  ],

  // Galeri — tiap item { src, wide }. wide:true = lebar penuh (cocok foto lanskap);
  // tanpa wide = tampil 2 kolom (cocok foto potret). (String polos juga masih didukung.)
  gallery: [
    { src: "assets/img/gallery-1.jpg?v=2", wide: true },
    { src: "assets/img/gallery-2.jpg?v=3" },
    { src: "assets/img/gallery-3.jpg?v=2" },
    { src: "assets/img/gallery-7.jpg?v=1", wide: true },
    { src: "assets/img/gallery-8.jpg?v=1", wide: true },
    { src: "assets/img/gallery-6.jpg?v=2", wide: true },
  ],

  musicSrc: "assets/audio/music.mp3",
  // Mulai musik dari detik ke-berapa (loop juga kembali ke titik ini)
  musicStartAt: 30,

  appsScriptUrl:
    "https://script.google.com/macros/s/AKfycbzkQVshxLqWLdxb7A_Nu7HPDt4DAW0htnmfuKA1okQ6bwrxcOleXI5oxUmTgcKwylD3/exec",

  quote: {
    text: "Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.",
    source: "Markus 10:9",
  },
  closing: {
    text: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.",
  },
};
