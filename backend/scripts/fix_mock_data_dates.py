#!/usr/bin/env python3
"""
Fix mock data dates to be today and recent days.
Run: python3 scripts/fix_mock_data_dates.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.divisions.security.models import SecurityReport, SecurityPatrolLog
from datetime import date, datetime, timedelta

def fix_dates():
    db = SessionLocal()
    try:
        today = date.today()
        
        # Update reports to be from today and recent days
        reports = db.query(SecurityReport).filter(SecurityReport.user_id == 1).all()
        print(f"Updating {len(reports)} reports...")
        
        for i, report in enumerate(reports):
            # Make ALL reports from today (different times)
            new_datetime = datetime.combine(today, datetime.min.time().replace(hour=8 + (i % 12), minute=(i * 5) % 60))
            
            # Update created_at
            report.created_at = new_datetime
            print(f"  ✓ Updated report '{report.title[:40]}...' to {new_datetime.strftime('%Y-%m-%d %H:%M')}")
        
        # Update patrols to be from today and recent days
        patrols = db.query(SecurityPatrolLog).filter(SecurityPatrolLog.user_id == 1).all()
        print(f"\nUpdating {len(patrols)} patrols...")
        
        for i, patrol in enumerate(patrols):
            # Make ALL patrols from today (different times)
            new_start = datetime.combine(today, datetime.min.time().replace(hour=8 + (i % 12), minute=(i * 10) % 60))
            new_end = new_start + timedelta(minutes=45)
            
            patrol.start_time = new_start
            patrol.end_time = new_end
            print(f"  ✓ Updated patrol '{patrol.area_text[:40]}...' to {new_start.strftime('%Y-%m-%d %H:%M')}")
        
        db.commit()
        print("\n✅ All dates updated!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    fix_dates()

