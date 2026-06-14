# build-history.py — รวมคะแนนต่ำสุด/สูงสุดย้อนหลังจากไฟล์ Excel ทางการของ ทปอ.
# (data/TCAS65..69_maxmin.xlsx) แล้ว join เข้ากับ programs.json ด้วยรหัสหลักสูตร
# ผลลัพธ์: public/data/history.json  = { "<program_id>__<major_id>__<project_id>": {"66":{"min":..,"max":..}, ...} }
#
# รันครั้งเดียวเมื่อมีไฟล์ Excel ใหม่:  python scripts/build-history.py
# (ข้อมูลปีเก่าไม่เปลี่ยน — ไม่ต้องรันใน CI; แอปโหลด history.json ตอนรัน)

import json, glob, os, re, sys
import pandas as pd

# ให้ stdout เป็น utf-8 (กัน UnicodeEncodeError บน Windows cp874)
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
PROGRAMS = os.path.join(ROOT, "public", "data", "programs.json")
OUT = os.path.join(ROOT, "public", "data", "history.json")

YEARS = ["66", "67", "68", "69"]  # 4 ปีย้อนหลัง (เพิ่ม "65" ได้ถ้าต้องการ)


def norm(s):
    """normalize ชื่อไทยสำหรับเทียบ: ตัดช่องว่าง/วงเล็บ/อักขระพิเศษ"""
    if s is None:
        return ""
    s = str(s)
    if s.strip().lower() in ("nan", "none", ""):
        return ""
    s = re.sub(r"[\s\(\)\[\]/.,\-–—]", "", s)
    return s.strip()


def find_col(cols, must, exclude=()):
    for c in cols:
        s = str(c)
        if all(k in s for k in must) and not any(e in s for e in exclude):
            return c
    return None


def year_of(filename):
    m = re.search(r"(6[5-9])", os.path.basename(filename))
    return m.group(1) if m else None


def num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f != f:  # NaN
        return None
    if f <= 0:  # 0 = ไม่มีการรายงานคะแนน → ถือว่าไม่มีข้อมูล
        return None
    return round(f, 2)


def load_year(path):
    """คืน list ของ dict: {pid, major_id, project_id, sub_name, min, max}"""
    xl = pd.ExcelFile(path)
    df = xl.parse(xl.sheet_names[0])
    cols = list(df.columns)
    c_pid = "program_id" if "program_id" in cols else find_col(cols, ["รหัสหลักสูตร"])
    c_major = "major_id" if "major_id" in cols else find_col(cols, ["รหัสสาขา"])
    c_proj = "project_id" if "project_id" in cols else find_col(cols, ["รหัสโครงการ"])
    c_sub = find_col(cols, ["วิชาเอก"])  # "สาขา/วิชาเอก"
    c_min = find_col(cols, ["ต่ำสุด"], exclude=("DS", "2"))
    c_max = find_col(cols, ["สูงสุด"], exclude=("DS", "2"))
    rows = []
    for _, r in df.iterrows():
        pid = str(r[c_pid]).strip() if c_pid else ""
        if not pid or pid.lower() == "nan":
            continue
        rows.append({
            "pid": pid,
            "major_id": str(r[c_major]).strip() if c_major and str(r[c_major]).strip().lower() != "nan" else None,
            "project_id": str(r[c_proj]).strip() if c_proj and str(r[c_proj]).strip().lower() != "nan" else None,
            "sub": norm(r[c_sub]) if c_sub else "",
            "min": num(r[c_min]) if c_min else None,
            "max": num(r[c_max]) if c_max else None,
        })
    return rows


def main():
    programs = json.load(open(PROGRAMS, encoding="utf-8"))

    # index records โดย program_id
    by_pid = {}
    for p in programs:
        key = "%s__%s__%s" % (p["program_id"], p["major_id"], p["project_id"])
        by_pid.setdefault(str(p["program_id"]), []).append({
            "key": key,
            "major_id": str(p["major_id"]),
            "project_id": str(p["project_id"]),
            "mname": norm(p.get("major_name_th")),
        })

    history = {}
    stats = {}

    files = {year_of(f): f for f in glob.glob(os.path.join(DATA_DIR, "*.xlsx")) if year_of(f) in YEARS}

    for year in YEARS:
        path = files.get(year)
        if not path:
            print("!! ไม่พบไฟล์ปี", year)
            continue
        rows = load_year(path)
        matched = 0
        for row in rows:
            cands = by_pid.get(row["pid"])
            if not cands:
                continue
            target = None
            if len(cands) == 1:
                target = cands[0]
            else:
                # หลายสาขา: match ด้วย major_id (+project_id) ก่อน แล้วค่อยชื่อ
                if row["major_id"] is not None:
                    mm = [c for c in cands if c["major_id"] == row["major_id"]]
                    if row["project_id"] is not None:
                        pp = [c for c in mm if c["project_id"] == row["project_id"]]
                        mm = pp or mm
                    if len(mm) == 1:
                        target = mm[0]
                    elif mm:
                        target = mm[0]
                if target is None and row["sub"]:
                    nm = [c for c in cands if c["mname"] and c["mname"] == row["sub"]]
                    if len(nm) == 1:
                        target = nm[0]
            if target is None:
                continue
            if row["min"] is None and row["max"] is None:
                continue
            rec = history.setdefault(target["key"], {})
            rec[year] = {"min": row["min"], "max": row["max"]}
            matched += 1
        stats[year] = matched
        print("ปี %s: จับคู่ %d รายการ (จาก %d แถวในไฟล์)" % (year, matched, len(rows)))

    json.dump(history, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    recs_with_hist = len(history)
    print("\n✓ เขียน %s" % OUT)
    print("  records ที่มีประวัติ: %d / %d" % (recs_with_hist, len(programs)))
    print("  ขนาดไฟล์: %.1f KB" % (os.path.getsize(OUT) / 1024))


if __name__ == "__main__":
    main()
