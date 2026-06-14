# CONTEXT.md — บันทึกสำหรับพัฒนาต่อ

เอกสารนี้สรุปสถาปัตยกรรม ข้อมูล และการตัดสินใจสำคัญ เพื่อให้กลับมาทำต่อได้เร็ว
(README.md = คู่มือผู้ใช้/วิธีรัน · ไฟล์นี้ = บริบทเชิงเทคนิคสำหรับ dev)

อัปเดตล่าสุด: 2026-06-14

**🔴 LIVE:** https://soonlearning09-lab.github.io/sapiens-tcas-calculator/
(repo: `soonlearning09-lab/sapiens-tcas-calculator` · public · GitHub Pages ผ่าน Actions)

---

## 1. โปรเจคนี้คืออะไร / ประวัติ

เดิมเป็น **LINE Bot + LIFF** คำนวณคะแนน TCAS จากฐานข้อมูลคณะที่ทำมือ (ประมาณการ 48 คณะ)

**Pivot (มิ.ย. 2026):** ทิ้ง LINE bot ทั้งหมด → ทำเป็น **เว็บแอป static (React + Vite) ที่ใช้ข้อมูลจริงจาก mytcas.com**
- โค้ด LINE เดิมย้ายไปโฟลเดอร์ `_legacy/` (เก็บอ้างอิงดีไซน์ — `results.html`/`stats.html` เป็นต้นแบบแบรนด์ SAPIENS TUTOR)
- แบรนด์: **SAPIENS TUTOR** (ธีมแดง `#921b1b`)

ฟีเจอร์หลัก: กรอกคะแนน → เลือกคณะได้ถึง 10 อันดับ (ดูโอกาสติด) + **แนะนำคณะทั้งหมดที่คะแนนถึง** (กรองตามมหาลัย/ประเภท/ระดับโอกาส) + แชร์ผลผ่านลิงก์

---

## 2. สถาปัตยกรรม

**Static web ไม่มี backend ตอนรันจริง** — แบ่ง 2 ชั้น:

1. **ชั้นข้อมูล (build-time):** `scripts/build-data.mjs` ดึงข้อมูลจริงจาก mytcas แล้วรวมเป็น `public/data/programs.json` (+ `programs.meta.json`) รันด้วย `npm run build:data`
2. **ชั้นแอป (runtime):** React โหลด `programs.json` ครั้งเดียว แล้วค้นหา/กรอง/คำนวณทั้งหมดในเบราว์เซอร์

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
- **403/404 = หลักสูตรนั้นยังไม่ประกาศเกณฑ์** (ปกติ ~834 รายการ) — ไม่ใช่ error

> ⚠️ `programs.json` (ไฟล์ที่ generate) มี hash ของ chunk URL ฝังในความรู้นี้ — ถ้า mytcas deploy ใหม่ ชื่อ chunk (`main.198bc51d.chunk.js`) จะเปลี่ยน แต่ **endpoint ข้อมูล (S3) ไม่เปลี่ยน** crawler จึงยังทำงานได้

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
  // + metadata จาก courses.json:
  "university_id", "university_type_name_th", "university_name_th"/"_en",
  "campus_name_th", "faculty_name_th"/"_en", "field_name_th", "group_field_th",
  "cost", "graduate_rate", "employment_rate", "median_salary"
}
```
ปัจจุบัน: **6,899 records · 5,954 มี min_score · 74 มหาวิทยาลัย · 5 ประเภท** (ทปอ./มรภ./มทร./เอกชน/สมทบ)

---

## 5. กฎการคำนวณ (ตรวจสอบกับตารางทางการของ mytcas แล้ว)

**รหัสวิชา** อยู่ใน `src/lib/subjects.js` (ยืนยันครบทุก key ที่ปรากฏจริง — ดู memory `mytcas-real-data-api`):
- `gpax`, `gpax5/6_score`, `gpa21..29` → **max_value = 4** → scale ×25
- `tgat`, `tgat1/2/3`, `tpat1`+`tpat11/12/13`, `tpat2`+`tpat21/22/23`, `tpat3/4/5` → max 100
- `a_lv_61`=คณิต1, `_62`=คณิต2, `_63`=วิทย์, `_64`=ฟิสิกส์, `_65`=เคมี, `_66`=ชีวะ, `_70`=สังคมศาสตร์, `_81`=ไทย, `_82`=อังกฤษ, `_83..89`=ภาษาที่2 → max 100
- สอบเฉพาะมหาลัย (ไม่ขึ้นฟอร์ม, group `'พิเศษ'`): `su001-4`, `tu0xx`, `vnet_51`, `ged_score`

**การแปลงสเกล:** `score100 = rawValue / max_value × 100` (เทียบเท่า GPAX × 25) — ยืนยันถูกต้อง

**การถ่วงน้ำหนัก** (`src/lib/calculator.js` → `evaluateProgram`):
- รวม `score100 × weight / 100` ของทุก component → ได้ total สเกล 0-100 เทียบกับ `min_score` ได้ตรง
- **กฎ `cal_*`** (`cal_type`/`cal_score_sum`/`cal_subject_name`): "เลือกคะแนนวิชาที่ดีที่สุด" จากกลุ่มวิชา × น้ำหนัก `cal_score_sum`
  - `cal_type` = "1" เสมอ (905/905 รายการ) → ใช้ best-of อย่างเดียว ถูกต้อง
- `priority_score` = ไม่นับเป็นวิชา (อยู่ใน `NON_SUBJECT_KEYS`)
- `coverage` = สัดส่วนน้ำหนักที่ผู้ใช้กรอกจริง; ถ้า < 50% → สถานะ `incomplete`

**เกณฑ์สถานะ** (เทียบ `diff = total − min_score`): `safe` (≥+3) · `pass` (≥0) · `close` (≥−2) · `fail` (<−2) · `incomplete` · `unknown`
"คะแนนถึง/มีโอกาส" = `isReachable` = safe|pass|close

---

## 6. แผนผังไฟล์

```
scripts/build-data.mjs    crawler → public/data/programs.json (+ .meta.json)
src/main.jsx              entry
src/App.jsx               state กลาง (scores, picks, view) + persistence
src/lib/subjects.js       ตารางรหัสวิชา + toScale100
src/lib/calculator.js     evaluateProgram, isReachable, STATUS_INFO
src/lib/useProgramData.js โหลด+enrich programs.json (เพิ่ม _key/_name/_uni/_search)
src/lib/persist.js        localStorage + ลิงก์แชร์ (?d=base64)
src/pages/InputPage.jsx   ฟอร์มคะแนน (กลุ่มยุบได้) + ค้นหา/เลือกคณะ 10 อันดับ
src/pages/ResultsPage.jsx แท็บ "อันดับที่เลือก" + "คณะที่คะแนนถึง" (ตัวกรอง) + ปุ่มแชร์
src/styles.css            design system SAPIENS (ตัวแปร --red ฯลฯ)
.github/workflows/refresh-data.yml  ดึงข้อมูลใหม่รายสัปดาห์ + commit
_legacy/                  โค้ด LINE bot เดิม (อ้างอิงดีไซน์)
```

---

## 7. รัน / อัปเดต / deploy

```bash
npm install
npm run build:data   # ดึงข้อมูล mytcas ใหม่ (~1-2 นาที; concurrency 20)
npm run dev          # dev server (เปิด browser อัตโนมัติ พอร์ต 5173)
npm run build        # → dist/  (vite base: './' deploy ได้ทั้ง root และ subpath)
npm run preview      # ดู build จริง
```
ขนาดไฟล์ข้อมูล: raw ~9.3MB / **gzip ~0.34MB** (host static บีบอัตโนมัติ) · JS bundle 53KB gzip

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

---

## 9. ข้อจำกัด & ไอเดียทำต่อ

- คะแนนต่ำสุดเป็นข้อมูล **ปีที่ผ่านมา** ใช้ประเมินแนวโน้ม ไม่ใช่การรับรองว่าติด
- ~834 program_id ยังไม่มีไฟล์ ly-programs (จะมีเพิ่มเมื่อ mytcas อัปเดต)
- สอบเฉพาะมหาลัย (su/tu/vnet/ged) ไม่มีช่องกรอก → หลักสูตรนั้นจะขึ้น `incomplete` ถ้าใช้วิชาเหล่านี้เป็นหลัก
- **ไอเดีย:** ลดขนาด `programs.json` ด้วย lookup table (ชื่อมหาลัย/คณะซ้ำเยอะ) · หน้า detail ต่อหลักสูตร (ดึง breakdown สด) · export ผลเป็นรูป/PDF · กราฟแนวโน้มคะแนน · deploy จริง (GitHub Pages/Cloudflare Pages) · ตรวจ max_value จริงของ su/tu/vnet

หมายเหตุ: Claude มี memory เพิ่มเติมที่โหลดอัตโนมัติทุก session — `mytcas-real-data-api` และ `pivot-to-realtime-calculator`
