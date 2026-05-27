const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const dbPath = path.join(__dirname, 'zuan-data.db')
const outDir = path.join(__dirname, '..', 'common', 'zuan-baodian')

const py = `
import json, sqlite3, sys
db = sys.argv[1]
out = sys.argv[2]
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print('tables', tables)
for t in tables:
    cur.execute(f"PRAGMA table_info({t})")
    print('cols', t, cur.fetchall())
    cur.execute(f"SELECT COUNT(*) FROM [{t}]")
    print('count', t, cur.fetchone()[0])
`

fs.writeFileSync(path.join(__dirname, '_inspect.py'), py)
const info = execSync(`python "${path.join(__dirname, '_inspect.py')}" "${dbPath}" "${outDir}"`, {
  encoding: 'utf8'
})
console.log(info)
