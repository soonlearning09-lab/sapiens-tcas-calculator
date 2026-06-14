const sharp = require('sharp');
const fs = require('fs');

sharp('rich-menu.png')
  .png({ quality: 80, compressionLevel: 9 })
  .toFile('rich-menu-small.png')
  .then(info => {
    const size = fs.statSync('rich-menu-small.png').size;
    console.log('✅ บีบแล้ว!');
    console.log(`📦 ขนาด: ${(size / 1024).toFixed(0)} KB`);
    if (size > 1024 * 1024) {
      console.log('⚠️  ยังใหญ่เกิน 1MB — รัน compress2.js เพื่อบีบเพิ่ม');
    } else {
      console.log('✅ ขนาดโอเค! เปลี่ยนชื่อเป็น rich-menu.png ได้เลย');
      fs.copyFileSync('rich-menu-small.png', 'rich-menu.png');
      console.log('✅ copy ทับ rich-menu.png เรียบร้อย — รัน setup-rich-menu.js ได้เลย!');
    }
  })
  .catch(console.error);
