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

// ป้ายกำกับหลักสูตรใน dropdown (เสริมประเภท/วิทยาเขตเมื่อช่วยแยกความกำกวม)
function programLabel(p) {
  const extra = [];
  if (p.project_name_th) extra.push(p.project_name_th);
  if (p.program_type_name_th && p.program_type_name_th !== 'ภาษาไทย ปกติ')
    extra.push(p.program_type_name_th);
  if (p.campus_name_th && p.campus_name_th !== 'วิทยาเขตหลัก') extra.push(p.campus_name_th);
  return extra.length ? `${p._name} · ${extra.join(' · ')}` : p._name;
}

const thSort = (a, b) => a.localeCompare(b, 'th');

function ProgramPicker({ programs, picks, setPicks, byKey }) {
  const [uni, setUni] = useState('');
  const [fac, setFac] = useState('');
  const [prog, setProg] = useState('');

  // ดัชนี: มหาวิทยาลัย → คณะ → รายการหลักสูตร (สร้างครั้งเดียว)
  const tree = useMemo(() => {
    const m = new Map();
    for (const p of programs) {
      const u = p.university_name_th || '(ไม่ระบุมหาวิทยาลัย)';
      const f = p.faculty_name_th || '(ไม่ระบุคณะ)';
      if (!m.has(u)) m.set(u, new Map());
      const fm = m.get(u);
      if (!fm.has(f)) fm.set(f, []);
      fm.get(f).push(p);
    }
    return m;
  }, [programs]);

  const uniList = useMemo(() => [...tree.keys()].sort(thSort), [tree]);
  const facList = useMemo(
    () => (uni && tree.has(uni) ? [...tree.get(uni).keys()].sort(thSort) : []),
    [tree, uni]
  );
  const progList = useMemo(() => {
    if (!uni || !fac || !tree.get(uni)?.has(fac)) return [];
    return [...tree.get(uni).get(fac)].sort((a, b) => thSort(programLabel(a), programLabel(b)));
  }, [tree, uni, fac]);

  const pickedSet = new Set(picks);

  function add(key) {
    if (!key || picks.length >= MAX_PICKS || pickedSet.has(key)) return;
    setPicks([...picks, key]);
    setProg(''); // คงมหาลัย/คณะไว้ เผื่อเพิ่มหลักสูตรอื่นในคณะเดิม
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

  const full = picks.length >= MAX_PICKS;
  const alreadyPicked = prog && pickedSet.has(prog);

  return (
    <>
      <div className="cascade">
        <label className="cascade-label">มหาวิทยาลัย</label>
        <select
          className="cascade-select"
          value={uni}
          onChange={(e) => {
            setUni(e.target.value);
            setFac('');
            setProg('');
          }}
        >
          <option value="">— เลือกมหาวิทยาลัย ({uniList.length}) —</option>
          {uniList.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <label className="cascade-label">คณะ</label>
        <select
          className="cascade-select"
          value={fac}
          disabled={!uni}
          onChange={(e) => {
            setFac(e.target.value);
            setProg('');
          }}
        >
          <option value="">
            {uni ? `— เลือกคณะ (${facList.length}) —` : '— เลือกมหาวิทยาลัยก่อน —'}
          </option>
          {facList.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <label className="cascade-label">หลักสูตร / สาขา</label>
        <select
          className="cascade-select"
          value={prog}
          disabled={!fac}
          onChange={(e) => setProg(e.target.value)}
        >
          <option value="">
            {fac ? `— เลือกหลักสูตร (${progList.length}) —` : '— เลือกคณะก่อน —'}
          </option>
          {progList.map((p) => (
            <option key={p._key} value={p._key} disabled={pickedSet.has(p._key)}>
              {programLabel(p)}
              {pickedSet.has(p._key) ? ' (เลือกแล้ว)' : ''}
            </option>
          ))}
        </select>

        <button
          className="btn btn-primary cascade-add"
          disabled={!prog || full || alreadyPicked}
          onClick={() => add(prog)}
        >
          {full
            ? `เลือกครบ ${MAX_PICKS} อันดับแล้ว`
            : alreadyPicked
            ? 'เพิ่มคณะนี้แล้ว'
            : '+ เพิ่มคณะนี้'}
        </button>
      </div>

      {picks.length === 0 ? (
        <p className="muted-center" style={{ padding: 14 }}>
          ยังไม่ได้เลือกคณะ — เลือกจาก dropdown ด้านบนแล้วกด “เพิ่มคณะนี้” (สูงสุด {MAX_PICKS} อันดับ)
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
        <p className="section-sub">เลือกมหาวิทยาลัย → คณะ → หลักสูตร แล้วกดเพิ่ม · เรียงตามลำดับความต้องการ สูงสุด {MAX_PICKS} อันดับ (จะไม่เลือกก็ได้ — ระบบจะแนะนำคณะที่คะแนนถึงให้)</p>
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
