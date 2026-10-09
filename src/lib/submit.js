/**
 * src/lib/submit.js
 * JSONBin.io backend for Aashiyana 3.0 registrations.
 *
 * Free plan limits (more than enough for 150–200 participants):
 *   - 10,000 API requests / month
 *   - Unlimited bins
 *   - Each registration = 1 GET + 1 PUT = 2 requests → 400 total for 200 participants
 *
 * SETUP:
 *   1. Go to https://jsonbin.io → sign up (free)
 *   2. Create a new Bin → set initial value to: []
 *   3. Copy the Bin ID and Master Key
 *   4. Add to .env:
 *        VITE_JSONBIN_BIN_ID=your_bin_id_here
 *        VITE_JSONBIN_MASTER_KEY=$2a$10$your_master_key_here
 */

const BASE = "https://api.jsonbin.io/v3/b";

function headers() {
  return {
    "Content-Type": "application/json",
    "X-Master-Key": import.meta.env.VITE_JSONBIN_MASTER_KEY || "",
    "X-Bin-Versioning": "false", // disable versioning to save API calls
  };
}

function binUrl() {
  const id = import.meta.env.VITE_JSONBIN_BIN_ID || "";
  if (!id) throw new Error("VITE_JSONBIN_BIN_ID is not set in .env");
  return `${BASE}/${id}`;
}

/** Fetch all registrations from the bin */
export async function fetchRegistrations() {
  const res = await fetch(binUrl(), { headers: headers() });
  if (!res.ok) throw new Error(`JSONBin GET failed: ${res.status}`);
  const json = await res.json();
  const raw = json.record;
  if (Array.isArray(raw)) {
    return raw.filter((r) => r && r.id && r.id !== "init" && !r._init);
  }
  if (raw && Array.isArray(raw.registrations)) {
    return raw.registrations.filter((r) => r && r.id && r.id !== "init" && !r._init);
  }
  return [];
}

/** Write the full registrations array back to the bin */
async function saveRegistrations(records) {
  // If array is empty, save [{ _init: true }] to prevent JSONBin "Bin cannot be blank" 400 error
  const payload = records.length === 0 ? [{ _init: true }] : records;
  const res = await fetch(binUrl(), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`JSONBin PUT failed: ${res.status}`);
  return res.json();
}

/**
 * Submit a new registration.
 * Reads current list, checks for duplicate USN+event, appends, writes back.
 *
 * @param {Object} formData
 * @returns {Promise<{ id: string }>} — unique registration ID
 */
export async function submitRegistration(formData) {
  // 1. Read existing records
  const existing = await fetchRegistrations();

  // 2. Duplicate check (same USN already registered for one of the chosen events)
  const usn = formData.usn.trim().toUpperCase();
  const chosenEvents = formData.participation ?? [];

  const dup = existing.find((r) => {
    if (r.usn !== usn) return false;
    const registeredFor = (r.events ?? "").split(",").map((s) => s.trim());
    return chosenEvents.some((ev) => registeredFor.includes(ev));
  });

  if (dup) {
    const dupEvents = chosenEvents.filter((ev) =>
      (dup.events ?? "").split(",").map((s) => s.trim()).includes(ev)
    );
    throw new Error(
      `You (${usn}) are already registered for: ${dupEvents.join(", ")}.`
    );
  }

  // 3. Build the new record
  const id = `ASH3-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const record = {
    id,
    timestamp: new Date().toISOString(),
    name: formData.fullName?.trim(),
    year: formData.year,
    usn,
    institution: formData.institution?.trim(),
    events: chosenEvents.join(", "),
    teamName: formData.teamName?.trim() || "",
    members: formData.teamMembers?.filter(Boolean).join(", ") || "",
    numberOfMembers: formData.numberOfMembers || "",
    phone: formData.phone?.trim() || "",
    checkedIn: false,
  };

  // 4. Append and save
  await saveRegistrations([...existing, record]);
  return { id };
}

/**
 * Toggle check-in status for a registration (admin use).
 * @param {string} regId
 * @param {boolean} checked
 */
export async function toggleCheckIn(regId, checked) {
  const existing = await fetchRegistrations();
  const updated = existing.map((r) =>
    r.id === regId ? { ...r, checkedIn: checked } : r
  );
  await saveRegistrations(updated);
}

/**
 * Delete a registration by ID (admin use).
 * @param {string} regId
 */
export async function deleteRegistration(regId) {
  const existing = await fetchRegistrations();
  await saveRegistrations(existing.filter((r) => r.id !== regId));
}
