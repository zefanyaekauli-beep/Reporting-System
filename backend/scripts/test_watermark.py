#!/usr/bin/env python3
"""
Test script untuk verifikasi watermark service
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.watermark_service import watermark_service
from datetime import datetime, timezone
from PIL import Image
import io

def test_watermark():
    """Test watermark service dengan sample image"""
    print("=" * 60)
    print("Testing Watermark Service")
    print("=" * 60)
    
    # Create a test image
    print("\n1. Creating test image...")
    test_image = Image.new("RGB", (800, 600), color=(200, 200, 200))
    test_bytes = io.BytesIO()
    test_image.save(test_bytes, format="JPEG")
    test_bytes.seek(0)
    image_bytes = test_bytes.read()
    
    print(f"   ✓ Test image created: {len(image_bytes)} bytes")
    
    # Test watermark
    print("\n2. Applying watermark...")
    try:
        watermarked = watermark_service.add_watermark(
            image_bytes,
            location="GPS: -6.200000, 106.816666",
            timestamp=datetime.now(timezone.utc),
            user_name="Test User",
            site_name="Test Site",
            additional_info={"Role": "SECURITY", "Test": "Yes"}
        )
        print(f"   ✓ Watermark applied successfully")
        print(f"   ✓ Original size: {len(image_bytes)} bytes")
        print(f"   ✓ Watermarked size: {len(watermarked)} bytes")
        
        # Save test result
        output_path = "test_watermark_output.jpg"
        with open(output_path, "wb") as f:
            f.write(watermarked)
        print(f"   ✓ Saved test result to: {output_path}")
        
        # Verify it's a valid image
        result_image = Image.open(io.BytesIO(watermarked))
        print(f"   ✓ Watermarked image is valid: {result_image.size}")
        
        return True
    except Exception as e:
        print(f"   ✗ Watermark failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_logo():
    """Check if logo exists"""
    print("\n3. Checking logo...")
    logo_path = watermark_service.logo_path
    if os.path.exists(logo_path):
        print(f"   ✓ Logo found at: {logo_path}")
        try:
            logo = Image.open(logo_path)
            print(f"   ✓ Logo is valid: {logo.size}, mode: {logo.mode}")
            return True
        except Exception as e:
            print(f"   ✗ Logo file exists but cannot be opened: {e}")
            return False
    else:
        print(f"   ⚠ Logo not found at: {logo_path}")
        print(f"   ⚠ Will use placeholder logo")
        return False

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("WATERMARK SERVICE TEST")
    print("=" * 60)
    
    logo_ok = check_logo()
    watermark_ok = test_watermark()
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Logo: {'✓ OK' if logo_ok else '⚠ Using placeholder'}")
    print(f"Watermark: {'✓ OK' if watermark_ok else '✗ FAILED'}")
    
    if watermark_ok:
        print("\n✓ Watermark service is working correctly!")
        print("  Check test_watermark_output.jpg to see the result")
    else:
        print("\n✗ Watermark service has issues. Check logs above.")
        sys.exit(1)
