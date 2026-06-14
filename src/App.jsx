import { useEffect, useMemo, useState } from 'react';
import { useProgramData } from './lib/useProgramData.js';
import { loadInitialState, saveState } from './lib/persist.js';
import InputPage from './pages/InputPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';

const initial = loadInitialState();

function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-mark">S</div>
        <div>
          <div className="topbar-title">SAPIENS TUTOR</div>
          <div className="topbar-sub">คำนวณโอกาสติดคณะ · ข้อมูลจริง TCAS69</div>
        </div>
        <InstallPrompt />
      </div>
    </header>
  );
}

export default function App() {
  const { loading, error, programs, meta } = useProgramData();
  const [view, setView] = useState('input'); // 'input' | 'results'
  const [scores, setScores] = useState(initial.scores);
  const [picks, setPicks] = useState(initial.picks); // array of record keys

  // บันทึกสถานะลง localStorage ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    saveState(scores, picks);
  }, [scores, picks]);

  const byKey = useMemo(() => {
    const m = new Map();
    for (const p of programs) m.set(p._key, p);
    return m;
  }, [programs]);

  if (loading) {
    return (
      <>
        <TopBar />
        <div className="splash">
          <div>
            <div className="spinner" />
            <div>กำลังโหลดข้อมูลหลักสูตรจริงจาก mytcas…</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar />
        <div className="splash">
          <div>
            <p style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>เกิดข้อผิดพลาด</p>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{error}</p>
            <p className="data-note">ลองรัน <code>npm run build:data</code> เพื่อสร้างไฟล์ข้อมูลก่อน</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      {view === 'input' ? (
        <InputPage
          programs={programs}
          scores={scores}
          setScores={setScores}
          picks={picks}
          setPicks={setPicks}
          byKey={byKey}
          meta={meta}
          onSubmit={() => {
            setView('results');
            window.scrollTo(0, 0);
          }}
        />
      ) : (
        <ResultsPage
          programs={programs}
          scores={scores}
          picks={picks}
          byKey={byKey}
          onBack={() => {
            setView('input');
            window.scrollTo(0, 0);
          }}
        />
      )}
    </>
  );
}
