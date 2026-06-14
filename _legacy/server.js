// TCAS LINE Bot + LIFF Server
require('dotenv').config();

const express = require('express');
const path = require('path');
const line = require('@line/bot-sdk');

const { FACULTIES } = require('../data/faculties');
const { analyze } = require('./calculator');
const { buildResultFlex, buildWelcomeFlex } = require('./flex');

const PORT = process.env.PORT || 3000;
const LIFF_ID = process.env.LIFF_ID || '';
const LIFF_URL = LIFF_ID ? `https://liff.line.me/${LIFF_ID}` : '';

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const lineClient = new line.Client(lineConfig);
const app = express();

// ============ Public LIFF static files ============
// inject LIFF_ID เข้าไปใน index.html
const fs = require('fs');
app.get(['/', '/index.html'], (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf-8');
  res.type('html').send(html.replace('__LIFF_ID__', LIFF_ID));
});
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============ API: ดึงรายการคณะ (เรียกจาก LIFF) ============
app.get('/api/faculties', (req, res) => {
  // ส่งเฉพาะข้อมูลที่ frontend ต้องใช้
  const list = FACULTIES.map(f => ({
    id: f.id,
    name: f.name,
    uni: f.uni,
  }));
  res.json(list);
});

// ============ API: คำนวณและส่งผลเข้า LINE chat ============
// body: { idToken, scores, facultyIds }
app.post('/api/submit', express.json(), async (req, res) => {
  try {
    const { idToken, scores, facultyIds } = req.body;

    if (!idToken) return res.status(400).json({ error: 'missing idToken' });
    if (!scores || !facultyIds || !facultyIds.length) {
      return res.status(400).json({ error: 'missing scores or facultyIds' });
    }

    // verify idToken กับ LINE Login API
    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: process.env.LIFF_CHANNEL_ID || '',
      }),
    });

    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'invalid idToken' });
    }

    const profile = await verifyRes.json();
    const userId = profile.sub;

    // คำนวณ
    const analysis = analyze(scores, facultyIds);

    // ส่ง Flex Message กลับเข้า chat
    const flex = buildResultFlex(analysis);
    await lineClient.pushMessage(userId, flex);

    res.json({ ok: true, passCount: analysis.passCount, total: analysis.total });
  } catch (err) {
    console.error('submit error:', err);
    res.status(500).json({ error: 'server error', detail: err.message });
  }
});

// ============ LINE Webhook ============
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events;
    await Promise.all(events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error('webhook error:', err);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const text = event.message.text.trim().toLowerCase();
  const greetings = ['เริ่ม', 'start', 'hi', 'hello', 'สวัสดี', 'เมนู', 'menu'];
  const helpKeywords = ['help', 'ช่วย', 'วิธีใช้', '?'];

  if (greetings.some(g => text.includes(g))) {
    if (!LIFF_URL) {
      return lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ระบบยังไม่พร้อม กรุณาตั้งค่า LIFF_ID ใน .env ก่อน',
      });
    }
    return lineClient.replyMessage(event.replyToken, buildWelcomeFlex(LIFF_URL));
  }

  if (helpKeywords.some(k => text.includes(k))) {
    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: [
        '📘 วิธีใช้ TCAS Calculator',
        '',
        '1. พิมพ์ "เริ่ม" เพื่อเปิดเครื่องคำนวณ',
        '2. กรอกคะแนน TGAT/TPAT/A-Level',
        '3. เลือกคณะ/มหาวิทยาลัยที่ต้องการ (สูงสุด 10)',
        '4. กดคำนวณ ระบบจะส่งผลกลับมาที่นี่',
        '',
        'คำสั่งอื่นๆ:',
        '• เริ่ม / menu — เปิดเครื่องคำนวณ',
        '• help — ดูวิธีใช้',
      ].join('\n'),
    });
  }

  // default reply
  return lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: 'พิมพ์ "เริ่ม" เพื่อเปิดเครื่องคำนวณคะแนน TCAS หรือ "help" เพื่อดูวิธีใช้',
  });
}

// ============ Health check ============
app.get('/', (req, res) => {
  res.send(`
    <h1>TCAS LINE Bot is running ✓</h1>
    <p>LIFF URL: ${LIFF_URL || '(not configured)'}</p>
    <p>Webhook endpoint: <code>/webhook</code></p>
    <p>LIFF app: <a href="/">/</a> (served from public/)</p>
  `);
});

app.listen(PORT, () => {
  console.log(`TCAS server listening on port ${PORT}`);
  console.log(`LIFF URL: ${LIFF_URL || '(not set)'}`);
});
