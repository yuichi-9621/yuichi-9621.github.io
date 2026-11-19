// track.js — thin wrapper around GoatCounter (privacy-first, cookie-less).
// Dashboard (owner-only): https://yuichiokuhama.goatcounter.com
//
// The count.js script loads async and skips localhost by itself, so dev
// sessions never pollute the numbers. Calls made before the script is ready
// are queued and flushed once it arrives; if it never loads (blocked,
// offline), everything silently no-ops.

const queue = [];
let flushTimer = null;

function gc() {
  return window.goatcounter && typeof window.goatcounter.count === 'function'
    ? window.goatcounter
    : null;
}

function flush() {
  const g = gc();
  if (!g) return;
  while (queue.length) g.count(queue.shift());
  clearInterval(flushTimer);
  flushTimer = null;
}

function send(payload) {
  const g = gc();
  if (g) {
    g.count(payload);
    return;
  }
  queue.push(payload);
  if (!flushTimer) {
    let tries = 0;
    flushTimer = setInterval(() => {
      flush();
      if (++tries > 20) {
        // count.js never arrived — give up quietly
        clearInterval(flushTimer);
        flushTimer = null;
        queue.length = 0;
      }
    }, 500);
  }
}

/** Count a virtual pageview, e.g. track('/panel/work', 'work'). */
export function track(path, title) {
  send({ path, title: title || path, event: false });
}

/** Count a named event, e.g. trackEvent('cmd-liquid'). */
export function trackEvent(name) {
  send({ path: name, event: true });
}
