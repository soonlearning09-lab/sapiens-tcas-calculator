import { useMemo, useState } from 'react';
import { evaluateProgram, isReachable, STATUS_INFO } from '../lib/calculator.js';
import { subjectShort } from '../lib/subjects.js';
import { buildShareUrl } from '../lib/persist.js';

const HIST_YEARS = [
  ['66', '66'],
  ['67', '67'],
  ['68', '68'],
  ['69', '69'],
];

// กราฟแท่งคะแนนต่ำสุดย้อนหลัง (สเกลแท่งสัมพัทธ์เพื่อให้เห็นแนวโน้ม ตัวเลขจริงกำกับบนแท่ง)
function ScoreHistory({ history, youScore }) {
  if (!history) return null;
  const present = HIST_YEARS.filter(([y]) => history[y] && history[y].min != null);
  if (present.length < 2) return null;
  const vals = present.map(([y]) => history[y].min);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  return (
    <div className="hist">
      <div className="hist-title">คะแนนต่ำสุดย้อนหลัง (TCAS)</div>
      <div className="hist-bars">
        {present.map(([y, label]) => {
          const d = history[y];
          const h = 34 + ((d.min - lo) / span) * 66; // 34%–100%
          const reached = youScore != null && youScore >= d.min;
          return (
            <div className="hist-col" key={y} title={`ปี ${label}: ต่ำสุด ${d.min.toFixed(2)}${d.max != null ? ` · สูงสุด ${d.max.toFixed(2)}` : ''}`}>
              <div className="hist-val">{d.min.toFixed(1)}</div>
              <div className="hist-bar-wrap">
                <div className={`hist-bar ${reached ? 'reached' : ''}`} style={{ height: `${h}%` }} />
              </div>
              <div className="hist-yr">'{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ป้ายภาษาไทยของหลักสูตรที่รับ (ตรงกับ flags only_* ของ mytcas)
const CURRIC_LABEL = {
  formal: 'แกนกลาง',
  inter: 'นานาชาติ',
  voc: 'อาชีวะ',
  nonformal: 'กศน.',
  ged: 'GED',
};

// คุณสมบัติพื้นฐาน (รอบ 3 Admission): หลักสูตรที่รับ + คะแนนรวม/ GPAX ขั้นต่ำ
function Qualifications({ qual, ev, scores }) {
  if (!qual) return null;
  const accepts = qual.accepts || [];
  const gpax = scores?.gpax;
  const gpaxBad = qual.min_gpax != null && gpax !== undefined && gpax !== '' && Number(gpax) < qual.min_gpax;
  const totalBad = qual.min_total != null && ev.total != null && ev.total < qual.min_total;
  return (
    <div className="qual">
      {accepts.length > 0 && (
        <div className="qual-row">
          <span className="qual-lbl">รับผู้จบ</span>
          {accepts.length === 5 ? (
            <span className="qual-chip">ทุกหลักสูตร</span>
          ) : (
            accepts.map((a) => (
              <span className="qual-chip" key={a}>
                {CURRIC_LABEL[a] || a}
              </span>
            ))
          )}
        </div>
      )}
      {(qual.min_total != null || qual.min_gpax != null) && (
        <div className="qual-row">
          {qual.min_total != null && (
            <span className={`qual-min ${totalBad ? 'bad' : ''}`}>
              คะแนนรวมขั้นต่ำ {qual.min_total}
              {totalBad ? ' (ไม่ถึง)' : ''}
            </span>
          )}
          {qual.min_gpax != null && (
            <span className={`qual-min ${gpaxBad ? 'bad' : ''}`}>
              GPAX ขั้นต่ำ {qual.min_gpax.toFixed(2)}
              {gpaxBad ? ' (ไม่ถึง)' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ p, ev, rank, scores }) {
  const info = STATUS_INFO[ev.status] || STATUS_INFO.unknown;
  return (
    <div className="result-card">
      <div className="result-head">
        <div style={{ minWidth: 0 }}>
          <div className="result-name">
            {rank ? <span style={{ color: 'var(--muted)' }}>{rank}. </span> : null}
            {p._name}
          </div>
          <div className="result-uni">
            {p._uni}
            {p.program_type_name_th ? ` · ${p.program_type_name_th}` : ''}
          </div>
        </div>
        <span className="badge" style={{ background: info.bg, color: info.color }}>
          {info.label}
        </span>
      </div>

      <div className="result-scores">
        <div className="score-stat you">
          คะแนนคุณ<b>{ev.total != null ? ev.total.toFixed(2) : '—'}</b>
        </div>
        <div className="score-stat">
          ต่ำสุดปีก่อน<b>{ev.min != null ? ev.min.toFixed(2) : '—'}</b>
        </div>
        <div className="score-stat">
          ส่วนต่าง
          <b style={{ color: ev.diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {ev.diff == null ? '—' : (ev.diff >= 0 ? '+' : '') + ev.diff.toFixed(2)}
          </b>
        </div>
        {ev.max != null && (
          <div className="score-stat">
            สูงสุดปีก่อน<b>{ev.max.toFixed(2)}</b>
          </div>
        )}
        {p.receive_student_number ? (
          <div className="score-stat">
            รับ<b>{p.receive_student_number}</b>
          </div>
        ) : null}
      </div>

      <Qualifications qual={p.qual} ev={ev} scores={scores} />

      {ev.missing.length > 0 && ev.status !== 'unknown' && (
        <div className="missing-note">
          ⚠ ยังไม่ได้กรอก: {ev.missing.map((m) => m.candidates.map(subjectShort).join('/')).join(', ')} — คะแนนจริงอาจสูงกว่านี้
        </div>
      )}

      <ScoreHistory history={p._history} youScore={ev.total} />
    </div>
  );
}

export default function ResultsPage({ programs, scores, picks, byKey, onBack }) {
  const [tab, setTab] = useState(picks.length ? 'picks' : 'all');
  const [toast, setToast] = useState('');

  async function share() {
    const url = buildShareUrl(scores, picks);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ผลคำนวณโอกาสติดคณะ TCAS — SAPIENS TUTOR', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast('คัดลอกลิงก์แล้ว — ส่งให้เพื่อนเปิดดูผลเดียวกันได้');
    } catch {
      setToast('คัดลอกไม่สำเร็จ ลองใหม่อีกครั้ง');
    }
    setTimeout(() => setToast(''), 2600);
  }

  // ── ผลของอันดับที่เลือก ──
  const pickResults = useMemo(
    () =>
      picks
        .map((key) => byKey.get(key))
        .filter(Boolean)
        .map((p) => ({ p, ev: evaluateProgram(p, scores) })),
    [picks, byKey, scores]
  );
  const passCount = pickResults.filter((r) => isReachable(r.ev.status)).length;

  // ── คณะทั้งหมดที่คะแนนถึง ──
  const allReachable = useMemo(() => {
    const out = [];
    for (const p of programs) {
      if (!p.scores) continue;
      const ev = evaluateProgram(p, scores);
      if (isReachable(ev.status)) out.push({ p, ev });
    }
    out.sort((a, b) => b.ev.diff - a.ev.diff);
    return out;
  }, [programs, scores]);

  // ตัวกรองสำหรับ section B
  const [fUni, setFUni] = useState('');
  const [fType, setFType] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fText, setFText] = useState('');
  const [limit, setLimit] = useState(30);

  const uniOptions = useMemo(
    () => [...new Set(allReachable.map((r) => r.p.university_name_th))].sort((a, b) => a.localeCompare(b, 'th')),
    [allReachable]
  );
  const typeOptions = useMemo(
    () => [...new Set(allReachable.map((r) => r.p.program_type_name_th).filter(Boolean))].sort(),
    [allReachable]
  );

  const filtered = useMemo(() => {
    const t = fText.trim().toLowerCase();
    return allReachable.filter((r) => {
      if (fUni && r.p.university_name_th !== fUni) return false;
      if (fType && r.p.program_type_name_th !== fType) return false;
      if (fStatus && r.ev.status !== fStatus) return false;
      if (t && !r.p._search.includes(t)) return false;
      return true;
    });
  }, [allReachable, fUni, fType, fStatus, fText]);

  return (
    <main className="container">
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onBack}>
          ← แก้ไขคะแนน / คณะ
        </button>
        <button className="btn btn-ghost" style={{ flex: '0 0 auto', padding: '13px 18px' }} onClick={share}>
          แชร์ผล
        </button>
      </div>
      {toast && <div className="toast-inline">{toast}</div>}

      <div className="summary-banner">
        <div className="lbl">คณะทั้งหมดที่คะแนนของคุณถึง</div>
        <div className="big">{allReachable.length.toLocaleString()} หลักสูตร</div>
        {picks.length > 0 && (
          <div className="lbl" style={{ marginTop: 4 }}>
            จากที่เลือก {picks.length} อันดับ — มีโอกาสติด {passCount} อันดับ
          </div>
        )}
      </div>

      <div className="tabs">
        {picks.length > 0 && (
          <div className={`tab ${tab === 'picks' ? 'active' : ''}`} onClick={() => setTab('picks')}>
            อันดับที่เลือก ({picks.length})
          </div>
        )}
        <div className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          คณะที่คะแนนถึง ({allReachable.length})
        </div>
      </div>

      {tab === 'picks' ? (
        <div className="section">
          <h2 className="section-title">อันดับที่คุณเลือก</h2>
          <p className="section-sub">เทียบคะแนนคุณกับคะแนนต่ำสุดจริงของแต่ละหลักสูตร</p>
          {pickResults.length === 0 ? (
            <p className="muted-center">ยังไม่ได้เลือกอันดับ</p>
          ) : (
            pickResults.map((r, i) => <ResultCard key={r.p._key} p={r.p} ev={r.ev} rank={i + 1} scores={scores} />)
          )}
        </div>
      ) : (
        <div className="section">
          <h2 className="section-title">คณะที่คะแนนถึง</h2>
          <p className="section-sub">หลักสูตรที่คะแนนคุณถึงเกณฑ์ต่ำสุด — กรองและเรียงตามส่วนต่างมาก→น้อย</p>

          <div className="filters">
            <select value={fUni} onChange={(e) => { setFUni(e.target.value); setLimit(30); }}>
              <option value="">ทุกมหาวิทยาลัย</option>
              {uniOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <select value={fType} onChange={(e) => { setFType(e.target.value); setLimit(30); }}>
              <option value="">ทุกประเภทหลักสูตร</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select value={fStatus} onChange={(e) => { setFStatus(e.target.value); setLimit(30); }}>
              <option value="">ทุกระดับโอกาส</option>
              <option value="safe">โอกาสสูง</option>
              <option value="pass">ถึงคะแนนต่ำสุด</option>
              <option value="close">ก้ำกึ่ง</option>
            </select>
            <input
              placeholder="ค้นหาคณะ/สาขา"
              value={fText}
              onChange={(e) => { setFText(e.target.value); setLimit(30); }}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="muted-center">ไม่พบหลักสูตรที่ตรงกับเงื่อนไข</p>
          ) : (
            <>
              <p className="data-note" style={{ textAlign: 'left', marginBottom: 8 }}>
                พบ {filtered.length.toLocaleString()} หลักสูตร
              </p>
              {filtered.slice(0, limit).map((r) => (
                <ResultCard key={r.p._key} p={r.p} ev={r.ev} scores={scores} />
              ))}
              {limit < filtered.length && (
                <div className="loadmore" onClick={() => setLimit((l) => l + 30)}>
                  แสดงเพิ่ม ({filtered.length - limit} เหลือ)
                </div>
              )}
            </>
          )}
        </div>
      )}

      <p className="data-note">
        ⚠ คะแนนต่ำสุด/สูงสุด และประวัติย้อนหลัง (ปี 66–69) เป็นข้อมูลผลการคัดเลือกจริงจาก ทปอ./mytcas.com
        ใช้ประเมินแนวโน้มเท่านั้น แท่ง<b style={{ color: 'var(--green)' }}>สีเขียว</b>=คะแนนคุณถึงเกณฑ์ปีนั้น
      </p>
    </main>
  );
}
