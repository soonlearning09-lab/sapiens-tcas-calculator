import { useMemo, useState } from 'react';
import { SUBJECTS, GROUP_ORDER, clampScore } from '../lib/subjects.js';

const MAX_PICKS = 10;

// จัดวิชาเข้ากลุ่มตามลำดับ
const GROUPED = GROUP_ORDER.map((g) => ({
  group: g,
  items: Object.entries(SUBJECTS)
    .filter(([, m]) => m.group === g)
    .map(([code, m]) => ({ code, ...m })),
})).filter((g) => g.items.length);

function ScoreGroup({ group, items, scores, setScore, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const filled = items.filter((i) => scores[i.code] !== undefined && scores[i.code] !== '').length;
  return (
    <div className="group">
      <div className={`group-head ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}>
        <span>
          {group}
          {filled > 0 && <span style={{ color: 'var(--green)', marginLeft: 8 }}>✓ {filled}</span>}
        </span>
        <span className="chev">▶</span>
      </div>
      {open && (
        <div className="score-grid">
          {items.map((it) => (
            <div className="score-field" key={it.code}>
              <label title={it.name}>
                {it.short} <span className="score-max">/ {it.max}</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max={it.max}
                step="0.01"
                placeholder={`0-${it.max}`}
                className={scores[it.code] !== undefined && scores[it.code] !== '' ? 'filled' : ''}
                value={scores[it.code] ?? ''}
                onChange={(e) => setScore(it.code, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramPicker({ programs, picks, setPicks, byKey }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const terms = query.split(/\s+/);
    const out = [];
    for (const p of programs) {
      if (terms.every((t) => p._search.includes(t))) {
        out.push(p);
        if (out.length >= 40) break;
      }
    }
    return out;
  }, [q, programs]);

  const pickedSet = new Set(picks);

  function add(key) {
    if (picks.length >= MAX_PICKS || pickedSet.has(key)) return;
    setPicks([...picks, key]);
    setQ('');
  }
  function remove(key) {
    setPicks(picks.filter((k) => k !== key));
  }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= picks.length) return;
    const next = [...picks];
    [next[i], next[j]] = [next[j], next[i]];
    setPicks(next);
  }

  return (
    <>
      <div className="search-wrap">
        <input
          className="search-input"
          placeholder="พิมพ์ชื่อคณะ / มหาวิทยาลัย / สาขา เช่น วิศวะ จุฬา"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q.trim().length >= 2 && (
          <div className="search-results">
            {results.length === 0 ? (
              <div className="search-empty">ไม่พบหลักสูตรที่ตรงกับ “{q}”</div>
            ) : (
              results.map((p) => (
                <div
                  className="search-item"
                  key={p._key}
                  onClick={() => add(p._key)}
                  style={pickedSet.has(p._key) ? { opacity: 0.4, pointerEvents: 'none' } : null}
                >
                  <div className="pname">{p._name}</div>
                  <div className="puni">
                    {p._uni}
                    {p.program_type_name_th ? ` · ${p.program_type_name_th}` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {picks.length === 0 ? (
        <p className="muted-center" style={{ padding: 14 }}>
          ยังไม่ได้เลือกคณะ — ค้นหาด้านบนแล้วแตะเพื่อเพิ่ม (สูงสุด {MAX_PICKS} อันดับ)
        </p>
      ) : (
        picks.map((key, i) => {
          const p = byKey.get(key);
          if (!p) return null;
          return (
            <div className="pick-row" key={key}>
              <div className="pick-rank">{i + 1}</div>
              <div className="pick-body">
                <div className="pick-name">{p._name}</div>
                <div className="pick-uni">{p._uni}</div>
              </div>
              <div className="pick-actions">
                <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} title="เลื่อนขึ้น">
                  ↑
                </button>
                <button
                  className="icon-btn"
                  disabled={i === picks.length - 1}
                  onClick={() => move(i, 1)}
                  title="เลื่อนลง"
                >
                  ↓
                </button>
                <button className="icon-btn" onClick={() => remove(key)} title="ลบ">
                  ✕
                </button>
              </div>
            </div>
          );
        })
      )}
      {picks.length > 0 && (
        <p className="data-note">
          เลือกแล้ว {picks.length}/{MAX_PICKS} อันดับ
        </p>
      )}
    </>
  );
}

export default function InputPage({ programs, scores, setScores, picks, setPicks, byKey, meta, onSubmit }) {
  const setScore = (code, val) => setScores((s) => ({ ...s, [code]: clampScore(code, val) }));
  const filledCount = Object.values(scores).filter((v) => v !== undefined && v !== '').length;
  const canSubmit = filledCount > 0;

  return (
    <main className="container">
      <div className="warning">
        ข้อมูลสัดส่วนคะแนนและคะแนนต่ำสุดดึงจาก mytcas.com (TCAS69) โดยตรง — คะแนนต่ำสุดเป็นของปีที่ผ่านมา ใช้ประเมินแนวโน้ม
        ควรตรวจสอบเกณฑ์ล่าสุดที่ mytcas.com อีกครั้ง
      </div>

      <div className="section">
        <h2 className="section-title">1. กรอกคะแนนสอบ</h2>
        <p className="section-sub">กรอกเฉพาะวิชาที่สอบ · A-Level/TGAT/TPAT เต็ม 100 · GPAX เต็ม 4.00</p>
        {GROUPED.map((g, idx) => (
          <ScoreGroup
            key={g.group}
            group={g.group}
            items={g.items}
            scores={scores}
            setScore={setScore}
            defaultOpen={idx < 4 && g.group !== 'TPAT'}
          />
        ))}
      </div>

      <div className="section">
        <h2 className="section-title">2. เลือกคณะที่สนใจ</h2>
        <p className="section-sub">เรียงตามลำดับความต้องการ สูงสุด {MAX_PICKS} อันดับ (จะไม่เลือกก็ได้ — ระบบจะแนะนำคณะที่คะแนนถึงให้)</p>
        <ProgramPicker programs={programs} picks={picks} setPicks={setPicks} byKey={byKey} />
      </div>

      {meta && (
        <p className="data-note">
          ฐานข้อมูล {meta.record_count?.toLocaleString()} หลักสูตร · อัปเดต{' '}
          {new Date(meta.generated_at).toLocaleDateString('th-TH')}
        </p>
      )}

      <div className="submit-bar">
        <div className="submit-bar-inner">
          <button className="btn btn-primary" disabled={!canSubmit} onClick={onSubmit}>
            {canSubmit ? 'คำนวณโอกาสติด' : 'กรอกคะแนนอย่างน้อย 1 วิชา'}
          </button>
        </div>
      </div>
    </main>
  );
}
