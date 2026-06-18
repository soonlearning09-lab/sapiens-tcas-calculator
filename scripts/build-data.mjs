// build-data.mjs — ดึงข้อมูลจริงจาก mytcas.com แล้วรวมเป็นไฟล์เดียว public/data/programs.json
//
// แหล่งข้อมูล (สาธารณะ, CORS เปิด — ดู memory/mytcas-real-data-api.md):
//   ดัชนีหลักสูตร : https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/courses.json
//   รายละเอียด    : https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/ly-programs/{program_id}.json
//   เกณฑ์รายรอบ   : https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/rounds/{program_id}.json
//                   (ใช้รอบ 3 Admission = type ขึ้นต้น "3_" → คุณสมบัติพื้นฐาน + คะแนนรวมขั้นต่ำ)
//
// วิธีรัน:  node scripts/build-data.mjs
// ผลลัพธ์:  public/data/programs.json  (+ programs.meta.json)

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'data');

const BASE = 'https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; sapiens-tutor-tcas/1.0)' };
const CONCURRENCY = 20;
const RETRY = 6;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const r2 = (n) => (typeof n === 'number' ? Math.round(n * 100) / 100 : null);

async function getJSON(url, tries = RETRY) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: HEADERS });
      // 404/403 = ไม่มีไฟล์ ly-programs (หลักสูตรนี้ยังไม่ประกาศเกณฑ์/ไม่มีข้อมูลทำนาย) — ไม่ใช่ error
      if (r.status === 404 || r.status === 403) return null;
      if (!r.ok) throw new Error('HTTP ' + r.status); // 429/5xx → retry
      return await r.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      // exponential backoff + jitter (กัน S3 throttle)
      await sleep(500 * 2 ** i + Math.floor(Math.random() * 300));
    }
  }
}

// normalize major/project id ("0"/""/undefined ถือว่า "0") เพื่อ join rounds ↔ ly-programs
const nid = (v) => (v === undefined || v === null || v === '' || v === '0' ? '0' : String(v));

// รหัสวิชาที่เทียบกับคะแนนดิบผู้ใช้ได้ (สเกลตรง) — ตัด variant _tscore/_pr/cefr/toeic
const SUBJ_RE = /^(gpax|gpa2\d|tgat[123]?|tpat([1345]|1[1-3]|2[1-3])|a_lv_\d{2})$/;

// แกะ score_conditions → เกณฑ์ขั้นต่ำรายวิชา + กลุ่มผลรวม
//   min_<code>: ค่า                                   → ขั้นต่ำรายวิชา
//   subject_names + score_minimum (ค่าเดียว, หลายวิชา) → ผลรวมกลุ่ม ≥ ค่า
//   subject_names + score_minimum (list ยาวเท่าวิชา)   → ขั้นต่ำรายวิชา (กระจายเข้า map)
function parseScoreConditions(sc) {
  if (!sc || typeof sc !== 'object') return null;
  const minMap = {};
  const groups = [];
  const setMin = (code, n) => {
    if (code === 'gpax') return; // จัดการที่ min_gpax ระดับบนแล้ว
    if (SUBJ_RE.test(code) && n > 0) minMap[code] = Math.max(minMap[code] || 0, n);
  };
  for (const [k, v] of Object.entries(sc)) {
    if (k === 'subject_names' || k === 'score_minimum' || k === 'score_condition') continue;
    if (k.startsWith('min_')) setMin(k.slice(4), Number(v));
  }
  if (sc.subject_names && sc.score_minimum != null) {
    const codes = String(sc.subject_names)
      .trim()
      .split(/\s+/)
      .map((t) => t.replace(/^min_/, ''))
      .filter((c) => SUBJ_RE.test(c));
    const mins = String(sc.score_minimum).trim().split(/\s+/).map(Number).filter((n) => !Number.isNaN(n));
    if (codes.length && mins.length === codes.length && codes.length > 1) {
      codes.forEach((c, i) => setMin(c, mins[i])); // list ขนาน → รายวิชา
    } else if (codes.length && mins.length === 1 && mins[0] > 0) {
      if (codes.length === 1) setMin(codes[0], mins[0]);
      else groups.push({ codes, min: mins[0] }); // ค่าเดียว หลายวิชา → ผลรวม
    }
  }
  const out = {};
  if (Object.keys(minMap).length) out.subj_min = minMap;
  if (groups.length) out.subj_groups = groups;
  return Object.keys(out).length ? out : null;
}

// แปลง 1 เอนทรีรอบ 3 → คุณสมบัติพื้นฐานแบบกระชับ (เก็บเฉพาะที่มีค่า)
//   flags only_*: 1 = รับ, 2 = ไม่รับ → เก็บเฉพาะรายการที่รับ (accepts)
function toQual(e) {
  if (!e) return null;
  const accepts = [];
  if (e.only_formal === 1) accepts.push('formal'); // หลักสูตรแกนกลาง
  if (e.only_international === 1) accepts.push('inter'); // หลักสูตรนานาชาติ
  if (e.only_vocational === 1) accepts.push('voc'); // หลักสูตรอาชีวะ
  if (e.only_non_formal === 1) accepts.push('nonformal'); // หลักสูตรตามอัธยาศัย (กศน.)
  if (e.only_ged === 1) accepts.push('ged'); // GED
  const q = {};
  if (accepts.length) q.accepts = accepts;
  const mt = r2(e.min_total_score);
  if (mt && mt > 0) q.min_total = mt; // คะแนนรวมขั้นต่ำ
  const mg = r2(e.min_gpax);
  if (mg && mg > 0 && mg <= 4) q.min_gpax = mg; // GPAX ขั้นต่ำ (>4 = ค่า sentinel ไม่กำหนด)
  const sc = parseScoreConditions(e.score_conditions);
  if (sc) Object.assign(q, sc); // subj_min / subj_groups
  const cond = String(e.condition || '').replace(/\s+/g, ' ').trim();
  if (cond && cond !== '-' && cond.length > 3) q.cond = cond.slice(0, 300); // หมายเหตุ free-text
  return Object.keys(q).length ? q : null;
}

// เลือกเอนทรีรอบ 3 ให้ตรงกับ (major_id, project_id) ของ record; fallback = เอนทรีเดียว/ตัวแรก
function qualFor(r3list, majorId, projectId) {
  if (!r3list || !r3list.length) return null;
  const k = nid(majorId) + '__' + nid(projectId);
  let e = r3list.find((x) => nid(x.major_id) + '__' + nid(x.project_id) === k);
  if (!e) e = r3list.find((x) => nid(x.major_id) === nid(majorId));
  if (!e) e = r3list[0]; // เอนทรีระดับหลักสูตร (ไม่มี major/project) หรือ default
  return toQual(e);
}

// เก็บเฉพาะ field ที่ใช้ในแอป เพื่อคุมขนาดไฟล์
function pickIndex(c) {
  return {
    university_id: c.university_id,
    university_type_name_th: c.university_type_name_th,
    university_name_th: c.university_name_th,
    university_name_en: c.university_name_en,
    campus_name_th: c.campus_name_th,
    faculty_name_th: c.faculty_name_th,
    faculty_name_en: c.faculty_name_en,
    field_name_th: c.field_name_th,
    group_field_th: c.group_field_th,
    cost: c.cost,
    graduate_rate: c.graduate_rate,
    employment_rate: c.employment_rate,
    median_salary: c.median_salary,
  };
}

async function run() {
  const t0 = Date.now();
  console.log('▶ โหลดดัชนีหลักสูตร courses.json ...');
  const idx = await getJSON(BASE + '/courses.json');
  const courses = Array.isArray(idx) ? idx : idx.data || [];
  console.log(`  พบ ${courses.length} program_id`);

  const records = [];
  let done = 0;
  let withScores = 0;
  let withQual = 0;
  let noDetail = 0;
  let failed = 0;

  const queue = [...courses];
  async function worker() {
    while (queue.length) {
      const c = queue.shift();
      const meta = pickIndex(c);
      try {
        // ดึงรายละเอียดสาขา + เกณฑ์รายรอบพร้อมกัน
        const [arr, rounds] = await Promise.all([
          getJSON(`${BASE}/ly-programs/${c.program_id}.json`),
          getJSON(`${BASE}/rounds/${c.program_id}.json`),
        ]);
        const r3list = Array.isArray(rounds)
          ? rounds.filter((x) => String(x.type || '').startsWith('3_'))
          : [];
        if (!Array.isArray(arr) || arr.length === 0) {
          noDetail++;
        } else {
          for (const it of arr) {
            const hasScores = it.scores && Object.keys(it.scores).length > 0;
            if (hasScores) withScores++;
            const qual = qualFor(r3list, it.major_id, it.project_id);
            if (qual) withQual++;
            records.push({
              program_id: it.program_id ?? c.program_id,
              major_id: it.major_id ?? '0',
              project_id: it.project_id ?? '0',
              program_name_th: it.program_name_th || '',
              program_type_name_th: it.program_type_name_th || '',
              major_name_th: it.major_name_th && it.major_name_th !== '0' ? it.major_name_th : '',
              project_name_th: it.project_name_th && it.project_name_th !== '0' ? it.project_name_th : '',
              min_score: r2(it.min_score),
              max_score: r2(it.max_score),
              est_min_score_mean: r2(it.est_min_score_mean),
              receive_student_number: it.receive_student_number ?? null,
              scores: it.scores || null,
              ...(qual ? { qual } : null),
              ...meta,
            });
          }
        }
      } catch (e) {
        failed++;
      }
      if (++done % 250 === 0) {
        console.log(`  ${done}/${courses.length}  (records=${records.length}, fail=${failed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, 'programs.json'), JSON.stringify(records));
  const meta = {
    generated_at: new Date().toISOString(),
    source: BASE,
    course_count: courses.length,
    record_count: records.length,
    records_with_scores: withScores,
    records_with_qual: withQual,
    programs_without_detail: noDetail,
    failed,
  };
  await writeFile(join(OUT_DIR, 'programs.meta.json'), JSON.stringify(meta, null, 2));

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n✓ เสร็จสิ้น');
  console.log(`  records        : ${records.length}`);
  console.log(`  มีสัดส่วนคะแนน  : ${withScores}`);
  console.log(`  มีคุณสมบัติรอบ3 : ${withQual}`);
  console.log(`  ไม่มีรายละเอียด : ${noDetail}`);
  console.log(`  ล้มเหลว        : ${failed}`);
  console.log(`  เวลา           : ${secs}s`);
  console.log(`  ไฟล์           : public/data/programs.json`);
}

run().catch((e) => {
  console.error('build-data ล้มเหลว:', e);
  process.exit(1);
});
