// ตารางรหัสวิชา TCAS (ตรงกับ key ใน scores ของ mytcas ly-programs)
// อ้างอิงตารางทางการที่ฝังใน bundle ของ course.mytcas.com ({key, max_value, label})
// scale = 100 / max_value : ค่าที่ผู้ใช้กรอกถูกแปลงเป็นสเกล 0-100 ก่อนถ่วงน้ำหนัก (GPAX 0-4 → ×25)
//
// group ที่อยู่ใน GROUP_ORDER เท่านั้นที่จะแสดงเป็นช่องกรอกในฟอร์ม
// ส่วน group 'พิเศษ' = วิชา/สอบเฉพาะที่พบไม่บ่อย — มี metadata ไว้คำนวณ/แสดงผล แต่ไม่ขึ้นฟอร์ม

export const SUBJECTS = {
  // ── GPAX / เกรด (max 4) ──────────────────────
  gpax: { name: 'GPAX (เกรดเฉลี่ยสะสม)', short: 'GPAX', group: 'GPAX', max: 4, scale: 25 },
  gpax5_score: { name: 'GPAX 5 ภาคเรียน', short: 'GPAX5', group: 'พิเศษ', max: 4, scale: 25 },
  gpax6_score: { name: 'GPAX 6 ภาคเรียน', short: 'GPAX6', group: 'พิเศษ', max: 4, scale: 25 },
  gpa21: { name: 'GPA กลุ่มสาระภาษาไทย', short: 'GPA ไทย', group: 'พิเศษ', max: 4, scale: 25 },
  gpa22: { name: 'GPA กลุ่มสาระคณิตศาสตร์', short: 'GPA คณิต', group: 'พิเศษ', max: 4, scale: 25 },
  gpa23: { name: 'GPA กลุ่มสาระวิทยาศาสตร์', short: 'GPA วิทย์', group: 'พิเศษ', max: 4, scale: 25 },
  gpa24: { name: 'GPA กลุ่มสาระสังคมศึกษา', short: 'GPA สังคม', group: 'พิเศษ', max: 4, scale: 25 },
  gpa25: { name: 'GPA กลุ่มสาระสุขศึกษาและพลศึกษา', short: 'GPA สุขศึกษา', group: 'พิเศษ', max: 4, scale: 25 },
  gpa26: { name: 'GPA กลุ่มสาระศิลปะ', short: 'GPA ศิลปะ', group: 'พิเศษ', max: 4, scale: 25 },
  gpa27: { name: 'GPA กลุ่มสาระการงานอาชีพ', short: 'GPA การงาน', group: 'พิเศษ', max: 4, scale: 25 },
  gpa28: { name: 'GPA กลุ่มสาระภาษาต่างประเทศ', short: 'GPA ต่างประเทศ', group: 'พิเศษ', max: 4, scale: 25 },
  gpa29: { name: 'GPA การศึกษาค้นคว้าด้วยตนเอง (IS)', short: 'GPA IS', group: 'พิเศษ', max: 4, scale: 25 },

  // ── TGAT (max 100) ───────────────────────────
  // TGAT แยกเป็น 3 พาร์ทในฟอร์ม — ตัวรวม tgat ไม่ขึ้นฟอร์ม แต่ derive จากค่าเฉลี่ย 3 พาร์ท
  // (ดู deriveScores) เพื่อให้หลักสูตรที่อ้างอิง tgat รวมยังคำนวณได้
  tgat: { name: 'TGAT ความถนัดทั่วไป (รวม)', short: 'TGAT', group: 'พิเศษ', max: 100, scale: 1 },
  tgat1: { name: 'TGAT1 การสื่อสารภาษาอังกฤษ', short: 'TGAT1', group: 'TGAT', max: 100, scale: 1 },
  tgat2: { name: 'TGAT2 การคิดอย่างมีเหตุผล', short: 'TGAT2', group: 'TGAT', max: 100, scale: 1 },
  tgat3: { name: 'TGAT3 สมรรถนะการทำงาน', short: 'TGAT3', group: 'TGAT', max: 100, scale: 1 },

  // ── TPAT (max 100) ───────────────────────────
  // TPAT1 (วิชาเฉพาะ กสพท) แยกเป็น 3 พาร์ทในฟอร์ม — ตัวรวม tpat1 ไม่ขึ้นฟอร์ม
  // แต่ derive จากค่าเฉลี่ย 3 พาร์ท (ดู deriveScores) เพื่อให้หลักสูตรที่อ้างอิง tpat1 ยังคำนวณได้
  tpat1: { name: 'TPAT1 วิชาเฉพาะ กสพท (รวม)', short: 'TPAT1', group: 'พิเศษ', max: 100, scale: 1 },
  tpat11: { name: 'TPAT1 พาร์ท 1 เชาวน์ปัญญา', short: 'TPAT1.1 เชาวน์ปัญญา', group: 'TPAT', max: 100, scale: 1 },
  tpat12: { name: 'TPAT1 พาร์ท 2 จริยธรรมทางการแพทย์', short: 'TPAT1.2 จริยธรรมแพทย์', group: 'TPAT', max: 100, scale: 1 },
  tpat13: { name: 'TPAT1 พาร์ท 3 ความคิดเชื่อมโยง', short: 'TPAT1.3 ความคิดเชื่อมโยง', group: 'TPAT', max: 100, scale: 1 },
  tpat2: { name: 'TPAT2 ความถนัดศิลปกรรมศาสตร์', short: 'TPAT2', group: 'TPAT', max: 100, scale: 1 },
  tpat21: { name: 'TPAT21 ทัศนศิลป์', short: 'TPAT21', group: 'พิเศษ', max: 100, scale: 1 },
  tpat22: { name: 'TPAT22 ดนตรี', short: 'TPAT22', group: 'พิเศษ', max: 100, scale: 1 },
  tpat23: { name: 'TPAT23 นาฏศิลป์', short: 'TPAT23', group: 'พิเศษ', max: 100, scale: 1 },
  tpat3: { name: 'TPAT3 วิทย์ เทคโนโลยี วิศวกรรม', short: 'TPAT3', group: 'TPAT', max: 100, scale: 1 },
  tpat4: { name: 'TPAT4 ความถนัดสถาปัตยกรรม', short: 'TPAT4', group: 'TPAT', max: 100, scale: 1 },
  tpat5: { name: 'TPAT5 ความถนัดครุศาสตร์', short: 'TPAT5', group: 'TPAT', max: 100, scale: 1 },

  // ── A-Level (max 100) ────────────────────────
  a_lv_61: { name: 'A-Level คณิตศาสตร์ประยุกต์ 1', short: 'คณิต 1', group: 'A-Level', max: 100, scale: 1 },
  a_lv_62: { name: 'A-Level คณิตศาสตร์ประยุกต์ 2', short: 'คณิต 2', group: 'A-Level', max: 100, scale: 1 },
  a_lv_63: { name: 'A-Level วิทยาศาสตร์ประยุกต์', short: 'วิทย์', group: 'A-Level', max: 100, scale: 1 },
  a_lv_64: { name: 'A-Level ฟิสิกส์', short: 'ฟิสิกส์', group: 'A-Level', max: 100, scale: 1 },
  a_lv_65: { name: 'A-Level เคมี', short: 'เคมี', group: 'A-Level', max: 100, scale: 1 },
  a_lv_66: { name: 'A-Level ชีววิทยา', short: 'ชีววิทยา', group: 'A-Level', max: 100, scale: 1 },
  a_lv_70: { name: 'A-Level สังคมศาสตร์', short: 'สังคม', group: 'A-Level', max: 100, scale: 1 },
  a_lv_81: { name: 'A-Level ภาษาไทย', short: 'ไทย', group: 'A-Level', max: 100, scale: 1 },
  a_lv_82: { name: 'A-Level ภาษาอังกฤษ', short: 'อังกฤษ', group: 'A-Level', max: 100, scale: 1 },
  a_lv_83: { name: 'A-Level ภาษาฝรั่งเศส', short: 'ฝรั่งเศส', group: 'A-Level (ภาษาที่ 2)', max: 100, scale: 1 },
  a_lv_84: { name: 'A-Level ภาษาเยอรมัน', short: 'เยอรมัน', group: 'A-Level (ภาษาที่ 2)', max: 100, scale: 1 },
  a_lv_85: { name: 'A-Level ภาษาญี่ปุ่น', short: 'ญี่ปุ่น', group: 'A-Level (ภาษาที่ 2)', max: 100, scale: 1 },
  a_lv_86: { name: 'A-Level ภาษาเกาหลี', short: 'เกาหลี', group: 'A-Level (ภาษาที่ 2)', max: 100, scale: 1 },
  a_lv_87: { name: 'A-Level ภาษาจีน', short: 'จีน', group: 'A-Level (ภาษาที่ 2)', max: 100, scale: 1 },
  a_lv_88: { name: 'A-Level ภาษาบาลี', short: 'บาลี', group: 'A-Level (ภาษาที่ 2)', max: 100, scale: 1 },
  a_lv_89: { name: 'A-Level ภาษาสเปน', short: 'สเปน', group: 'A-Level (ภาษาที่ 2)', max: 100, scale: 1 },

  // ── วิชา/สอบเฉพาะมหาวิทยาลัย (พบไม่บ่อย, ไม่ขึ้นฟอร์ม) ──
  vnet_51: { name: 'V-NET', short: 'V-NET', group: 'พิเศษ', max: 100, scale: 1 },
  ged_score: { name: 'GED', short: 'GED', group: 'พิเศษ', max: 100, scale: 1 },
  su001: { name: 'วิชาเฉพาะ SU001', short: 'SU001', group: 'พิเศษ', max: 100, scale: 1 },
  su002: { name: 'วิชาเฉพาะ SU002', short: 'SU002', group: 'พิเศษ', max: 100, scale: 1 },
  su003: { name: 'วิชาเฉพาะ SU003', short: 'SU003', group: 'พิเศษ', max: 100, scale: 1 },
  su004: { name: 'วิชาเฉพาะ SU004', short: 'SU004', group: 'พิเศษ', max: 100, scale: 1 },
  tu002: { name: 'วิชาเฉพาะ มธ. TU002', short: 'TU002', group: 'พิเศษ', max: 100, scale: 1 },
  tu003: { name: 'วิชาเฉพาะ มธ. TU003', short: 'TU003', group: 'พิเศษ', max: 100, scale: 1 },
  tu004: { name: 'วิชาเฉพาะ มธ. TU004', short: 'TU004', group: 'พิเศษ', max: 100, scale: 1 },
  tu005: { name: 'วิชาเฉพาะ มธ. TU005', short: 'TU005', group: 'พิเศษ', max: 100, scale: 1 },
  tu006: { name: 'วิชาเฉพาะ มธ. TU006', short: 'TU006', group: 'พิเศษ', max: 100, scale: 1 },
  tu061: { name: 'วิชาเฉพาะ มธ. TU061', short: 'TU061', group: 'พิเศษ', max: 100, scale: 1 },
  tu062: { name: 'วิชาเฉพาะ มธ. TU062', short: 'TU062', group: 'พิเศษ', max: 100, scale: 1 },
  tu071: { name: 'วิชาเฉพาะ มธ. TU071', short: 'TU071', group: 'พิเศษ', max: 100, scale: 1 },
  tu072: { name: 'วิชาเฉพาะ มธ. TU072', short: 'TU072', group: 'พิเศษ', max: 100, scale: 1 },
};

// key ภายใน scores ที่ไม่ใช่ "วิชา" (เป็นกฎพิเศษหรือ metadata)
export const NON_SUBJECT_KEYS = new Set([
  'cal_type',
  'cal_score_sum',
  'cal_subject_name',
  'priority_score',
]);

// ลำดับกลุ่มที่จะ "แสดงเป็นช่องกรอก" ในฟอร์ม (group 'พิเศษ' ไม่อยู่ในนี้ จึงไม่ขึ้นฟอร์ม)
export const GROUP_ORDER = ['GPAX', 'TGAT', 'TPAT', 'A-Level', 'A-Level (ภาษาที่ 2)'];

export function subjectName(code) {
  return SUBJECTS[code]?.name || code;
}
export function subjectShort(code) {
  return SUBJECTS[code]?.short || code;
}

// แปลงค่าที่ผู้ใช้กรอกให้เป็นสเกล 0-100 (GPAX 0-4 → ×25)
export function toScale100(code, rawValue) {
  const meta = SUBJECTS[code];
  const scale = meta?.scale ?? 1;
  return (Number(rawValue) || 0) * scale;
}

// 3 พาร์ทของ TGAT → ตัวรวม tgat = ค่าเฉลี่ยของพาร์ทที่กรอก (ผู้ใช้กรอกแค่ 3 พาร์ท)
export const TGAT_PARTS = ['tgat1', 'tgat2', 'tgat3'];

// 3 พาร์ทของ TPAT1 (กสพท) ถ่วงน้ำหนักเท่ากัน → ตัวรวม tpat1 = ค่าเฉลี่ยของพาร์ทที่กรอก
export const TPAT1_PARTS = ['tpat11', 'tpat12', 'tpat13'];

// จำกัดค่าที่กรอกให้อยู่ในช่วง 0..max ของวิชานั้น (กันการกรอกเกินคะแนนเต็ม)
// คืนค่าเป็น string เพื่อใช้กับ input โดยตรง; ปล่อยค่าระหว่างพิมพ์ (เช่น '' หรือ '9.') ไว้ตามเดิม
export function clampScore(code, raw) {
  if (raw === '' || raw === null || raw === undefined) return '';
  const n = Number(raw);
  if (Number.isNaN(n)) return raw;
  const max = SUBJECTS[code]?.max ?? 100;
  if (n < 0) return '0';
  if (n > max) return String(max);
  return raw;
}
