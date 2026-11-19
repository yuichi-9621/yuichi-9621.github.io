// Opens the resume that tools/lock-resume.mjs encrypted. A wrong code fails the
// AES-GCM check, so the PDF never exists in the page without the right one.
const ITER = 600000;
// The claude.ai preview only serves known file types, so it names the file resume.wasm.
const FILE = import.meta.env.VITE_RESUME_FILE || 'resume.bin';

export async function unlockResume(code) {
  const res = await fetch(`${import.meta.env.BASE_URL}${FILE}`);
  if (!res.ok) throw new Error('missing');
  const buf = new Uint8Array(await res.arrayBuffer());
  const salt = buf.slice(0, 16), iv = buf.slice(16, 28), data = buf.slice(28);
  const pass = new TextEncoder().encode(code.trim().toLowerCase());
  const base = await crypto.subtle.importKey('raw', pass, 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  return new Blob([await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)], { type: 'application/pdf' });
}
