import json
import sqlite3
import sys

db = sys.argv[1]
out_dir = sys.argv[2]

conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute("SELECT level, text FROM main WHERE text IS NOT NULL AND trim(text) != ''")
rows = cur.fetchall()

by_level = {}
for level, text in rows:
    key = (level or 'max').strip()
    by_level.setdefault(key, []).append(text.strip())

for key, items in by_level.items():
    print(key, len(items))

import os

os.makedirs(out_dir, exist_ok=True)

mild = by_level.get('mild', by_level.get('min', []))
max_items = by_level.get('max', [])

if not mild and not max_items:
    all_texts = [t for _, t in rows]
    with open(os.path.join(out_dir, 'copies.json'), 'w', encoding='utf-8') as f:
        json.dump(all_texts, f, ensure_ascii=False, indent=2)
else:
    payload = {
        'mild': mild or [],
        'max': max_items or []
    }
    with open(os.path.join(out_dir, 'copies.json'), 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

print('written', out_dir)
