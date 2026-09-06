/**
 * Family Emergency Vault - Google Sheet sync backend.
 *
 * Stores the SAME encrypted blob the vault app already keeps in this
 * browser's localStorage. This script never sees plaintext as long as the
 * vault has a master password set - it just relays and stores ciphertext.
 *
 * Setup:
 * 1. Create a new Google Sheet.
 * 2. Extensions -> Apps Script, delete the sample code, paste this file.
 * 3. (Optional but recommended) Project Settings -> Script Properties ->
 *    add a property named SECRET_KEY with a long random value. Put the same
 *    value into the vault app's "Cloud sync" -> "Secret key" field. This
 *    stops anyone who finds your Web App URL from reading or overwriting
 *    the sheet.
 * 4. Deploy -> New deployment -> type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    (This URL is your endpoint; it acts like a password if you did not
 *    set SECRET_KEY, so don't share it.)
 * 5. Copy the Web App URL into the vault app's Cloud sync settings.
 */

const SHEET_LATEST = 'Latest';
const SHEET_HISTORY = 'History';

function getSheets_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let latest = ss.getSheetByName(SHEET_LATEST);
  if (!latest){
    latest = ss.insertSheet(SHEET_LATEST);
    latest.appendRow(['updatedAt', 'recordJson']);
  }
  let history = ss.getSheetByName(SHEET_HISTORY);
  if (!history){
    history = ss.insertSheet(SHEET_HISTORY);
    history.appendRow(['updatedAt', 'recordJson']);
  }
  return { latest, history };
}

function checkSecret_(providedKey){
  const expected = PropertiesService.getScriptProperties().getProperty('SECRET_KEY');
  if (!expected) return true; // no secret configured - open to anyone with the URL
  return providedKey === expected;
}

function jsonOut_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e){
  const key = (e && e.parameter && e.parameter.key) || '';
  if (!checkSecret_(key)) return jsonOut_({ error: 'unauthorized' });

  const { latest } = getSheets_();
  const lastRow = latest.getLastRow();
  if (lastRow < 2) return jsonOut_({ empty: true });

  const row = latest.getRange(lastRow, 1, 1, 2).getValues()[0];
  const updatedAt = row[0];
  let record;
  try{ record = JSON.parse(row[1]); }catch(err){ return jsonOut_({ empty: true }); }
  return jsonOut_({ empty: false, updatedAt: updatedAt, record: record });
}

function doPost(e){
  let payload;
  try{ payload = JSON.parse(e.postData.contents); }catch(err){ return jsonOut_({ error: 'bad_request' }); }

  if (!checkSecret_(payload.secretKey || '')) return jsonOut_({ error: 'unauthorized' });
  if (!payload.record) return jsonOut_({ error: 'missing_record' });

  const { latest, history } = getSheets_();
  const updatedAt = payload.updatedAt || Date.now();
  const recordJson = JSON.stringify(payload.record);

  if (latest.getLastRow() < 2){
    latest.appendRow([updatedAt, recordJson]);
  } else {
    latest.getRange(2, 1, 1, 2).setValues([[updatedAt, recordJson]]);
  }
  history.appendRow([updatedAt, recordJson]);

  return jsonOut_({ ok: true });
}
