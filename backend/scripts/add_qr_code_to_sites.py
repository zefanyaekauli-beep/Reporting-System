# backend/scripts/add_qr_code_to_sites.py

"""
Script untuk menambahkan field qr_code ke tabel sites dan mengisi QR code untuk site yang sudah ada.
Jalankan script ini setelah restart backend untuk menerapkan perubahan model.
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.site import Site

def add_qr_code_to_sites():
    db: Session = SessionLocal()
    try:
        # Get all sites
        sites = db.query(Site).all()
        
        if not sites:
            print("Tidak ada site ditemukan. Buat site terlebih dahulu.")
            return
        
        print(f"Menemukan {len(sites)} site(s)")
        
        # Update each site with QR code if not already set
        for site in sites:
            if not site.qr_code:
                # Generate QR code based on site name or ID
                # Format: SITE_{id} or based on site name
                qr_code = f"SITE_{site.id}"
                
                # Check if QR code already exists
                existing = db.query(Site).filter(Site.qr_code == qr_code).first()
                if existing and existing.id != site.id:
                    # If conflict, use site name-based code
                    qr_code = f"SITE_{site.name.upper().replace(' ', '_')}_{site.id}"
                
                site.qr_code = qr_code
                print(f"  ✅ Site '{site.name}' (ID: {site.id}) → QR Code: {qr_code}")
        
        db.commit()
        print(f"\n✅ Berhasil mengupdate {len(sites)} site(s) dengan QR code")
        print("\n📋 QR Code yang dihasilkan:")
        for site in sites:
            print(f"   - {site.name}: {site.qr_code}")
        print("\n💡 Generate QR code dengan konten tersebut dan tempelkan di area/posting yang sesuai.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    add_qr_code_to_sites()

