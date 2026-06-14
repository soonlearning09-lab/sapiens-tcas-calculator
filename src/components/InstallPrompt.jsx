import { useEffect, useState } from 'react';

// ตรวจว่ากำลังรันแบบติดตั้งแล้ว (standalone) หรือยัง
function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * ปุ่ม/แบนเนอร์ติดตั้งแอป
 * - Chrome/Edge/Android: ดักอีเวนต์ beforeinstallprompt → ปุ่มเรียก native install
 * - iOS Safari: ไม่มี API ติดตั้ง → แสดงคำแนะนำ "แชร์ → เพิ่มไปยังหน้าจอโฮม"
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  // มี native prompt (Android/desktop)
  if (deferred) {
    return (
      <button
        className="install-btn"
        onClick={async () => {
          deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
      >
        ⬇ ติดตั้งแอป
      </button>
    );
  }

  // iOS Safari → แสดงปุ่มที่เปิดคำแนะนำ
  if (isIOS()) {
    return (
      <>
        <button className="install-btn" onClick={() => setShowIosHint(true)}>
          ⬇ ติดตั้งแอป
        </button>
        {showIosHint && (
          <div className="install-sheet" onClick={() => setShowIosHint(false)}>
            <div className="install-sheet-card" onClick={(e) => e.stopPropagation()}>
              <div className="install-sheet-title">ติดตั้งบน iPhone / iPad</div>
              <ol className="install-sheet-steps">
                <li>แตะปุ่ม <b>แชร์</b> <span aria-hidden>􀈂</span> ด้านล่างของ Safari</li>
                <li>เลือก <b>เพิ่มไปยังหน้าจอโฮม</b> (Add to Home Screen)</li>
                <li>แตะ <b>เพิ่ม</b> มุมขวาบน</li>
              </ol>
              <button className="install-sheet-close" onClick={() => setShowIosHint(false)}>
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
