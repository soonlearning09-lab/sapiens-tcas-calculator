// ฐานข้อมูลคณะ/มหาวิทยาลัย พร้อมสัดส่วนคะแนน (weights) และคะแนนต่ำสุดย้อนหลัง (min)
// อ้างอิงจากเกณฑ์ TCAS67-68 รอบ 3 Admission ที่เผยแพร่ใน mytcas.com
// *** ข้อมูลเป็นตัวอย่างประมาณการ — ตรวจสอบเกณฑ์จริงที่ mytcas.com ก่อนใช้งานจริง ***

const FACULTIES = [
  // ============ แพทยศาสตร์ กสพท ============
  { id: 'med_cu', name: 'แพทยศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย (กสพท)', weights: { tpat1: 30, thai: 14, soc: 14, eng: 14, math1: 14, sci: 14 }, min: [67.85, 68.20, 67.50] },
  { id: 'med_mu_si', name: 'แพทยศาสตร์ศิริราช', uni: 'ม.มหิดล (กสพท)', weights: { tpat1: 30, thai: 14, soc: 14, eng: 14, math1: 14, sci: 14 }, min: [66.90, 67.45, 66.70] },
  { id: 'med_mu_ra', name: 'แพทยศาสตร์รามาธิบดี', uni: 'ม.มหิดล (กสพท)', weights: { tpat1: 30, thai: 14, soc: 14, eng: 14, math1: 14, sci: 14 }, min: [65.80, 66.30, 65.50] },
  { id: 'med_cmu', name: 'แพทยศาสตร์', uni: 'ม.เชียงใหม่ (กสพท)', weights: { tpat1: 30, thai: 14, soc: 14, eng: 14, math1: 14, sci: 14 }, min: [63.20, 64.00, 63.50] },
  { id: 'med_kku', name: 'แพทยศาสตร์', uni: 'ม.ขอนแก่น (กสพท)', weights: { tpat1: 30, thai: 14, soc: 14, eng: 14, math1: 14, sci: 14 }, min: [62.50, 63.10, 62.80] },
  { id: 'dent_cu', name: 'ทันตแพทยศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย (กสพท)', weights: { tpat1: 30, thai: 14, soc: 14, eng: 14, math1: 14, sci: 14 }, min: [63.50, 64.20, 63.80] },
  { id: 'dent_mu', name: 'ทันตแพทยศาสตร์', uni: 'ม.มหิดล (กสพท)', weights: { tpat1: 30, thai: 14, soc: 14, eng: 14, math1: 14, sci: 14 }, min: [62.80, 63.40, 63.00] },
  { id: 'vet_cu', name: 'สัตวแพทยศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย (กสพท)', weights: { tpat1: 30, thai: 14, soc: 14, eng: 14, math1: 14, sci: 14 }, min: [57.50, 58.20, 57.80] },

  // ============ วิศวกรรมศาสตร์ ============
  { id: 'eng_cu', name: 'วิศวกรรมศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 20, tpat3: 30, math1: 25, phy: 15, eng: 10 }, min: [58.50, 59.20, 58.80] },
  { id: 'eng_ku', name: 'วิศวกรรมศาสตร์', uni: 'ม.เกษตรศาสตร์', weights: { tgat: 20, tpat3: 30, math1: 25, phy: 15, eng: 10 }, min: [48.20, 49.50, 48.90] },
  { id: 'eng_tu', name: 'วิศวกรรมศาสตร์', uni: 'ม.ธรรมศาสตร์', weights: { tgat: 20, tpat3: 30, math1: 25, phy: 15, eng: 10 }, min: [50.30, 51.20, 50.70] },
  { id: 'eng_kmitl', name: 'วิศวกรรมศาสตร์', uni: 'สจล. (ลาดกระบัง)', weights: { tgat: 20, tpat3: 30, math1: 30, phy: 20 }, min: [45.50, 46.80, 46.20] },
  { id: 'eng_kmutt', name: 'วิศวกรรมศาสตร์', uni: 'มจธ. (บางมด)', weights: { tgat: 20, tpat3: 30, math1: 25, phy: 15, chem: 10 }, min: [44.80, 46.00, 45.40] },
  { id: 'eng_kmutnb', name: 'วิศวกรรมศาสตร์', uni: 'มจพ. (พระนครเหนือ)', weights: { tgat: 20, tpat3: 30, math1: 25, phy: 15, chem: 10 }, min: [42.50, 43.80, 43.20] },
  { id: 'ce_cu', name: 'วิศวกรรมคอมพิวเตอร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 20, tpat3: 30, math1: 30, phy: 10, eng: 10 }, min: [62.40, 63.10, 62.80] },
  { id: 'cs_ku', name: 'วิทยาการคอมพิวเตอร์', uni: 'ม.เกษตรศาสตร์', weights: { tgat: 25, math1: 35, eng: 20, sci: 20 }, min: [52.30, 53.50, 53.00] },
  { id: 'cs_tu', name: 'วิทยาการคอมพิวเตอร์', uni: 'ม.ธรรมศาสตร์', weights: { tgat: 25, math1: 35, eng: 20, sci: 20 }, min: [50.50, 51.80, 51.30] },

  // ============ บัญชี/เศรษฐศาสตร์/พาณิชย์ ============
  { id: 'acc_cu', name: 'บัญชี', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 30, math1: 35, eng: 20, soc: 15 }, min: [60.50, 61.20, 60.80] },
  { id: 'acc_tu', name: 'บัญชี', uni: 'ม.ธรรมศาสตร์', weights: { tgat: 30, math1: 35, eng: 20, soc: 15 }, min: [57.80, 58.50, 58.10] },
  { id: 'acc_ku', name: 'บัญชี', uni: 'ม.เกษตรศาสตร์', weights: { tgat: 30, math1: 35, eng: 20, soc: 15 }, min: [52.40, 53.20, 52.80] },
  { id: 'econ_cu', name: 'เศรษฐศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 30, math1: 40, eng: 20, soc: 10 }, min: [56.40, 57.00, 56.70] },
  { id: 'econ_tu', name: 'เศรษฐศาสตร์', uni: 'ม.ธรรมศาสตร์', weights: { tgat: 30, math1: 40, eng: 20, soc: 10 }, min: [53.20, 54.00, 53.60] },
  { id: 'bba_cu', name: 'BBA (บริหารธุรกิจ inter)', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat1: 40, math1: 30, eng: 30 }, min: [65.00, 66.20, 65.50] },
  { id: 'bba_tu', name: 'BBA (บริหารธุรกิจ inter)', uni: 'ม.ธรรมศาสตร์', weights: { tgat1: 40, math1: 30, eng: 30 }, min: [62.50, 63.80, 63.00] },
  { id: 'comm_cu', name: 'พาณิชยศาสตร์และการบัญชี', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 30, math1: 35, eng: 20, soc: 15 }, min: [58.20, 59.00, 58.50] },

  // ============ นิเทศศาสตร์/วารสาร ============
  { id: 'comm_arts_cu', name: 'นิเทศศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 40, thai: 20, eng: 20, soc: 20 }, min: [58.30, 59.00, 58.60] },
  { id: 'jc_tu', name: 'วารสารศาสตร์และสื่อสารมวลชน', uni: 'ม.ธรรมศาสตร์', weights: { tgat: 40, thai: 20, eng: 20, soc: 20 }, min: [53.50, 54.20, 53.80] },

  // ============ อักษร/ศิลปศาสตร์/มนุษย์ ============
  { id: 'arts_cu', name: 'อักษรศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 30, thai: 25, soc: 20, eng: 25 }, min: [54.80, 55.50, 55.10] },
  { id: 'liberal_tu', name: 'ศิลปศาสตร์', uni: 'ม.ธรรมศาสตร์', weights: { tgat: 30, thai: 25, soc: 20, eng: 25 }, min: [50.20, 51.00, 50.50] },
  { id: 'hum_ku', name: 'มนุษยศาสตร์', uni: 'ม.เกษตรศาสตร์', weights: { tgat: 30, thai: 25, soc: 20, eng: 25 }, min: [46.50, 47.30, 46.90] },

  // ============ นิติศาสตร์/รัฐศาสตร์ ============
  { id: 'law_cu', name: 'นิติศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 30, thai: 25, soc: 25, eng: 20 }, min: [57.20, 58.00, 57.50] },
  { id: 'law_tu', name: 'นิติศาสตร์', uni: 'ม.ธรรมศาสตร์', weights: { tgat: 30, thai: 25, soc: 25, eng: 20 }, min: [55.80, 56.50, 56.00] },
  { id: 'law_ku', name: 'นิติศาสตร์', uni: 'ม.เกษตรศาสตร์', weights: { tgat: 30, thai: 25, soc: 25, eng: 20 }, min: [48.50, 49.30, 48.90] },
  { id: 'pol_cu', name: 'รัฐศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 35, thai: 20, soc: 25, eng: 20 }, min: [56.10, 56.80, 56.40] },
  { id: 'pol_tu', name: 'รัฐศาสตร์', uni: 'ม.ธรรมศาสตร์', weights: { tgat: 35, thai: 20, soc: 25, eng: 20 }, min: [53.40, 54.10, 53.70] },

  // ============ วิทยาศาสตร์/เภสัช/พยาบาล ============
  { id: 'sci_cu', name: 'วิทยาศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 20, math1: 25, phy: 20, chem: 20, bio: 15 }, min: [49.50, 50.20, 49.80] },
  { id: 'sci_mu', name: 'วิทยาศาสตร์', uni: 'ม.มหิดล', weights: { tgat: 20, math1: 25, phy: 20, chem: 20, bio: 15 }, min: [48.80, 49.50, 49.10] },
  { id: 'pharm_cu', name: 'เภสัชศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 20, math1: 20, phy: 15, chem: 25, bio: 20 }, min: [58.40, 59.10, 58.70] },
  { id: 'pharm_mu', name: 'เภสัชศาสตร์', uni: 'ม.มหิดล', weights: { tgat: 20, math1: 20, phy: 15, chem: 25, bio: 20 }, min: [57.00, 57.80, 57.30] },
  { id: 'nurs_mu', name: 'พยาบาลศาสตร์', uni: 'ม.มหิดล', weights: { tgat: 25, eng: 20, chem: 20, bio: 20, sci: 15 }, min: [50.30, 51.00, 50.60] },
  { id: 'nurs_cu', name: 'พยาบาลศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 25, eng: 20, chem: 20, bio: 20, sci: 15 }, min: [51.20, 52.00, 51.50] },

  // ============ สถาปัตย์/ศิลปกรรม ============
  { id: 'arch_cu', name: 'สถาปัตยกรรมศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 20, tpat4: 40, math1: 25, phy: 15 }, min: [55.20, 56.00, 55.50] },
  { id: 'arch_ku', name: 'สถาปัตยกรรมศาสตร์', uni: 'ม.เกษตรศาสตร์', weights: { tgat: 20, tpat4: 40, math1: 25, phy: 15 }, min: [48.60, 49.30, 48.90] },
  { id: 'arch_kmitl', name: 'สถาปัตยกรรมศาสตร์', uni: 'สจล. (ลาดกระบัง)', weights: { tgat: 20, tpat4: 40, math1: 25, phy: 15 }, min: [47.20, 48.00, 47.60] },
  { id: 'fine_cu', name: 'ศิลปกรรมศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 30, tpat2: 50, thai: 10, eng: 10 }, min: [50.80, 51.40, 51.00] },

  // ============ ครุศาสตร์/ศึกษาศาสตร์ ============
  { id: 'edu_cu', name: 'ครุศาสตร์', uni: 'จุฬาลงกรณ์มหาวิทยาลัย', weights: { tgat: 30, tpat5: 30, thai: 15, soc: 15, eng: 10 }, min: [52.00, 52.80, 52.30] },
  { id: 'edu_ku', name: 'ศึกษาศาสตร์', uni: 'ม.เกษตรศาสตร์', weights: { tgat: 30, tpat5: 30, thai: 15, soc: 15, eng: 10 }, min: [47.50, 48.20, 47.80] },
  { id: 'edu_swu', name: 'ศึกษาศาสตร์', uni: 'ม.ศรีนครินทรวิโรฒ', weights: { tgat: 30, tpat5: 30, thai: 15, soc: 15, eng: 10 }, min: [46.80, 47.50, 47.10] },
];

module.exports = { FACULTIES };
