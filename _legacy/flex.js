// สร้าง Flex Message สวยๆ สำหรับส่งผลลัพธ์กลับไปใน LINE

function statusColor(status) {
  if (status === 'pass') return { bg: '#E1F5EE', fg: '#0F6E56', label: 'มีโอกาสสูง' };
  if (status === 'close') return { bg: '#FAEEDA', fg: '#854F0B', label: 'ก้ำกึ่ง' };
  return { bg: '#FCEBEB', fg: '#A32D2D', label: 'ต่ำกว่าเกณฑ์' };
}

// สร้างการ์ดสำหรับแต่ละคณะ (ใช้ใน Carousel)
function facultyBubble(result) {
  const sc = statusColor(result.status);
  const diffText = result.diff >= 0 ? `+${result.diff.toFixed(2)}` : result.diff.toFixed(2);

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: sc.bg,
      paddingAll: '16px',
      contents: [
        {
          type: 'text',
          text: `อันดับ ${result.rank}`,
          size: 'xs',
          color: sc.fg,
          weight: 'bold',
        },
        {
          type: 'text',
          text: result.name,
          size: 'lg',
          weight: 'bold',
          color: sc.fg,
          wrap: true,
          margin: 'xs',
        },
        {
          type: 'text',
          text: result.uni,
          size: 'xs',
          color: sc.fg,
          wrap: true,
          margin: 'xs',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      paddingAll: '16px',
      contents: [
        // สถานะ
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: sc.label,
              color: '#FFFFFF',
              size: 'sm',
              weight: 'bold',
              align: 'center',
            },
          ],
          backgroundColor: sc.fg,
          cornerRadius: '8px',
          paddingAll: '8px',
        },
        // คะแนนของคุณ
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'คะแนนคุณ', size: 'sm', color: '#888880', flex: 3 },
            {
              type: 'text',
              text: result.total.toFixed(2),
              size: 'xl',
              weight: 'bold',
              align: 'end',
              flex: 2,
              color: '#2C2C2A',
            },
          ],
          margin: 'md',
        },
        // คะแนนต่ำสุดเฉลี่ย
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'ต่ำสุดเฉลี่ย', size: 'sm', color: '#888880', flex: 3 },
            {
              type: 'text',
              text: result.avgMin.toFixed(2),
              size: 'md',
              align: 'end',
              flex: 2,
              color: '#444441',
            },
          ],
        },
        // ส่วนต่าง
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'ส่วนต่าง', size: 'sm', color: '#888880', flex: 3 },
            {
              type: 'text',
              text: diffText,
              size: 'md',
              weight: 'bold',
              align: 'end',
              flex: 2,
              color: sc.fg,
            },
          ],
        },
        { type: 'separator', margin: 'md' },
        // สถิติย้อนหลัง
        {
          type: 'text',
          text: 'คะแนนต่ำสุดย้อนหลัง',
          size: 'xs',
          color: '#888880',
          margin: 'sm',
        },
        ...result.history.map((m, i) => ({
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: `ปี 6${6 + i}`, size: 'xs', color: '#888880', flex: 1 },
            { type: 'text', text: m.toFixed(2), size: 'xs', color: '#444441', align: 'end', flex: 1 },
          ],
        })),
      ],
    },
  };
}

// สรุปภาพรวม (การ์ดแรกของ carousel)
function summaryBubble(passCount, total) {
  const rate = total > 0 ? Math.round((passCount / total) * 100) : 0;
  return {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '20px',
      contents: [
        {
          type: 'text',
          text: 'ผลการวิเคราะห์',
          size: 'sm',
          color: '#888880',
        },
        {
          type: 'text',
          text: `${passCount} / ${total}`,
          size: '4xl',
          weight: 'bold',
          color: '#2C2C2A',
          margin: 'md',
        },
        {
          type: 'text',
          text: 'อันดับที่มีโอกาสติด',
          size: 'sm',
          color: '#444441',
          margin: 'xs',
        },
        { type: 'separator', margin: 'lg' },
        {
          type: 'text',
          text: `อัตราความน่าจะเป็น ${rate}%`,
          size: 'md',
          color: '#185FA5',
          weight: 'bold',
          margin: 'lg',
        },
        {
          type: 'text',
          text: 'อ้างอิงคะแนนต่ำสุดย้อนหลัง 3 ปี',
          size: 'xs',
          color: '#888880',
          margin: 'xs',
          wrap: true,
        },
        { type: 'separator', margin: 'lg' },
        {
          type: 'text',
          text: '⚠️ ข้อมูลเป็นการประมาณการจากสถิติ ควรตรวจสอบเกณฑ์จริงที่ mytcas.com อีกครั้ง',
          size: 'xxs',
          color: '#888880',
          wrap: true,
          margin: 'lg',
        },
      ],
    },
  };
}

function buildResultFlex(analysis) {
  const bubbles = [summaryBubble(analysis.passCount, analysis.total), ...analysis.results.map(facultyBubble)];

  return {
    type: 'flex',
    altText: `ผลวิเคราะห์คะแนน TCAS: ผ่าน ${analysis.passCount}/${analysis.total} อันดับ`,
    contents: {
      type: 'carousel',
      contents: bubbles.slice(0, 12), // LINE จำกัด 12 bubbles ต่อ carousel
    },
  };
}

// ปุ่มเริ่มต้น พร้อมลิงก์ไปเปิด LIFF
function buildWelcomeFlex(liffUrl) {
  return {
    type: 'flex',
    altText: 'ยินดีต้อนรับสู่ TCAS Calculator',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: '🎓 TCAS Calculator',
            weight: 'bold',
            size: 'xl',
            color: '#2C2C2A',
          },
          {
            type: 'text',
            text: 'คำนวณคะแนนสอบเข้ามหาวิทยาลัย พร้อมเปรียบเทียบกับคะแนนต่ำสุดย้อนหลัง',
            size: 'sm',
            color: '#444441',
            wrap: true,
            margin: 'md',
          },
          { type: 'separator', margin: 'lg' },
          {
            type: 'text',
            text: '✓ รองรับ TGAT/TPAT ครบทุกวิชา',
            size: 'sm',
            color: '#444441',
            margin: 'lg',
          },
          { type: 'text', text: '✓ A-Level ครบทุกวิชา', size: 'sm', color: '#444441', margin: 'xs' },
          { type: 'text', text: '✓ เลือกคณะได้สูงสุด 10 อันดับ', size: 'sm', color: '#444441', margin: 'xs' },
          { type: 'text', text: '✓ เปรียบเทียบกับสถิติย้อนหลัง 3 ปี', size: 'sm', color: '#444441', margin: 'xs' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#185FA5',
            action: {
              type: 'uri',
              label: 'เริ่มกรอกคะแนน',
              uri: liffUrl,
            },
          },
        ],
      },
    },
  };
}

module.exports = { buildResultFlex, buildWelcomeFlex };
