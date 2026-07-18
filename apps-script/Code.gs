/**
 * Backend RSVP & Ucapan — Google Apps Script
 *
 * CARA SETUP (±10 menit):
 * 1. Buka https://sheets.new — buat spreadsheet baru, beri nama bebas
 *    (mis. "RSVP Wedding Ivan & Sioni").
 * 2. Menu: Extensions → Apps Script.
 * 3. Hapus isi editor, tempel seluruh isi file ini, lalu Save (ikon disket).
 * 4. Klik Deploy → New deployment → pilih type "Web app".
 *    - Description : bebas
 *    - Execute as  : Me
 *    - Who has access: Anyone   ← PENTING
 *    Klik Deploy, izinkan akses (Authorize) saat diminta.
 * 5. Salin "Web app URL" (berakhiran /exec), lalu tempel ke js/config.js
 *    pada field appsScriptUrl.
 *
 * Selesai! Setiap RSVP masuk sebagai baris baru di sheet "RSVP",
 * dan ucapan tamu otomatis tampil di halaman undangan.
 *
 * CATATAN: kalau kamu mengubah kode ini, deploy ulang lewat
 * Deploy → Manage deployments → Edit (ikon pensil) → Version: New version.
 */

var SHEET_NAME = "RSVP";
var MAX_WISHES = 150; // maksimal ucapan yang dikirim ke halaman

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Waktu", "Nama", "Kehadiran", "Jumlah Tamu", "Ucapan"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Terima kiriman RSVP dari form undangan */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var p = (e && e.parameter) || {};
    var name = String(p.name || "").trim().slice(0, 100);
    if (!name) return json_({ status: "error", message: "Nama kosong" });

    getSheet_().appendRow([
      new Date(),
      name,
      String(p.attendance || "").slice(0, 30),
      String(p.guests || "").slice(0, 5),
      String(p.message || "").trim().slice(0, 600),
    ]);
    return json_({ status: "ok" });
  } finally {
    lock.releaseLock();
  }
}

/** Kirim daftar ucapan (terbaru dulu) untuk ditampilkan di halaman */
function doGet() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return json_({ status: "ok", wishes: [] });

  var values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var wishes = [];
  for (var i = values.length - 1; i >= 0 && wishes.length < MAX_WISHES; i--) {
    var row = values[i];
    if (!row[4]) continue; // lewati yang tidak menulis ucapan
    wishes.push({
      name: String(row[1]),
      attendance: String(row[2]),
      message: String(row[4]),
    });
  }
  return json_({ status: "ok", wishes: wishes });
}
