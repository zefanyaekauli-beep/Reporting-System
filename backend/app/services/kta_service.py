# backend/app/services/kta_service.py

from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime
import qrcode
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import os

from app.models.employee import Employee
from app.models.user import User
from app.core.logger import api_logger


class KTAService:
    """Service for generating KTA (ID Card) for employees."""
    
    CARD_WIDTH = 800
    CARD_HEIGHT = 500
    QR_SIZE = 150
    
    def generate_kta_image(
        self,
        db: Session,
        employee_id: int,
        include_qr: bool = True,
    ) -> BytesIO:
        """
        Generate KTA card image for employee.
        Returns BytesIO buffer with PNG image.
        """
        try:
            employee = (
                db.query(Employee)
                .filter(Employee.id == employee_id)
                .first()
            )
            
            if not employee:
                raise ValueError(f"Employee {employee_id} not found")
            
            # Create image
            img = Image.new("RGB", (self.CARD_WIDTH, self.CARD_HEIGHT), color="#FFFFFF")
            draw = ImageDraw.Draw(img)
            
            # Try to load fonts
            try:
                title_font = ImageFont.truetype("arial.ttf", 32)
                name_font = ImageFont.truetype("arial.ttf", 48)
                info_font = ImageFont.truetype("arial.ttf", 24)
            except:
                # Fallback to default font
                title_font = ImageFont.load_default()
                name_font = ImageFont.load_default()
                info_font = ImageFont.load_default()
            
            # Background color (company branding)
            draw.rectangle([0, 0, self.CARD_WIDTH, 120], fill="#2563EB")
            
            # Title
            draw.text((20, 40), "KARTU TANDA ANGGOTA", fill="#FFFFFF", font=title_font)
            
            # Employee photo (if available)
            photo_x = 40
            photo_y = 150
            photo_size = 120
            
            if employee.photo_path and os.path.exists(employee.photo_path):
                try:
                    photo = Image.open(employee.photo_path)
                    photo = photo.resize((photo_size, photo_size), Image.Resampling.LANCZOS)
                    # Make circular
                    mask = Image.new("L", (photo_size, photo_size), 0)
                    mask_draw = ImageDraw.Draw(mask)
                    mask_draw.ellipse([0, 0, photo_size, photo_size], fill=255)
                    img.paste(photo, (photo_x, photo_y), mask)
                except Exception as e:
                    api_logger.warning(f"Failed to load employee photo: {e}")
                    # Draw placeholder
                    draw.ellipse(
                        [photo_x, photo_y, photo_x + photo_size, photo_y + photo_size],
                        fill="#E5E7EB",
                        outline="#9CA3AF",
                        width=2,
                    )
            else:
                # Draw placeholder
                draw.ellipse(
                    [photo_x, photo_y, photo_x + photo_size, photo_y + photo_size],
                    fill="#E5E7EB",
                    outline="#9CA3AF",
                    width=2,
                )
            
            # Employee info
            info_x = 200
            info_y = 150
            
            # Name
            draw.text((info_x, info_y), employee.full_name, fill="#000000", font=name_font)
            
            # NIK
            if employee.nik:
                draw.text((info_x, info_y + 60), f"NIK: {employee.nik}", fill="#666666", font=info_font)
            
            # Employee Number
            if employee.employee_number:
                draw.text((info_x, info_y + 90), f"ID: {employee.employee_number}", fill="#666666", font=info_font)
            
            # Position
            if employee.position:
                draw.text((info_x, info_y + 120), employee.position, fill="#666666", font=info_font)
            
            # Division
            if employee.division:
                draw.text((info_x, info_y + 150), f"Divisi: {employee.division}", fill="#666666", font=info_font)
            
            # QR Code
            if include_qr:
                qr_data = f"EMPLOYEE:{employee.id}:{employee.employee_number or employee.nik or ''}"
                qr = qrcode.QRCode(version=1, box_size=10, border=2)
                qr.add_data(qr_data)
                qr.make(fit=True)
                qr_img = qr.make_image(fill_color="black", back_color="white")
                qr_img = qr_img.resize((self.QR_SIZE, self.QR_SIZE), Image.Resampling.LANCZOS)
                
                qr_x = self.CARD_WIDTH - self.QR_SIZE - 40
                qr_y = self.CARD_HEIGHT - self.QR_SIZE - 40
                img.paste(qr_img, (qr_x, qr_y))
            
            # Border
            draw.rectangle([0, 0, self.CARD_WIDTH - 1, self.CARD_HEIGHT - 1], outline="#000000", width=3)
            
            # Save to BytesIO
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)
            
            return buffer
            
        except Exception as e:
            api_logger.error(f"Error generating KTA: {str(e)}", exc_info=True)
            raise
    
    def generate_kta_pdf(
        self,
        db: Session,
        employee_id: int,
    ) -> BytesIO:
        """Generate KTA as PDF."""
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Image as RLImage, Spacer
        from reportlab.lib.units import mm
        
        try:
            employee = (
                db.query(Employee)
                .filter(Employee.id == employee_id)
                .first()
            )
            
            if not employee:
                raise ValueError(f"Employee {employee_id} not found")
            
            # Generate image first
            img_buffer = self.generate_kta_image(db, employee_id, include_qr=True)
            
            # Create PDF
            pdf_buffer = BytesIO()
            doc = SimpleDocTemplate(pdf_buffer, pagesize=A4)
            story = []
            
            # Add image to PDF
            img_buffer.seek(0)
            img = RLImage(img_buffer, width=80*mm, height=50*mm)
            story.append(img)
            story.append(Spacer(1, 20))
            
            doc.build(story)
            pdf_buffer.seek(0)
            
            return pdf_buffer
            
        except Exception as e:
            api_logger.error(f"Error generating KTA PDF: {str(e)}", exc_info=True)
            raise
    
    def batch_generate_kta(
        self,
        db: Session,
        employee_ids: list[int],
        format: str = "PNG",  # PNG or PDF
    ) -> Dict[str, BytesIO]:
        """
        Batch generate KTA for multiple employees.
        Returns dict mapping employee_id to BytesIO buffer.
        """
        results = {}
        
        for emp_id in employee_ids:
            try:
                if format.upper() == "PDF":
                    buffer = self.generate_kta_pdf(db, emp_id)
                else:
                    buffer = self.generate_kta_image(db, emp_id)
                
                results[str(emp_id)] = buffer
            except Exception as e:
                api_logger.error(f"Failed to generate KTA for employee {emp_id}: {str(e)}")
                continue
        
        return results

