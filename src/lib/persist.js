// บันทึก/กู้คืนคะแนน+คณะที่เลือก ผ่าน localStorage และลิงก์แชร์ (?d=...)
const KEY = 'sapiens_tcas_state_v1';

function encode(obj) {
  // base64url ของ JSON (รองรับภาษาไทย)
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decode(s) {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// อ่านสถานะเริ่มต้น: ลิงก์แชร์ก่อน แล้วค่อย localStorage
export function loadInitialState() {
  const params = new URLSearchParams(window.location.search);
  const d = params.get('d');
  if (d) {
    const obj = decode(d);
    if (obj) return { scores: obj.s || {}, picks: obj.p || [] };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      return { scores: obj.scores || {}, picks: obj.picks || [] };
    }
  } catch {
    /* ignore */
  }
  return { scores: {}, picks: [] };
}

export function saveState(scores, picks) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ scores, picks }));
  } catch {
    /* ignore */
  }
}

export function buildShareUrl(scores, picks) {
  const d = encode({ s: scores, p: picks });
  const base = window.location.origin + window.location.pathname;
  return `${base}?d=${d}`;
}
