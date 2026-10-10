// ─── Aashiyana – All editable content lives here ───────────────────────────

// ── JSONBin.io config ────────────────────────────────────────────────────────
// 1. Go to https://jsonbin.io → sign up (free)
// 2. Create a new Bin with initial value: []
// 3. Copy your Bin ID and Master Key below (or use .env):
export const jsonbin = {
  binId: import.meta.env.VITE_JSONBIN_BIN_ID || "",      // e.g. "665abc123def456"
  masterKey: import.meta.env.VITE_JSONBIN_MASTER_KEY || "", // e.g. "$2a$10$..."
};

// ── Admin credentials ─────────────────────────────────────────────────────────
export const admin = {
  username: "admin",
  password: "aashiyana2026", // change this before going live!
};

export const event = {
  name: "Aashiyana",
  version: "",
  label: "Annual Celebration",
  year: 2026,
  date: "17 October 2026",
  isoDate: "2026-10-17T18:00:00+05:30",
  timing: "6:00 PM onwards",
  venue: "College Auditorium",
  institution: "",
  committee: "Cultural Committee",
  registrationDeadline: "2026-10-14", // YYYY-MM-DD
  tagline: "Join us for an unforgettable evening!",
  about:
    "Aashiyana is our annual night for everyone who has something to perform, share, or simply cheer for.",
  aboutParagraph:
    "Whether you are stepping on stage for the first time or returning to the spotlight, Aashiyana is the place to be. Expect an evening packed with music, dance, drama, comedy and everything in between — all under one roof, one night.",
};

// Events that require a team — must match names in `lineup` exactly
export const teamEvents = ["Group Dancing", "Group Singing", "Skit / Drama"];

export const lineup = [
  { id: 1, name: "Solo Dancing", team: false },
  { id: 2, name: "Group Dancing", team: true },
  { id: 3, name: "Solo Singing", team: false },
  { id: 4, name: "Group Singing", team: true },
  { id: 5, name: "Skit / Drama", team: true },
  { id: 6, name: "Mimicry", team: false },
  { id: 7, name: "Poetry / Shayari", team: false },
  { id: 8, name: "Stand-up Comedy", team: false },
  { id: 9, name: "Musical Chairs", team: false },
  { id: 10, name: "Unique Skill / Performance", team: false },
  { id: 11, name: "Mime", team: false },
];

export const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Other"];

export const contacts = [
  {
    name: "Coordinator Name 1",
    role: "Student Coordinator",
    phone: "+91 00000 00000",
    whatsapp: "910000000000",
  },
  {
    name: "Coordinator Name 2",
    role: "Cultural Committee",
    phone: "+91 00000 00001",
    whatsapp: "910000000001",
  },
];

export const social = {
  instagram: "https://instagram.com/yourhandle",
  whatsapp: "https://wa.me/910000000000",
};
