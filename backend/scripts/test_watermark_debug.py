#!/usr/bin/env python3
"""
Test script untuk debug watermark service
Mencetak semua informasi yang diperlukan untuk debugging
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import logging

# Setup logging dengan level DEBUG
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_imports():
    """Test apakah semua import berhasil"""
    print("=" * 60)
    print("TESTING IMPORTS")
    print("=" * 60)
    
    try:
        from PIL import Image, ImageDraw, ImageFont, ImageEnhance
        print("✓ PIL/Pillow imported successfully")
    except ImportError as e:
        print(f"✗ PIL/Pillow import failed: {e}")
        return False
    
    try:
        from app.services.watermark_service import watermark_service
        print("✓ watermark_service imported successfully")
        print(f"  Logo path: {watermark_service.logo_path}")
        print(f"  Company name: {watermark_service.company_name}")
        print(f"  Opacity: {watermark_service.opacity}")
    except Exception as e:
        print(f"✗ watermark_service import failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def test_logo():
    """Test apakah logo bisa di-load"""
    print("\n" + "=" * 60)
    print("TESTING LOGO")
    print("=" * 60)
    
    try:
        from app.services.watermark_service import watermark_service
        
        logo_path = watermark_service.logo_path
        print(f"Logo path: {logo_path}")
        print(f"Logo path exists: {os.path.exists(logo_path)}")
        
        if os.path.exists(logo_path):
            logo = watermark_service._load_logo()
            if logo:
                print(f"✓ Logo loaded successfully")
                print(f"  Size: {logo.size}")
                print(f"  Mode: {logo.mode}")
                return True
            else:
                print("✗ Logo is None")
                return False
        else:
            print("⚠ Logo file not found, will use placeholder")
            logo = watermark_service._load_logo()
            if logo:
                print(f"✓ Placeholder logo created")
                print(f"  Size: {logo.size}")
                print(f"  Mode: {logo.mode}")
                return True
            else:
                print("✗ Placeholder logo creation failed")
                return False
    except Exception as e:
        print(f"✗ Logo test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_watermark():
    """Test watermark dengan sample image"""
    print("\n" + "=" * 60)
    print("TESTING WATERMARK")
    print("=" * 60)
    
    try:
        from app.services.watermark_service import watermark_service
        from PIL import Image
        from io import BytesIO
        from datetime import datetime, timezone
        import io
        
        # Create a test image
        print("1. Creating test image...")
        test_image = Image.new("RGB", (800, 600), color=(200, 200, 200))
        test_bytes = BytesIO()
        test_image.save(test_bytes, format="JPEG")
        test_bytes.seek(0)
        image_bytes = test_bytes.read()
        print(f"   ✓ Test image created: {len(image_bytes)} bytes")
        
        # Test watermark
        print("\n2. Applying watermark...")
        logger.info("Starting watermark test...")
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
        result_image = Image.open(BytesIO(watermarked))
        print(f"   ✓ Watermarked image is valid: {result_image.size}")
        
        return True
    except Exception as e:
        print(f"   ✗ Watermark test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("WATERMARK SERVICE DEBUG TEST")
    print("=" * 60)
    
    import io
    
    results = []
    results.append(("Imports", test_imports()))
    results.append(("Logo", test_logo()))
    results.append(("Watermark", test_watermark()))
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{name}: {status}")
    
    if all(r[1] for r in results):
        print("\n✓ All tests passed!")
        print("  Check test_watermark_output.jpg to see the result")
    else:
        print("\n✗ Some tests failed. Check logs above.")
        sys.exit(1)
