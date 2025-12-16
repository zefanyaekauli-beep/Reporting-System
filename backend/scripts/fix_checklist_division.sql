-- Script to add division column to checklist_templates table if it doesn't exist
-- Run this with: sqlite3 verolux_test.db < scripts/fix_checklist_division.sql
-- Or use the Python script: python scripts/fix_checklist_division.py

-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- This script will fail if the column already exists.
-- Use the Python script instead for automatic checking.

-- Check if column exists first (this requires manual checking or using Python)
-- The Python script (fix_checklist_division.py) handles this automatically

-- If you're sure the column doesn't exist, uncomment the lines below:

-- ALTER TABLE checklist_templates ADD COLUMN division VARCHAR(32);
-- UPDATE checklist_templates SET division = 'SECURITY' WHERE division IS NULL;
-- CREATE INDEX IF NOT EXISTS ix_checklist_templates_division ON checklist_templates(division);

-- Otherwise, use the Python script which checks automatically:
-- python scripts/fix_checklist_division.py

