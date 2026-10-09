/**
 * Aashiyana 3.0 – Google Apps Script
 * File: apps-script/Code.gs
 *
 * SETUP STEPS:
 * 1. Go to https://script.google.com and create a new project.
 * 2. Paste this entire file into the editor.
 * 3. Replace SHEET_ID with your Google Sheet's ID (from its URL).
 * 4. Click "Deploy" → "New deployment" → type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Click "Deploy" and copy the Web App URL.
 * 6. Paste the URL into your .env file as VITE_SHEET_ENDPOINT.
 * 7. On first run, authorise the script when prompted.
 *
 * SHEET COLUMNS (Row 1 headers):
 * Timestamp | Name | Year | USN | Institution | Events | Team Name | Members | Phone
 */

const SHEET_ID = "YOUR_GOOGLE_SHEET_ID_HERE";
const SHEET_NAME = "Registrations"; // Change if needed

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Name",
        "Year",
        "USN",
        "Institution",
        "Events",
        "Team Name",
        "Members",
        "Phone",
      ]);
    }

    // ── Duplicate check ─────────────────────────────────────────────────────
    const usn = (data.usn || "").trim().toUpperCase();
    const events = (data.events || "").split(",").map((s) => s.trim());

    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      const existingUsn = (existing[i][3] || "").toString().trim().toUpperCase();
      if (existingUsn === usn) {
        const existingEvents = (existing[i][5] || "")
          .toString()
          .split(",")
          .map((s) => s.trim());
        const duplicateEvents = events.filter((ev) =>
          existingEvents.includes(ev)
        );
        if (duplicateEvents.length > 0) {
          return ContentService.createTextOutput(
            JSON.stringify({
              status: "duplicate",
              message: `You are already registered for: ${duplicateEvents.join(", ")}.`,
            })
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || "",
      data.year || "",
      usn,
      data.institution || "",
      data.events || "",
      data.teamName || "",
      data.members || "",
      data.phone || "",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", message: "Registered successfully." })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Allow GET for a quick health-check ping
function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok", app: "Aashiyana 3.0 Registration" })
  ).setMimeType(ContentService.MimeType.JSON);
}
