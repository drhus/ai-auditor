// Lightweight ULID-ish generator — sortable + unique for V0.
// (We don't strictly need ULID spec compliance.)

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateAuditId(): string {
  const t = Date.now();
  let timeChars = "";
  let n = t;
  for (let i = 0; i < 10; i++) {
    timeChars = ALPHABET[n % 32] + timeChars;
    n = Math.floor(n / 32);
  }
  let rand = "";
  for (let i = 0; i < 12; i++) {
    rand += ALPHABET[Math.floor(Math.random() * 32)];
  }
  return `aud_${timeChars}${rand}`;
}
