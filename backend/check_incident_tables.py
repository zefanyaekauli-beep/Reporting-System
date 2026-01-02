import sqlite3
conn = sqlite3.connect('verolux.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()
print("\nAll tables in database:")
for table in tables:
    print(f"  - {table[0]}")

incident_tables = [t[0] for t in tables if 'incident' in t[0].lower() or 'lk_lp' in t[0] or 'bap' in t[0] or 'stplk' in t[0] or 'findings' in t[0]]
print(f"\nIncident related tables: {incident_tables}")
conn.close()

