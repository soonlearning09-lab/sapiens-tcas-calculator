import { useEffect, useState } from 'react';

export function recordKey(p) {
  return `${p.program_id}__${p.major_id}__${p.project_id}`;
}

// ชื่อหลักสูตรสำหรับแสดงผล (รวม major/project ถ้ามี)
export function displayName(p) {
  let n = p.program_name_th || '(ไม่ระบุชื่อหลักสูตร)';
  if (p.major_name_th) n += ` — ${p.major_name_th}`;
  return n;
}
export function displayUni(p) {
  const parts = [p.university_name_th, p.faculty_name_th];
  if (p.campus_name_th && p.campus_name_th !== 'วิทยาเขตหลัก') parts.push(p.campus_name_th);
  return parts.filter(Boolean).join(' · ');
}

export function useProgramData() {
  const [state, setState] = useState({ loading: true, error: null, programs: [], meta: null });

  useEffect(() => {
    let alive = true;
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}data/programs.json`).then((r) => {
        if (!r.ok) throw new Error('โหลดข้อมูลหลักสูตรไม่สำเร็จ (' + r.status + ')');
        return r.json();
      }),
      fetch(`${base}data/programs.meta.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([programs, meta]) => {
        if (!alive) return;
        const enriched = programs.map((p) => ({
          ...p,
          _key: recordKey(p),
          _name: displayName(p),
          _uni: displayUni(p),
          _search: [
            p.university_name_th,
            p.faculty_name_th,
            p.field_name_th,
            p.program_name_th,
            p.major_name_th,
            p.program_type_name_th,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
        }));
        setState({ loading: false, error: null, programs: enriched, meta });
      })
      .catch((e) => alive && setState({ loading: false, error: e.message, programs: [], meta: null }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
