"""
Watermark Service - Menambahkan watermark ke semua foto yang disimpan
Watermark berisi: Logo perusahaan, Lokasi, Waktu, dll
FIXED: Font size issue - pastikan font besar terlihat jelas di foto
"""

import os
from io import BytesIO
from datetime import datetime, timezone
from typing import Optional
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Path ke logo perusahaan
_base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_default_logo_paths = [
    os.path.join(_base_dir, "assets", "logo.png"),
    os.path.join(_base_dir, "backend", "assets", "logo.png"),
    "assets/logo.png",
    "backend/assets/logo.png",
]
LOGO_PATH = os.getenv("COMPANY_LOGO_PATH", None)
if not LOGO_PATH:
    for path in _default_logo_paths:
        if os.path.exists(path):
            LOGO_PATH = path
            break
    if not LOGO_PATH:
        LOGO_PATH = _default_logo_paths[0]
WATERMARK_OPACITY = float(os.getenv("WATERMARK_OPACITY", "0.7"))
COMPANY_NAME = os.getenv("COMPANY_NAME", "Verolux Management System")


class WatermarkService:
    """Service untuk menambahkan watermark ke foto"""
    
    def __init__(self):
        self.logo_path = LOGO_PATH
        self.opacity = WATERMARK_OPACITY
        self.company_name = COMPANY_NAME
        self._logo_image = None
        
    def _get_font(self, size: int):
        """
        Load font dengan fallback yang lebih baik
        PENTING: Pastikan font TrueType ter-load, bukan default PIL
        """
        font_paths = [
            # Windows fonts
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            # Linux fonts
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            # MacOS fonts
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ]
        
        # Try each font path
        for font_path in font_paths:
            try:
                font = ImageFont.truetype(font_path, size)
                logger.info(f"✓ Loaded font: {font_path} at size {size}px")
                return font
            except:
                continue
        
        # If all failed, use a MUCH LARGER default size
        logger.warning(f"⚠️ Could not load TrueType font! Using default font (will be small)")
        # PIL's default font is tiny, so we'll create a workaround
        return ImageFont.load_default()
        
    def _load_logo(self) -> Optional[Image.Image]:
        """Load logo perusahaan"""
        if self._logo_image is not None:
            return self._logo_image
            
        try:
            logo_paths_to_try = [self.logo_path]
            if not os.path.isabs(self.logo_path):
                _base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                logo_paths_to_try.extend([
                    os.path.join(_base_dir, "assets", "logo.png"),
                    os.path.join(_base_dir, "backend", "assets", "logo.png"),
                    os.path.join(os.getcwd(), "assets", "logo.png"),
                    os.path.join(os.getcwd(), "backend", "assets", "logo.png"),
                ])
            
            logo_found = None
            for path in logo_paths_to_try:
                if os.path.exists(path):
                    logo_found = path
                    break
            
            if logo_found:
                logo = Image.open(logo_found)
                if logo.mode != "RGBA":
                    logo = logo.convert("RGBA")
                self._logo_image = logo
                logger.info(f"Logo loaded from: {logo_found}")
                return logo
            else:
                logger.warning(f"Logo not found, creating placeholder")
                logo = self._create_placeholder_logo()
                self._logo_image = logo
                return logo
        except Exception as e:
            logger.error(f"Error loading logo: {e}")
            logo = self._create_placeholder_logo()
            self._logo_image = logo
            return logo
    
    def _create_placeholder_logo(self) -> Image.Image:
        """Create placeholder logo Verolux"""
        logo_size = (400, 400)
        logo = Image.new("RGBA", logo_size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(logo)
        
        # Try to get a large font
        font = self._get_font(60)
        
        text = "VEROLUX"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        position = ((logo_size[0] - text_width) // 2, (logo_size[1] - text_height) // 2)
        
        draw.text(position, text, fill=(255, 255, 255, 255), font=font, stroke_width=4, stroke_fill=(0, 0, 0, 255))
        
        logger.info(f"Created placeholder Verolux logo: {logo_size}")
        return logo
    
    def add_watermark(
        self,
        image_bytes: bytes,
        location: Optional[str] = None,
        timestamp: Optional[datetime] = None,
        user_name: Optional[str] = None,
        site_name: Optional[str] = None,
        additional_info: Optional[dict] = None
    ) -> bytes:
        """
        Menambahkan watermark ke foto
        
        Args:
            image_bytes: Bytes dari foto asli
            location: Lokasi (GPS coordinates atau alamat)
            timestamp: Waktu foto diambil
            user_name: Nama user yang mengambil foto
            site_name: Nama site
            additional_info: Info tambahan (dict)
        
        Returns:
            bytes: Foto dengan watermark
        """
        try:
            logger.info(f"Starting watermark process - Image size: {len(image_bytes)} bytes")
            
            if not image_bytes or len(image_bytes) == 0:
                logger.error("ERROR: image_bytes is empty!")
                raise ValueError("Image bytes is empty")
            
            # Open image
            try:
                image = Image.open(BytesIO(image_bytes))
                logger.info(f"Image opened - Size: {image.size}, Mode: {image.mode}, Format: {image.format}")
            except Exception as img_err:
                logger.error(f"ERROR: Failed to open image: {img_err}")
                raise ValueError(f"Invalid image format: {img_err}")
            
            # Convert to RGBA
            original_mode = image.mode
            if image.mode != "RGBA":
                image = image.convert("RGBA")
                logger.info(f"Image converted from {original_mode} to RGBA")
            
            # Create watermark overlay
            watermark = Image.new("RGBA", image.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(watermark)
            logger.info(f"Watermark overlay created: {watermark.size}")
            
            # Logo di tengah dihapus (sesuai permintaan user)
            # Logo tidak lagi ditampilkan, hanya pattern text yang besar
            
            # Prepare text
            timestamp = timestamp or datetime.now(timezone.utc)
            time_str = timestamp.strftime("%Y-%m-%d %H:%M:%S")
            
            info_lines = []
            if self.company_name:
                info_lines.append(f"© {self.company_name}")
            if site_name:
                info_lines.append(f"Site: {site_name}")
            if location:
                info_lines.append(f"Lokasi: {location}")
            if user_name:
                info_lines.append(f"User: {user_name}")
            info_lines.append(f"Waktu: {time_str}")
            
            if additional_info:
                for key, value in additional_info.items():
                    if value and value != "None" and str(value).strip():
                        info_lines.append(f"{key}: {value}")
            
            logger.info(f"Text watermark lines: {len(info_lines)}")
            
            # PENTING: Pattern text harus di belakang, text watermark di depan
            # Jadi kita buat pattern dulu, baru text watermark
            
            # Pattern watermark - BESAR seperti logo sebelumnya, looping banyak, diagonal (DI BELAKANG)
            try:
                pattern_text = "VEROLUX"
                # Font size BESAR: 30% dari lebar gambar (seperti logo sebelumnya)
                pattern_font_size = max(int(image.width * 0.03), 20)  # 30% dari lebar, minimum 100px
                logger.info(f"Pattern font size: {pattern_font_size}px (30% of image width: {image.width}px)")
                
                pattern_font = self._get_font(pattern_font_size)
                
                pattern_overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
                pattern_draw = ImageDraw.Draw(pattern_overlay)
                
                try:
                    text_bbox = pattern_draw.textbbox((0, 0), pattern_text, font=pattern_font)
                    text_width = text_bbox[2] - text_bbox[0]
                    text_height = text_bbox[3] - text_bbox[1]
                except:
                    text_width = len(pattern_text) * (pattern_font_size // 2)
                    text_height = pattern_font_size
                
                logger.info(f"Pattern text dimensions: {text_width}x{text_height}px")
                
                # Spacing untuk font besar (sesuai ukuran font)
                spacing = max(text_width, text_height) + 10
                diagonal = int((image.width ** 2 + image.height ** 2) ** 0.5)
                num_repetitions = int(diagonal / spacing) + 4
                
                logger.info(f"Drawing pattern {num_repetitions}x{num_repetitions} times")
                
                # Expanded canvas
                expanded_size = int((image.width ** 2 + image.height ** 2) ** 0.5) + 300
                expanded_overlay = Image.new("RGBA", (expanded_size, expanded_size), (0, 0, 0, 0))
                expanded_draw = ImageDraw.Draw(expanded_overlay)
                
                center_x = expanded_size // 2
                center_y = expanded_size // 2
                
                # Draw grid
                for row in range(-num_repetitions, num_repetitions + 1):
                    for col in range(-num_repetitions, num_repetitions + 1):
                        x = center_x + (col - row) * spacing * 0.707 - text_width // 2
                        y = center_y + (col + row) * spacing * 0.707 - text_height // 2
                        
                        expanded_draw.text((int(x), int(y)), pattern_text, fill=(255, 255, 255, 178), font=pattern_font)
                
                # Rotate -45 degrees
                rotated_overlay = expanded_overlay.rotate(-45, expand=False, fillcolor=(0, 0, 0, 0))
                
                # Crop
                crop_x = (rotated_overlay.width - image.width) // 2
                crop_y = (rotated_overlay.height - image.height) // 2
                pattern_overlay = rotated_overlay.crop((crop_x, crop_y, crop_x + image.width, crop_y + image.height))
                
                # Composite pattern ke watermark (pattern di belakang)
                watermark = Image.alpha_composite(watermark, pattern_overlay)
                logger.info(f"✓ Pattern watermark added (background layer)")
                
            except Exception as pattern_err:
                logger.warning(f"Pattern watermark failed: {pattern_err}", exc_info=True)
            
            # Sekarang tambahkan text watermark (nama, lokasi, jam) DI ATAS pattern (DI DEPAN)
            # Buat draw baru untuk watermark yang sudah ada pattern-nya
            text_draw = ImageDraw.Draw(watermark)
            
            # Font size untuk text watermark (relatif terhadap ukuran gambar)
            font_size = max(int(image.width * 0.03), 20)  # 3% dari lebar gambar, minimum 20px
            logger.info(f"Text watermark font size: {font_size}px (3% of image width: {image.width}px)")
            
            font = self._get_font(font_size)
            
            # Format text vertikal (setiap info di baris baru)
            formatted_lines = []
            for line in info_lines:
                formatted_lines.append(line)
            
            # Hitung dimensi text (multiline)
            try:
                # Hitung lebar maksimum dari semua baris
                max_width = 0
                total_height = 0
                line_height = font_size + 4
                
                for line in formatted_lines:
                    try:
                        bbox = text_draw.textbbox((0, 0), line, font=font)
                        line_width = bbox[2] - bbox[0]
                        max_width = max(max_width, line_width)
                    except:
                        line_width = len(line) * (font_size // 2)
                        max_width = max(max_width, line_width)
                
                total_height = len(formatted_lines) * line_height
                text_width = max_width
                text_height = total_height
            except:
                # Fallback calculation
                max_line_length = max(len(line) for line in formatted_lines) if formatted_lines else 0
                text_width = max_line_length * (font_size // 2)
                text_height = len(formatted_lines) * (font_size + 4)
            
            logger.info(f"Text dimensions: {text_width}x{text_height}px ({len(formatted_lines)} lines)")
            
            # Posisi: kanan bawah (bottom-right)
            padding = 15
            x_pos = image.width - text_width - padding
            y_pos = image.height - text_height - padding
            
            # Pastikan posisi valid
            x_pos = max(10, min(x_pos, image.width - text_width - 10))
            y_pos = max(10, min(y_pos, image.height - text_height - 10))
            
            # Background hitam semi-transparent
            bg_padding = 8
            try:
                text_draw.rectangle(
                    [
                        x_pos - bg_padding,
                        y_pos - bg_padding,
                        x_pos + text_width + bg_padding,
                        y_pos + text_height + bg_padding
                    ],
                    fill=(0, 0, 0, 180)  # Hitam dengan opacity
                )
                
                # Draw text vertikal (multiline) - putih tanpa opacity (DI DEPAN)
                current_y = y_pos
                for line in formatted_lines:
                    text_draw.text((x_pos, current_y), line, fill=(255, 255, 255, 255), font=font)
                    current_y += font_size + 4  # Line height
                    logger.info(f"  Line drawn: '{line}' at ({x_pos}, {current_y - font_size - 4})")
                
                logger.info(f"Text watermark drawn at bottom-right (foreground layer): ({x_pos}, {y_pos})")
            except Exception as draw_err:
                logger.error(f"Failed to draw text: {draw_err}")
            
            # Composite watermark ke image
            try:
                watermarked = Image.alpha_composite(image, watermark)
                logger.info("✓ Watermark composited (pattern behind, text in front)")
            except Exception as comp_err:
                logger.error(f"ERROR: Failed to composite: {comp_err}")
                raise
            
            # Convert back to original mode
            if original_mode == "RGB":
                watermarked = watermarked.convert("RGB")
                logger.info(f"Converted back to RGB")
            
            # Save
            output = BytesIO()
            format = image.format or "JPEG"
            try:
                if format in ["JPEG", "JPG"] or format is None:
                    watermarked.save(output, format="JPEG", quality=95, optimize=True)
                else:
                    watermarked.save(output, format=format, optimize=True)
            except Exception as save_err:
                logger.error(f"ERROR: Failed to save: {save_err}")
                output = BytesIO()
                watermarked.save(output, format="JPEG", quality=95, optimize=True)
            
            result_bytes = output.getvalue()
            
            if not result_bytes or len(result_bytes) == 0:
                logger.error("ERROR: Result bytes is empty!")
                raise ValueError("Watermarked image bytes is empty")
            
            logger.info("=" * 60)
            logger.info("✓ WATERMARK COMPLETED")
            logger.info("=" * 60)
            logger.info(f"  Original: {len(image_bytes)} bytes")
            logger.info(f"  Watermarked: {len(result_bytes)} bytes")
            logger.info(f"  Font size used: {font_size}px (text), {pattern_font_size}px (pattern)")
            logger.info("=" * 60)
            
            return result_bytes
            
        except Exception as e:
            logger.error("=" * 60)
            logger.error("CRITICAL ERROR IN WATERMARK")
            logger.error("=" * 60)
            logger.error(f"Error: {type(e).__name__}: {str(e)}")
            logger.error("=" * 60, exc_info=True)
            raise ValueError(f"Watermark processing failed: {str(e)}") from e
    
    def add_watermark_to_file(
        self,
        file_path: str,
        output_path: Optional[str] = None,
        location: Optional[str] = None,
        timestamp: Optional[datetime] = None,
        user_name: Optional[str] = None,
        site_name: Optional[str] = None,
        additional_info: Optional[dict] = None
    ) -> str:
        """Add watermark to file"""
        try:
            with open(file_path, "rb") as f:
                image_bytes = f.read()
            
            watermarked_bytes = self.add_watermark(
                image_bytes,
                location=location,
                timestamp=timestamp,
                user_name=user_name,
                site_name=site_name,
                additional_info=additional_info
            )
            
            output = output_path or file_path
            os.makedirs(os.path.dirname(output), exist_ok=True)
            
            with open(output, "wb") as f:
                f.write(watermarked_bytes)
            
            return output
            
        except Exception as e:
            logger.error(f"Error adding watermark to file: {e}", exc_info=True)
            return file_path


# Global instance
watermark_service = WatermarkService()