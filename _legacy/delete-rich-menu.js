// delete-rich-menu.js
// ลบ Rich Menu ทั้งหมดที่มีอยู่ (ทำความสะอาดก่อน setup ใหม่)
// วิธีใช้: node delete-rich-menu.js

require('dotenv').config();

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const BASE = 'https://api.line.me/v2/bot';
const headers = { 'Authorization': `Bearer ${TOKEN}` };

async function main() {
  // ดึงรายการ Rich Menu ทั้งหมด
  const listRes = await fetch(`${BASE}/richmenu/list`, { headers });
  const { richmenus } = await listRes.json();

  if (!richmenus || richmenus.length === 0) {
    console.log('ℹ️  ไม่มี Rich Menu อยู่แล้ว');
    return;
  }

  console.log(`🗑️  พบ ${richmenus.length} Rich Menu — กำลังลบ...`);
  for (const rm of richmenus) {
    await fetch(`${BASE}/richmenu/${rm.richMenuId}`, { method: 'DELETE', headers });
    console.log(`✅ ลบ ${rm.richMenuId} (${rm.name})`);
  }
  console.log('🎉 ลบเสร็จหมดแล้ว');
}

main().catch(console.error);
