// setup-rich-menu.js
// รันครั้งเดียวเพื่อสร้าง Rich Menu ใน LINE
// วิธีใช้: node setup-rich-menu.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

if (!TOKEN) {
  console.error('❌ ไม่พบ LINE_CHANNEL_ACCESS_TOKEN ใน .env');
  process.exit(1);
}

const BASE = 'https://api.line.me/v2/bot';
const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

// ─── 1. Rich Menu Layout (3×2) ────────────────────────────────────
const richMenuBody = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: 'SAPIENS TUTOR Menu',
  chatBarText: '📋 เมนู TCAS',
  areas: [
    // ROW 1
    {
      bounds: { x: 0,    y: 0, width: 833, height: 843 },
      action: { type: 'uri', label: 'เริ่มคำนวณ', uri: `https://liff.line.me/${process.env.LIFF_ID}?mode=normal` }
    },
    {
      bounds: { x: 833,  y: 0, width: 834, height: 843 },
      action: { type: 'uri', label: 'หาคณะที่ติด', uri: `https://liff.line.me/${process.env.LIFF_ID}?mode=me` }
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: 'message', label: 'วิธีใช้', text: 'help' }
    },
    // ROW 2
    {
      bounds: { x: 0,    y: 843, width: 833, height: 843 },
      action: { type: 'message', label: 'ดูคะแนนฉัน', text: 'ดูคะแนน' }
    },
   {
  bounds: { x: 833, y: 843, width: 834, height: 843 },
  action: { type: 'uri', label: 'สถิติคะแนนสอบ', uri: 'https://tcas-line-bot.onrender.com/stats' }
},
    {
      bounds: { x: 1667, y: 843, width: 833, height: 843 },
      action: { type: 'message', label: 'เกี่ยวกับ', text: 'เกี่ยวกับ' }
    },
  ]
};

async function main() {
  try {
    // ── Step 1: สร้าง Rich Menu ──────────────────────────────────
    console.log('📋 Step 1: สร้าง Rich Menu layout...');
    const createRes = await fetch(`${BASE}/richmenu`, {
      method: 'POST',
      headers,
      body: JSON.stringify(richMenuBody),
    });
    const created = await createRes.json();
    if (!created.richMenuId) {
      console.error('❌ สร้าง Rich Menu ไม่สำเร็จ:', created);
      process.exit(1);
    }
    const richMenuId = created.richMenuId;
    console.log(`✅ Rich Menu ID: ${richMenuId}`);

    // ── Step 2: อัปโหลดรูป ───────────────────────────────────────
    console.log('🖼️  Step 2: อัปโหลดรูป rich-menu.png...');
    const imagePath = path.join(__dirname, 'rich-menu.png');
    if (!fs.existsSync(imagePath)) {
      console.error('❌ ไม่พบไฟล์ rich-menu.png ใน folder เดียวกัน');
      console.log('👉 ดาวน์โหลดรูปจาก rich-menu-generator.html แล้วเปลี่ยนชื่อเป็น rich-menu.png');
      process.exit(1);
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'image/png',
      },
      body: imageBuffer,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('❌ อัปโหลดรูปไม่สำเร็จ:', err);
      process.exit(1);
    }
    console.log('✅ อัปโหลดรูปสำเร็จ');

    // ── Step 3: ตั้งเป็น Default Rich Menu ──────────────────────
    console.log('🔗 Step 3: ตั้งเป็น Default Rich Menu...');
    const defaultRes = await fetch(`${BASE}/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    if (!defaultRes.ok) {
      const err = await defaultRes.text();
      console.error('❌ ตั้ง default ไม่สำเร็จ:', err);
      process.exit(1);
    }
    console.log('✅ ตั้ง Default Rich Menu สำเร็จ!');
    console.log('');
    console.log('🎉 เสร็จแล้ว! Rich Menu จะปรากฏใน LINE Bot ของคุณ');
    console.log(`📌 Rich Menu ID: ${richMenuId}`);
    console.log('');
    console.log('💡 ถ้าอยากลบ Rich Menu เก่า รัน: node delete-rich-menu.js');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
