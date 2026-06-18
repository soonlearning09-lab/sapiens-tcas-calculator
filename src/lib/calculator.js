// ตัวคำนวณคะแนน TCAS — ใช้สัดส่วน (weights) จริงจาก mytcas เทียบกับ min_score จริง
import { SUBJECTS, NON_SUBJECT_KEYS, toScale100, TPAT1_PARTS, TGAT_PARTS } from './subjects.js';

// เกณฑ์สถานะ (เทียบกับคะแนนต่ำสุดจริงของปีก่อน)
const MARGIN_SAFE = 3;   // สูงกว่าต่ำสุด ≥ 3 → โอกาสสูง
const MARGIN_CLOSE = 2;  // ต่ำกว่าต่ำสุดไม่เกิน 2 → ก้ำกึ่ง
const MIN_COVERAGE = 0.5; // ต้องกรอกวิชาที่ใช้รวมน้ำหนัก ≥ 50% จึงนับว่าประเมินได้

function hasValue(v) {
  return v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v));
}

// ตัวรวมที่ derive จากพาร์ทย่อย (ผู้ใช้กรอกเป็นพาร์ท แต่บางหลักสูตรอ้างอิงตัวรวม)
//   tgat  = ค่าเฉลี่ยของ tgat1/2/3
//   tpat1 = ค่าเฉลี่ยของ tpat11/12/13 (กสพท ถ่วงน้ำหนัก 3 พาร์ทเท่ากัน)
const DERIVED = [
  { key: 'tgat', parts: TGAT_PARTS },
  { key: 'tpat1', parts: TPAT1_PARTS },
];

export function withDerivedScores(userScores) {
  if (!userScores) return userScores;
  let out = userScores;
  for (const { key, parts } of DERIVED) {
    if (hasValue(out[key])) continue; // ผู้ใช้/ลิงก์เก่ากรอกตัวรวมมาเองแล้ว
    const present = parts.filter((k) => hasValue(out[k]));
    if (!present.length) continue;
    const avg = present.reduce((s, k) => s + Number(out[k]), 0) / present.length;
    out = { ...out, [key]: avg };
  }
  return out;
}

// แตกสัดส่วนของหลักสูตรออกมาเป็นรายการ component (รองรับกฎ cal_*)
export function programComponents(scores) {
  if (!scores) return [];
  const out = [];
  for (const [key, val] of Object.entries(scores)) {
    if (NON_SUBJECT_KEYS.has(key)) continue;
    const weight = Number(val);
    if (!weight) continue;
    out.push({ type: 'subject', code: key, weight, candidates: [key] });
  }
  // กฎ "เลือกคะแนนดีที่สุดจากกลุ่มวิชา"
  if (scores.cal_subject_name) {
    const candidates = String(scores.cal_subject_name).trim().split(/\s+/).filter(Boolean);
    const weight = Number(scores.cal_score_sum) || 0;
    if (weight && candidates.length) {
      out.push({ type: 'choose', code: 'cal', weight, candidates });
    }
  }
  return out;
}

// ประเมินหลักสูตร 1 รายการกับคะแนนผู้ใช้
// userScores: { code: rawValue }  (gpax กรอก 0-4)
export function evaluateProgram(program, rawUserScores) {
  const userScores = withDerivedScores(rawUserScores);
  const comps = programComponents(program.scores);
  const totalWeight = comps.reduce((s, c) => s + c.weight, 0);

  let total = 0;
  let usedWeight = 0;
  const missing = [];
  const breakdown = [];

  for (const c of comps) {
    let best = 0;
    let filled = false;
    let pickedCode = c.candidates[0];
    for (const code of c.candidates) {
      if (hasValue(userScores[code])) {
        const v = toScale100(code, userScores[code]);
        if (!filled || v > best) { best = v; pickedCode = code; }
        filled = true;
      }
    }
    const contrib = (best * c.weight) / 100;
    if (filled) { total += contrib; usedWeight += c.weight; }
    else missing.push(c);
    breakdown.push({ ...c, pickedCode, score100: best, filled, contrib });
  }

  const coverage = totalWeight > 0 ? usedWeight / totalWeight : 0;
  const min = program.min_score;
  const hasMin = typeof min === 'number' && min > 0;
  const diff = hasMin ? total - min : null;

  let status = 'unknown';
  if (!comps.length || !hasMin) status = 'unknown';
  else if (coverage < MIN_COVERAGE) status = 'incomplete';
  else if (diff >= MARGIN_SAFE) status = 'safe';
  else if (diff >= 0) status = 'pass';
  else if (diff >= -MARGIN_CLOSE) status = 'close';
  else status = 'fail';

  return {
    total: round2(total),
    totalWeight,
    usedWeight,
    coverage,
    min: hasMin ? round2(min) : null,
    max: typeof program.max_score === 'number' ? round2(program.max_score) : null,
    estMin: typeof program.est_min_score_mean === 'number' ? round2(program.est_min_score_mean) : null,
    diff: diff === null ? null : round2(diff),
    status,
    missing,
    breakdown,
  };
}

// นับว่า "มีโอกาสติด" ไหม (ใช้กรองรายการคณะทั้งหมด)
export function isReachable(status) {
  return status === 'safe' || status === 'pass' || status === 'close';
}

export const STATUS_INFO = {
  safe: { label: 'โอกาสสูง', color: '#0F6E56', bg: '#E1F5EE' },
  pass: { label: 'ถึงคะแนนต่ำสุด', color: '#1E7A3E', bg: '#E8F5E9' },
  close: { label: 'ก้ำกึ่ง', color: '#854F0B', bg: '#FAEEDA' },
  fail: { label: 'ต่ำกว่าเกณฑ์', color: '#A32D2D', bg: '#FCEBEB' },
  incomplete: { label: 'กรอกคะแนนไม่ครบ', color: '#666', bg: '#EFEFEF' },
  unknown: { label: 'ไม่มีข้อมูลคะแนนต่ำสุด', color: '#888', bg: '#F2F2F2' },
};

function round2(n) {
  return Math.round(n * 100) / 100;
}
