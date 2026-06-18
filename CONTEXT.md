# CONTEXT.md — บันทึกสำหรับพัฒนาต่อ

เอกสารนี้สรุปสถาปัตยกรรม ข้อมูล และการตัดสินใจสำคัญ เพื่อให้กลับมาทำต่อได้เร็ว
(README.md = คู่มือผู้ใช้/วิธีรัน · ไฟล์นี้ = บริบทเชิงเทคนิคสำหรับ dev)

อัปเดตล่าสุด: 2026-06-14

**🔴 LIVE:** https://soonlearning09-lab.github.io/sapiens-tcas-calculator/
(repo: `soonlearning09-lab/sapiens-tcas-calculator` · public · GitHub Pages ผ่าน Actions)

**งานล่าสุด (2026-06-14, รอบ deploy):**
1. ✅ Deploy ขึ้น GitHub Pages (Actions) + auto-refresh ข้อมูลรายสัปดาห์
2. ✅ **PWA** — ติดตั้งบนคอม/มือถือได้ + ใช้ offline (vite-plugin-pwa)
3. ✅ **clamp คะแนน** ทุกช่องไม่ให้เกินเต็ม (สอบ /100, GPAX /4) + แสดง "/เต็ม"
4. ✅ **แยก TPAT1 เป็น 3 พาร์ท** (เชาวน์ปัญญา/จริยธรรมแพทย์/ความคิดเชื่อมโยง) + derive ตัวรวม
5. ✅ **เลือกคณะแบบ cascading dropdown** (มหาลัย→คณะ→หลักสูตร) แทนช่องค้นหา
6. ✅ **ประวัติคะแนนต่ำสุด 4 ปี (66–69)** จากไฟล์ Excel ทปอ. → กราฟในการ์ดผล

---

## 1. โปรเจคนี้คืออะไร / ประวัติ

เดิมเป็น **LINE Bot + LIFF** คำนวณคะแนน TCAS จากฐานข้อมูลคณะที่ทำมือ (ประมาณการ 48 คณะ)

**Pivot (มิ.ย. 2026):** ทิ้ง LINE bot ทั้งหมด → ทำเป็น **เว็บแอป static (React + Vite) ที่ใช้ข้อมูลจริงจาก mytcas.com**
- โค้ด LINE เดิมย้ายไปโฟลเดอร์ `_legacy/` (เก็บอ้างอิงดีไซน์ — `results.html`/`stats.html` เป็นต้นแบบแบรนด์ SAPIENS TUTOR)
- แบรนด์: **SAPIENS TUTOR** (ธีมแดง `#921b1b`)

ฟีเจอร์หลัก: กรอกคะแนน (clamp ไม่เกินเต็ม) → เลือกคณะได้ถึง 10 อันดับ ผ่าน **dropdown มหาลัย→คณะ→หลักสูตร** (ดูโอกาสติด + **กราฟคะแนนต่ำสุด 4 ปีย้อนหลัง**) + **แนะนำคณะทั้งหมดที่คะแนนถึง** (กรองตามมหาลัย/ประเภท/ระดับโอกาส) + แชร์ผลผ่านลิงก์ + **ติดตั้งเป็นแอป (PWA)**

---

## 2. สถาปัตยกรรม

**Static web ไม่มี backend ตอนรันจริง** — แบ่ง 2 ชั้น:

1. **ชั้นข้อมูล (build-time):**
   - `scripts/build-data.mjs` ดึงข้อมูลจริงจาก mytcas → `public/data/programs.json` (+ `programs.meta.json`) · `npm run build:data`
   - `scripts/build-history.py` รวมคะแนนย้อนหลัง 4 ปีจาก Excel ทปอ. (`data/*.xlsx`) → `public/data/history.json` · `python scripts/build-history.py` (รันครั้งเดียวต่อปี — ข้อมูลปีเก่าไม่เปลี่ยน)
2. **ชั้นแอป (runtime):** React โหลด `programs.json` + `history.json` ครั้งเดียว แล้วค้นหา/กรอง/คำนวณทั้งหมดในเบราว์เซอร์ · เป็น **PWA** (service worker cache ข้อมูล → ใช้ offline ได้หลังเปิดครั้งแรก)

> ทำไมต้อง pre-build ข้อมูล: ฟีเจอร์ "คณะทั้งหมดที่คะแนนถึง" ต้องรู้น้ำหนัก+คะแนนต่ำสุดของ **ทุกสาขา** ซึ่งอยู่ในไฟล์รายสาขา (`ly-programs/{id}.json`) — ไม่มี endpoint รวม และ browser ยิงทีละ ~4,900 ครั้งต่อ visit ไม่ได้ จึงต้องรวมไว้ล่วงหน้า

---

## 3. แหล่งข้อมูล mytcas (สาธารณะ, CORS เปิด `*`, ไม่ต้อง auth)

ค้นพบจากการแกะ `course.mytcas.com` (เป็น Create-React-App) — config ฝังใน `static/js/main.*.chunk.js`:

| ชื่อใน config | URL |
|---|---|
| `apiBaseUrl` | `https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas` |
| `apiVenueUrl` | `https://assets.mytcas.com/69` |
| `previewBaseUrl` | `https://tcas65.as.r.appspot.com` (live API; `/programs/` ต้อง auth, `/universities` เปิด) |

**ที่ใช้จริง:**
- ดัชนีหลักสูตร: `{apiBaseUrl}/courses.json` (~6MB, 4,921 program_id) — มี ชื่อมหาลัย/วิทยาเขต/คณะ/สาขา (TH+EN), จำนวนรับ, ค่าเทอม, อัตราจบ/ได้งาน, เงินเดือนมัธยฐาน
- รายละเอียดต่อสาขา: `{apiBaseUrl}/ly-programs/{program_id}.json` — array (1 element ต่อ major/project) แต่ละตัวมี `scores` (น้ำหนักทางการ), `min_score`/`max_score` (จริง), `est_min_score_mean` (ทำนาย), `receive_student_number`
- **เกณฑ์รายรอบ:** `{apiBaseUrl}/rounds/{program_id}.json` — array หลายเอนทรี (รอบ×โครงการ); `type` ขึ้นต้น `"1_"/"2_"/"3_"/"4_"` = รอบ (รอบ 3 = Admission ที่แอปคำนวณ) แต่ละตัวมี `min_total_score` (คะแนนรวมขั้นต่ำ), `min_gpax`, flags `only_formal/only_international/only_vocational/only_non_formal/only_ged` (**1=รับ, 2=ไม่รับ**), `grad_current`, `t_score`. ป้ายทางการ (จาก bundle): formal=รร.หลักสูตรแกนกลาง · international=นานาชาติ · vocational=อาชีวะ · non_formal=ตามอัธยาศัย(กศน.) · ged=GED. รอบ 3 ส่วนใหญ่มีเอนทรีเดียว (ระดับหลักสูตร ไม่มี major/project); บางหลักสูตรแยกหลายเอนทรี → join ด้วย (major_id, project_id)
  - **`score_conditions`** (ในเอนทรีรอบ): เกณฑ์ขั้นต่ำรายวิชา — `min_<code>: ค่า` (เช่น `min_a_lv_61: 30` = คณิต1 ≥ 30) + กลุ่มผลรวม `subject_names`(รายการ `min_<code>`) + `score_minimum` (**ค่าเดียว+หลายวิชา = ผลรวม ≥ ค่า** เช่น ฟิสิกส์+เคมี+ชีวะ ≥ 90 ของแพทย์ กสพท; **list ยาวเท่าวิชา = ขั้นต่ำรายวิชา**). variant `_tscore`/`_pr`/`cefr`/`toeic` = สเกลต่าง (เทียบคะแนนดิบไม่ได้) → **ตัดทิ้ง**. ฟิลด์ `condition` = หมายเหตุ free-text (เก็บไว้แสดง)
- **403/404 = หลักสูตรนั้นยังไม่ประกาศเกณฑ์** (ปกติ ~834 รายการ) — ไม่ใช่ error

> ⚠️ `programs.json` (ไฟล์ที่ generate) มี hash ของ chunk URL ฝังในความรู้นี้ — ถ้า mytcas deploy ใหม่ ชื่อ chunk (`main.198bc51d.chunk.js`) จะเปลี่ยน แต่ **endpoint ข้อมูล (S3) ไม่เปลี่ยน** crawler จึงยังทำงานได้

**คะแนนย้อนหลัง — API ไม่มี! ใช้ Excel ทางการ ทปอ. แทน:**
- ตรวจครบแล้ว (S3, live API `appspot`, year-paths, bucket listing) — endpoint สาธารณะมีคะแนน **ปีเดียว** (ปี 68; ยืนยันว่า `min_score`=59.98 ตรงกับ Excel ปี 68)
- ไฟล์ Excel `data/TCAS66/67/69_maxmin.xlsx` + `T68-stat-...xlsx` (เก็บใน repo) — ทุกไฟล์มีคอลัมน์ **`รหัสหลักสูตร`** (= program_id) ใช้ join ได้ตรง
- ปี 69/65 มีคอลัมน์ `รหัสสาขา`/`รหัสโครงการ` ด้วย → join แม่นยำกว่า; ปี 66–68 มีแค่ program_id + ชื่อ `สาขา/วิชาเอก` (ตรงกับ `major_name_th` ใช้แยกหลายสาขา)
- `build-history.py` กรองค่า `min ≤ 0` ทิ้ง (= ไม่มีรายงานคะแนน)

---

## 4. โครงสร้างข้อมูล 1 record ใน `programs.json`

```jsonc
{
  "program_id": "10010121300001A", "major_id": "0", "project_id": "0",
  "program_name_th": "...", "program_type_name_th": "ภาษาไทย ปกติ",
  "major_name_th": "", "project_name_th": "",
  "min_score": 59.98, "max_score": 82.6, "est_min_score_mean": 58.23,
  "receive_student_number": 390,
  "scores": { "tgat": 20, "tpat3": 30, "a_lv_61": 20, "a_lv_64": 20, "a_lv_65": 10 },
  // คุณสมบัติพื้นฐานรอบ 3 (จาก rounds/*.json — มีเมื่อพบเอนทรี; เก็บเฉพาะ field ที่มีค่า):
  "qual": {
    "accepts": ["formal","inter","voc","nonformal","ged"], "min_total": 51, "min_gpax": 2,
    "subj_min": { "a_lv_61": 30, "a_lv_82": 30 },                 // ขั้นต่ำรายวิชา (code→ค่า)
    "subj_groups": [{ "codes": ["a_lv_64","a_lv_65","a_lv_66"], "min": 90 }], // ผลรวมกลุ่ม ≥ min
    "cond": "(คะแนนขั้นต่ำ...ฟิสิกส์+เคมี+ชีวะหาร3>=30%)..."      // หมายเหตุ free-text (≤300 ตัว)
  },
  // + metadata จาก courses.json:
  "university_id", "university_type_name_th", "university_name_th"/"_en",
  "campus_name_th", "faculty_name_th"/"_en", "field_name_th", "group_field_th",
  "cost", "graduate_rate", "employment_rate", "median_salary"
}
```
ปัจจุบัน: **6,899 records · 5,954 มี min_score · 6,836 มี qual · 74 มหาวิทยาลัย · 5 ประเภท** (ทปอ./มรภ./มทร./เอกชน/สมทบ)
- `qual.accepts` = รหัสหลักสูตรที่รับ (`formal/inter/voc/nonformal/ged`) · `min_total`/`min_gpax` เก็บเฉพาะเมื่อ >0 (min_gpax กรอง >4 = sentinel) · `subj_min`/`subj_groups`/`cond` จาก `score_conditions` (ดู §3) · แสดงใน `ResultCard` (`<Qualifications/>`) พร้อม warning "ไม่ถึง/ได้ N" เมื่อคะแนนผู้ใช้ < ขั้นต่ำ (เทียบกับ `withDerivedScores` เพื่อให้ tgat/tpat1 ถูก)
- distribution: subj_min 3,067 · subj_groups 203 · cond 4,143 records · ไฟล์ raw ~11.7MB / **gzip ~0.45MB**

**`history.json`** (แยกไฟล์, ~424KB) keyed ด้วย `_key` (=`program_id__major_id__project_id`):
```jsonc
"10010121300001A__0__0": { "66":{"min":54.15,"max":80.83}, "67":{...}, "68":{...}, "69":{...} }
```
**3,461 records มีประวัติ · 2,107 ครบ 4 ปี** · app แนบเข้า record เป็นฟิลด์ `_history` (ดู `useProgramData.js`)

---

## 5. กฎการคำนวณ (ตรวจสอบกับตารางทางการของ mytcas แล้ว)

**รหัสวิชา** อยู่ใน `src/lib/subjects.js` (ยืนยันครบทุก key ที่ปรากฏจริง — ดู memory `mytcas-real-data-api`):
- `gpax`, `gpax5/6_score`, `gpa21..29` → **max_value = 4** → scale ×25
- `tgat`, `tgat1/2/3`, `tpat1`+`tpat11/12/13`, `tpat2`+`tpat21/22/23`, `tpat3/4/5` → max 100
  - **TGAT แยก 3 พาร์ทในฟอร์ม:** `tgat1/2/3` (group `'TGAT'`) — ตัวรวม `tgat` ซ่อน (group `'พิเศษ'`) ผู้ใช้กรอกแค่ 3 พาร์ท → `withDerivedScores()` คำนวณ `tgat = ค่าเฉลี่ย 3 พาร์ทที่กรอก` ให้หลักสูตรที่อ้างอิง tgat รวมยังคำนวณได้ (`TGAT_PARTS` ใน subjects.js)
  - **TPAT1 แยก 3 พาร์ทในฟอร์ม:** `tpat11` เชาวน์ปัญญา · `tpat12` จริยธรรมแพทย์ · `tpat13` ความคิดเชื่อมโยง (group `'TPAT'`) — ตัวรวม `tpat1` ซ่อน (group `'พิเศษ'`) แต่ `withDerivedScores()` ใน calculator คำนวณ `tpat1 = ค่าเฉลี่ย 3 พาร์ทที่กรอก` ให้ ~24 หลักสูตรที่อ้างอิง tpat1 รวมยังคำนวณได้
  - ตัวรวมที่ derive ทั้งสอง (`tgat`, `tpat1`) รวมในตาราง `DERIVED` ใน `calculator.js`
- `a_lv_61`=คณิต1, `_62`=คณิต2, `_63`=วิทย์, `_64`=ฟิสิกส์, `_65`=เคมี, `_66`=ชีวะ, `_70`=สังคมศาสตร์, `_81`=ไทย, `_82`=อังกฤษ, `_83..89`=ภาษาที่2 → max 100
- สอบเฉพาะมหาลัย (ไม่ขึ้นฟอร์ม, group `'พิเศษ'`): `su001-4`, `tu0xx`, `vnet_51`, `ged_score`

**การแปลงสเกล:** `score100 = rawValue / max_value × 100` (เทียบเท่า GPAX × 25) — ยืนยันถูกต้อง
**clamp คะแนนกรอก:** `clampScore()` ใน `subjects.js` บีบค่าให้อยู่ใน 0..max ของวิชา (ตอนพิมพ์) — ฟอร์มแสดง "/เต็ม" ต่อช่อง

**การถ่วงน้ำหนัก** (`src/lib/calculator.js` → `evaluateProgram`):
- รวม `score100 × weight / 100` ของทุก component → ได้ total สเกล 0-100 เทียบกับ `min_score` ได้ตรง
- **กฎ `cal_*`** (`cal_type`/`cal_score_sum`/`cal_subject_name`): "เลือกคะแนนวิชาที่ดีที่สุด" จากกลุ่มวิชา × น้ำหนัก `cal_score_sum`
  - `cal_type` = "1" เสมอ (905/905 รายการ) → ใช้ best-of อย่างเดียว ถูกต้อง
- `priority_score` = ไม่นับเป็นวิชา (อยู่ใน `NON_SUBJECT_KEYS`)
- `coverage` = สัดส่วนน้ำหนักที่ผู้ใช้กรอกจริง; ถ้า < 50% → สถานะ `incomplete`

**เกณฑ์สถานะ** (เทียบ `diff = total − min_score`): `safe` (≥+3) · `pass` (≥0) · `close` (≥−2) · `fail` (<−2) · `incomplete` · `unknown`
"คะแนนถึง/มีโอกาส" = `isReachable` = safe|pass|close

**เรียงลำดับรายการ "คณะที่คะแนนถึง"** (`SORTS` ใน ResultsPage): ส่วนต่างมาก→น้อย (default) · ส่วนต่างน้อย→มาก · อันดับมหาวิทยาลัย (SCImago SIR 2024 จาก `uniRanking.js` — มหาลัยไม่ติด SIR = Infinity เรียงท้าย, tie-break ด้วยส่วนต่าง). อัปเดตปี SIR ใหม่: แก้ map ใน `uniRanking.js` (scimagoir.com ติด Cloudflare ดึงตรงไม่ได้ — ใช้ฉบับ republish เช่น thaiedunews.net)

---

## 6. แผนผังไฟล์

```
scripts/build-data.mjs    crawler → public/data/programs.json (+ .meta.json)
scripts/build-history.py  Excel ทปอ. (data/*.xlsx) → public/data/history.json (join ด้วยรหัสหลักสูตร)
data/*.xlsx               ไฟล์ผลคัดเลือกทางการ ทปอ. ปี 65–69 (ต้นทางของ history.json)
src/main.jsx              entry
src/App.jsx               state กลาง (scores, picks, view) + persistence + <InstallPrompt/>
src/lib/subjects.js       ตารางรหัสวิชา + toScale100 + clampScore + TPAT1_PARTS
src/lib/calculator.js     evaluateProgram, withDerivedScores (tgat/tpat1), isReachable, STATUS_INFO
src/lib/uniRanking.js     อันดับมหาวิทยาลัย SCImago SIR 2024 (UNI_SIR_RANK keyed ด้วย university_id) → ตัวเลือกเรียง "อันดับมหาวิทยาลัย" ในหน้าผล
src/lib/useProgramData.js โหลด+enrich programs.json + history.json (เพิ่ม _key/_name/_uni/_search/_history)
src/lib/persist.js        localStorage + ลิงก์แชร์ (?d=base64)
src/components/InstallPrompt.jsx  ปุ่มติดตั้ง PWA (beforeinstallprompt) + คำแนะนำ iOS
src/pages/InputPage.jsx   ฟอร์มคะแนน (clamp/แสดงเต็ม) + cascading dropdown เลือกคณะ 10 อันดับ
src/pages/ResultsPage.jsx แท็บผล + กราฟ <ScoreHistory/> (คะแนนต่ำสุด 4 ปี) + ปุ่มแชร์
src/styles.css            design system SAPIENS (ตัวแปร --red ฯลฯ) + .hist / .cascade / .install-*
public/logo.svg + *.png   ไอคอน PWA (สร้างด้วย pwa-assets-generator)
vite.config.js            base './' + VitePWA (manifest + service worker + runtime cache)
.github/workflows/deploy.yml        build + deploy GitHub Pages ทุก push main
.github/workflows/refresh-data.yml  ดึงข้อมูลใหม่รายสัปดาห์ + commit (ไม่แตะ history.json)
_legacy/                  โค้ด LINE bot เดิม (อ้างอิงดีไซน์)
```

---

## 7. รัน / อัปเดต / deploy

```bash
npm install
npm run build:data   # ดึงข้อมูล mytcas ใหม่ (~1-2 นาที; concurrency 20)
npm run dev          # dev server (เปิด browser อัตโนมัติ พอร์ต 5173)
npm run build        # → dist/  (vite base: './' + สร้าง service worker/manifest)
npm run preview      # ดู build จริง
python scripts/build-history.py   # รวมคะแนนย้อนหลังใหม่ (เมื่อมีไฟล์ Excel ปีใหม่) ต้อง pip install openpyxl pandas
```
ขนาดไฟล์ข้อมูล: programs.json raw ~9.3MB / **gzip ~0.34MB** · history.json ~424KB · JS bundle ~54KB gzip
**PWA:** `vite-plugin-pwa` (registerType autoUpdate) — precache app shell (~190KB) + runtime StaleWhileRevalidate สำหรับ `data/*.json` (ใช้ offline หลังเปิดครั้งแรก)

**Deploy (ทำแล้ว — GitHub Pages ผ่าน Actions):**
- repo: `soonlearning09-lab/sapiens-tcas-calculator` (public) · live: https://soonlearning09-lab.github.io/sapiens-tcas-calculator/
- `.github/workflows/deploy.yml` → build + deploy ทุก push `main` (และ workflow_dispatch). ใช้ `actions/upload-pages-artifact` + `deploy-pages`
- `.github/workflows/refresh-data.yml` ดึงข้อมูล mytcas ทุกอาทิตย์ → commit `public/data` → trigger deploy ใหม่อัตโนมัติ
- ยืนยันแล้ว: index 200, `data/programs.json` เสิร์ฟ gzip ~0.4MB
- ⚠️ GitHub บังคับ Actions เป็น Node.js 24 ตั้งแต่ 2026-06-16 — action versions ปัจจุบันยังรันได้ แต่ควรอัปเกรดในอนาคต

---

## 8. สิ่งที่ตรวจสอบแล้ว (verified) — ไม่ต้องทำซ้ำ

- ✅ A-Level code mapping ตรงตารางทางการใน bundle ของ mytcas
- ✅ GPAX ×25 ถูกต้อง (max_value=4 → normalize 0-100)
- ✅ `cal_type` = "1" ทั้งหมด → best-of รูปแบบเดียว
- ✅ ทุก score key ที่ปรากฏจริง มีใน `subjects.js` ครบ
- ✅ ผลคำนวณ monotonic + ไม่มี total เกิน 100 / NaN
- ✅ build ผ่าน, preview เสิร์ฟ index + data + ลิงก์แชร์ ได้
- ✅ deploy live (GitHub Pages) เสิร์ฟ index/programs/history/sw/manifest/icons ได้ (200 ทั้งหมด)
- ✅ derive `tpat1` = ค่าเฉลี่ย 3 พาร์ท (ทดสอบ 80/70/60→70, contrib ถูก)
- ✅ clamp คะแนน (gpax 5→4, tgat 150→100, ติดลบ→0)
- ✅ join history ด้วยรหัสหลักสูตร (66:2426/67:2616/68:2872/69:3312 รายการ) — ค่าตรวจสมเหตุผล

---

## 9. ข้อจำกัด & ไอเดียทำต่อ

- คะแนนต่ำสุดเป็นข้อมูล **ผลคัดเลือกปีก่อน ๆ** ใช้ประเมินแนวโน้ม ไม่ใช่การรับรองว่าติด
- ~834 program_id ยังไม่มีไฟล์ ly-programs (จะมีเพิ่มเมื่อ mytcas อัปเดต)
- สอบเฉพาะมหาลัย (su/tu/vnet/ged) ไม่มีช่องกรอก → หลักสูตรนั้นจะขึ้น `incomplete` ถ้าใช้วิชาเหล่านี้เป็นหลัก
- ประวัติคะแนนครอบคลุม 3,461/6,899 records (ที่เหลือไม่มีในไฟล์ Excel หรือ join ไม่ได้) · กราฟต้องมี ≥2 ปีจึงแสดง
- ปีใหม่ (เช่น TCAS70): วางไฟล์ Excel ใน `data/` แล้วเพิ่มปีใน `YEARS` ของ `build-history.py` + รันใหม่ (เพิ่มปี 65 ก็ทำได้เหมือนกัน)
- **ไอเดียทำต่อ:** เพิ่มปี 65 เข้ากราฟ · ลดขนาด `programs.json` ด้วย lookup table · หน้า detail ต่อหลักสูตร · export ผลเป็นรูป/PDF · อัปเกรด GitHub Actions รองรับ Node 24 (บังคับ 2026-06-16)

หมายเหตุ: Claude มี memory เพิ่มเติมที่โหลดอัตโนมัติทุก session — `mytcas-real-data-api` และ `pivot-to-realtime-calculator`
