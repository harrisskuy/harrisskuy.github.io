/**
 * ============================================================
 *  Code.gs — Backend Google Apps Script untuk Trading Journal
 * ============================================================
 *  Cara pakai:
 *  1. Buat Google Spreadsheet baru, beri nama bebas (mis. "Trading Journal DB").
 *  2. Buat satu sheet/tab bernama "Journal" (harus sama dengan
 *     CONFIG.SHEET_NAME di config.js).
 *  3. Buka Extensions > Apps Script, hapus isi default, tempel kode ini.
 *  4. Ganti nilai APP_TOKEN di bawah dengan token rahasia Anda sendiri
 *     — HARUS SAMA PERSIS dengan APP_TOKEN di config.js.
 *  5. Deploy > New deployment > pilih tipe "Web app".
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  6. Salin URL Web App yang diberikan (diakhiri /exec), lalu tempel
 *     ke GAS_WEB_APP_URL di config.js.
 *  7. Setiap kali Anda MENGUBAH kode ini, buat deployment BARU
 *     (atau gunakan "Manage deployments" > Edit > New version) agar
 *     perubahan berlaku pada URL yang sama.
 * ============================================================
 */

const APP_TOKEN = "ganti-dengan-token-rahasia-anda"; // harus sama dengan config.js
const SHEET_NAME = "Journal";

const COLUMNS = [
  "id", "datetime", "pair", "type", "lot", "entry", "exit",
  "sl", "tp", "pips", "pnl", "strategy", "psychology",
  "screenshot", "notes",
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkToken_(token) {
  return token === APP_TOKEN;
}

/**
 * GET — dipanggil browser/fetch dengan ?action=list&token=...
 * Mengembalikan seluruh data journal untuk mengisi tabel & dashboard.
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    if (!checkToken_(params.token)) {
      return jsonResponse_({ status: "error", message: "Token tidak valid." });
    }

    if (params.action === "list") {
      const sheet = getSheet_();
      const values = sheet.getDataRange().getValues();
      const headers = values.shift() || [];
      const data = values
        .filter((row) => row[0] !== "") // lewati baris kosong
        .map((row) => {
          const obj = {};
          headers.forEach((h, i) => (obj[h] = row[i]));
          // Pastikan format datetime konsisten sebagai ISO string
          if (obj.datetime instanceof Date) {
            obj.datetime = Utilities.formatDate(
              obj.datetime, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm"
            );
          }
          return obj;
        });
      return jsonResponse_({ status: "success", data: data });
    }

    return jsonResponse_({ status: "error", message: "Action tidak dikenali." });
  } catch (err) {
    return jsonResponse_({ status: "error", message: String(err) });
  }
}

/**
 * POST — dipanggil untuk create / update / delete.
 * Body dikirim sebagai text/plain berisi JSON (menghindari CORS preflight).
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (!checkToken_(body.token)) {
      return jsonResponse_({ status: "error", message: "Token tidak valid." });
    }

    const sheet = getSheet_();

    if (body.action === "create") {
      const d = body.data || {};
      const row = COLUMNS.map((col) => (d[col] !== undefined ? d[col] : ""));
      sheet.appendRow(row);
      return jsonResponse_({ status: "success", message: "Data tersimpan." });
    }

    if (body.action === "update") {
      const id = body.id;
      const d = body.data || {};
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      const idColIndex = headers.indexOf("id");

      for (let r = 1; r < values.length; r++) {
        if (values[r][idColIndex] === id) {
          COLUMNS.forEach((col, i) => {
            if (d[col] !== undefined) {
              sheet.getRange(r + 1, i + 1).setValue(d[col]);
            }
          });
          return jsonResponse_({ status: "success", message: "Data diperbarui." });
        }
      }
      return jsonResponse_({ status: "error", message: "ID tidak ditemukan." });
    }

    if (body.action === "delete") {
      const id = body.id;
      const values = sheet.getDataRange().getValues();
      const idColIndex = values[0].indexOf("id");

      for (let r = 1; r < values.length; r++) {
        if (values[r][idColIndex] === id) {
          sheet.deleteRow(r + 1);
          return jsonResponse_({ status: "success", message: "Data dihapus." });
        }
      }
      return jsonResponse_({ status: "error", message: "ID tidak ditemukan." });
    }

    return jsonResponse_({ status: "error", message: "Action tidak dikenali." });
  } catch (err) {
    return jsonResponse_({ status: "error", message: String(err) });
  }
}
