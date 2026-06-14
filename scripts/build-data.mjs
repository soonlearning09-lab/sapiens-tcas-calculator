// build-data.mjs — ดึงข้อมูลจริงจาก mytcas.com แล้วรวมเป็นไฟล์เดียว public/data/programs.json
//
// แหล่งข้อมูล (สาธารณะ, CORS เปิด — ดู memory/mytcas-real-data-api.md):
//   ดัชนีหลักสูตร : https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/courses.json
//   รายละเอียด    : https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/ly-programs/{program_id}.json
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
  let noDetail = 0;
  let failed = 0;

  const queue = [...courses];
  async function worker() {
    while (queue.length) {
      const c = queue.shift();
      const meta = pickIndex(c);
      try {
        const arr = await getJSON(`${BASE}/ly-programs/${c.program_id}.json`);
        if (!Array.isArray(arr) || arr.length === 0) {
          noDetail++;
        } else {
          for (const it of arr) {
            const hasScores = it.scores && Object.keys(it.scores).length > 0;
            if (hasScores) withScores++;
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
    programs_without_detail: noDetail,
    failed,
  };
  await writeFile(join(OUT_DIR, 'programs.meta.json'), JSON.stringify(meta, null, 2));

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n✓ เสร็จสิ้น');
  console.log(`  records        : ${records.length}`);
  console.log(`  มีสัดส่วนคะแนน  : ${withScores}`);
  console.log(`  ไม่มีรายละเอียด : ${noDetail}`);
  console.log(`  ล้มเหลว        : ${failed}`);
  console.log(`  เวลา           : ${secs}s`);
  console.log(`  ไฟล์           : public/data/programs.json`);
}

run().catch((e) => {
  console.error('build-data ล้มเหลว:', e);
  process.exit(1);
});
