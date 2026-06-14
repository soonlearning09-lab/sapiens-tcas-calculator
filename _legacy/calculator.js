// โมดูลคำนวณคะแนน TCAS
const { FACULTIES } = require('../data/faculties');

// ชื่อวิชาเต็มสำหรับแสดงผล
const SUBJECT_NAMES = {
  tgat: 'TGAT (เฉลี่ย)',
  tgat1: 'TGAT1 อังกฤษ',
  tgat2: 'TGAT2 เหตุผล',
  tgat3: 'TGAT3 สมรรถนะ',
  tpat1: 'TPAT1 กสพท',
  tpat2: 'TPAT2 ศิลปกรรม',
  tpat3: 'TPAT3 วิทย์-วิศวะ',
  tpat4: 'TPAT4 สถาปัตย์',
  tpat5: 'TPAT5 ครุศาสตร์',
  math1: 'คณิต 1',
  math2: 'คณิต 2',
  sci: 'วิทย์ประยุกต์',
  phy: 'ฟิสิกส์',
  chem: 'เคมี',
  bio: 'ชีววิทยา',
  soc: 'สังคม',
  thai: 'ไทย',
  eng: 'อังกฤษ',
  fre: 'ฝรั่งเศส',
  ger: 'เยอรมัน',
  jpn: 'ญี่ปุ่น',
  chn: 'จีน',
  kor: 'เกาหลี',
};

function getTgatAvg(scores) {
  const vals = [scores.tgat1, scores.tgat2, scores.tgat3].filter(v => v > 0);
  if (vals.length === 0) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function calcFaculty(fac, scores) {
  let total = 0;
  let totalWeight = 0;
  const breakdown = [];

  for (const [key, w] of Object.entries(fac.weights)) {
    let score;
    if (key === 'tgat') {
      score = getTgatAvg(scores);
    } else {
      score = scores[key] || 0;
    }
    const contrib = (score * w) / 100;
    total += contrib;
    totalWeight += w;
    breakdown.push({ key, name: SUBJECT_NAMES[key] || key, weight: w, score, contrib });
  }

  // normalize to 100 if weights don't sum to 100
  if (totalWeight > 0 && totalWeight !== 100) {
    total = (total * 100) / totalWeight;
  }

  const avgMin = fac.min.reduce((s, v) => s + v, 0) / fac.min.length;
  const maxMin = Math.max(...fac.min);
  const diff = total - avgMin;

  let status;
  if (diff >= 3) status = 'pass';       // มีโอกาสสูง
  else if (diff >= 0) status = 'close'; // ก้ำกึ่ง
  else status = 'fail';                  // ต่ำกว่าเกณฑ์

  return {
    total: Math.round(total * 100) / 100,
    avgMin: Math.round(avgMin * 100) / 100,
    maxMin: Math.round(maxMin * 100) / 100,
    diff: Math.round(diff * 100) / 100,
    status,
    breakdown,
    history: fac.min,
  };
}

function analyze(scores, facultyIds) {
  const results = [];
  facultyIds.forEach((id, idx) => {
    const fac = FACULTIES.find(f => f.id === id);
    if (!fac) return;
    const r = calcFaculty(fac, scores);
    results.push({
      rank: idx + 1,
      id: fac.id,
      name: fac.name,
      uni: fac.uni,
      ...r,
    });
  });

  const passCount = results.filter(r => r.status !== 'fail').length;
  return { results, passCount, total: results.length };
}

module.exports = { analyze, calcFaculty, SUBJECT_NAMES };
