// TEMPLATE. Copy to Config.local.gs, fill in, and paste it into Apps Script. Private settings for the Forest Volunteers (FV) API. Paste this as a second file (Config.local.gs) in the FV Apps Script project.
// Kept out of GitHub (.gitignore). Passwords are stored only as salted SHA-256 hashes (the same accounts as UPMC2).
const LOCAL_CONFIG = {
  SHEET_ID: '',   // leave empty: fvSetup() creates the "Forest Volunteers" sheet and remembers it
  ACCOUNTS: {
    // username: { role: 'operator' or 'admin', name: 'Shown name', salt: '<random>', hash: '<sha256(salt + password)>' },
  },
};

/** Helper: run makeHash('newpassword') from the editor; copy the logged salt and hash into ACCOUNTS. */
function makeHash(pw) {
  const salt = Utilities.getUuid().replace(/-/g, '');
  Logger.log(JSON.stringify({ salt, hash: sha256hex_(salt + pw) }));
}
