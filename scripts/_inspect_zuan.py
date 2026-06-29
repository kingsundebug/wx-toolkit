import json
import sqlite3
import sys

db = sys.argv[1]
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print('tables', tables)
for t in tables:
    cur.execute(f"PRAGMA table_info([{t}])")
    print('cols', t, cur.fetchall())
    cur.execute(f"SELECT COUNT(*) FROM [{t}]")
    print('count', t, cur.fetchone()[0])
    cur.execute(f"SELECT * FROM [{t}] LIMIT 1")
    print('sample', cur.fetchone())
