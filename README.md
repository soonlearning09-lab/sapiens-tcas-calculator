# 🎓 SAPIENS TUTOR — เครื่องคำนวณโอกาสติดคณะ TCAS

เว็บแอป (มือถือ + คอมพิวเตอร์) กรอกคะแนนสอบ → คำนวณโอกาสติดคณะ โดยใช้ **ข้อมูลจริงจาก mytcas.com (TCAS69)** ทั้งสัดส่วนคะแนนทางการและคะแนนต่ำสุดย้อนหลังของแต่ละหลักสูตร

ฟีเจอร์หลัก:
1. กรอกคะแนน (GPAX / TGAT / TPAT / A-Level)
2. เลือกคณะที่สนใจได้สูงสุด 10 อันดับ → ดูโอกาสติด/ไม่ติดของแต่ละอันดับ
3. **แนะนำคณะทั้งหมดที่คะแนนถึง** จากหลักสูตรจริง ~6,900 รายการ — กรองตามมหาวิทยาลัย / ประเภทหลักสูตร / ระดับโอกาส และค้นหาได้
4. **แชร์ผลผ่านลิงก์** (เข้ารหัสคะแนน+คณะใน URL) และ **จำค่าที่กรอกอัตโนมัติ** (localStorage)

> ⚠️ คะแนนต่ำสุด/สูงสุดเป็นข้อมูลปีที่ผ่านมา ใช้ประเมินแนวโน้ม ควรตรวจสอบเกณฑ์ล่าสุดที่ mytcas.com อีกครั้ง

---

## สถาปัตยกรรม

แอปเป็น **static web (React + Vite) ไม่มี backend ตอนรันจริง**

- **ชั้นข้อมูล** — สคริปต์ `scripts/build-data.mjs` ดึงข้อมูลจริงจาก mytcas (สาธารณะ, CORS เปิด) แล้วรวมเป็นไฟล์เดียว `public/data/programs.json`
  - ดัชนีหลักสูตร: `…/mytcas/courses.json` (4,921 program_id)
  - รายละเอียด+สัดส่วนคะแนน+คะแนนต่ำสุด: `…/mytcas/ly-programs/{program_id}.json`
- **ชั้นแอป** — โหลด `programs.json` ครั้งเดียว แล้วค้นหา/กรอง/คำนวณทั้งหมดในเบราว์เซอร์

ไฟล์ข้อมูลดิบ ~10 MB แต่ gzip เหลือ ~0.4 MB (host static ทั่วไปบีบอัตโนมัติ)

```
scripts/build-data.mjs   ← crawler รวมข้อมูล
public/data/programs.json ← ข้อมูลที่ generate (commit ไว้)
src/lib/subjects.js      ← รหัสวิชา TCAS → ชื่อไทย + สเกล (GPAX ×25)
src/lib/calculator.js    ← ถ่วงน้ำหนัก + กฎ cal_* (เลือกวิชาดีสุด) → เทียบ min_score จริง
src/pages/InputPage.jsx  ← หน้ากรอกคะแนน + เลือกคณะ
src/pages/ResultsPage.jsx← หน้าผลลัพธ์ + ตัวกรอง
_legacy/                 ← โค้ด LINE bot เดิม (เก็บอ้างอิง)
```

---

## การใช้งาน

```bash
npm install
npm run build:data   # ดึงข้อมูลล่าสุดจาก mytcas (รันเมื่ออยากอัปเดต ใช้เวลา~1-2 นาที)
npm run dev          # เปิด dev server
npm run build        # build เป็น static ใน dist/
npm run preview      # ดู build จริง
```

deploy โฟลเดอร์ `dist/` ขึ้น GitHub Pages / Cloudflare Pages / Netlify ได้ฟรี

### อัปเดตข้อมูลอัตโนมัติ (ทางเลือก)
ตั้ง GitHub Actions รัน `npm run build:data` ตามรอบ (เช่นรายสัปดาห์) แล้ว commit `programs.json` — เว็บจะได้ข้อมูลใหม่โดยไม่ต้องแก้โค้ด

---

## หมายเหตุข้อมูล (`programs.meta.json`)
สร้างอัตโนมัติทุกครั้งที่รัน `build:data` บอกจำนวนหลักสูตร, จำนวนที่มีคะแนนต่ำสุด, และเวลาที่ดึงข้อมูล
