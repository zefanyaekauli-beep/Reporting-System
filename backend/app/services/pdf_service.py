"""
PDF Generation Service for all reports
"""
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from datetime import datetime
from typing import List, Optional, Dict, Any
import os
from io import BytesIO

class PDFService:
    """Service for generating PDF reports"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        # Subtitle style
        self.subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#424242'),
            spaceAfter=8,
            fontName='Helvetica-Bold'
        )
        
        # Normal style
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#212121'),
            spaceAfter=6,
            alignment=TA_JUSTIFY
        )
        
        # Header style
        self.header_style = ParagraphStyle(
            'CustomHeader',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#757575'),
            spaceAfter=4
        )
    
    def generate_security_report_pdf(self, report: Dict[str, Any], site_name: str, user_name: str) -> BytesIO:
        """Generate PDF for a single security report"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
        story = []
        
        # Header
        story.append(Paragraph("VEROLUX MANAGEMENT SYSTEM", self.title_style))
        story.append(Paragraph("Laporan Keamanan", self.subtitle_style))
        story.append(Spacer(1, 0.3*cm))
        
        # Report Info Table
        report_data = [
            ['No. Laporan', f"#{report.get('id', 'N/A')}"],
            ['Tanggal', self._format_datetime(report.get('created_at'))],
            ['Situs', site_name],
            ['Dilaporkan oleh', user_name],
            ['Tipe Laporan', self._format_report_type(report.get('report_type', ''))],
            ['Status', self._format_status(report.get('status', ''))],
        ]
        
        if report.get('severity'):
            report_data.append(['Tingkat Keparahan', self._format_severity(report.get('severity'))])
        
        if report.get('location_text'):
            report_data.append(['Lokasi', report.get('location_text')])
        
        report_table = Table(report_data, colWidths=[4*cm, 12*cm])
        report_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f5f5')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        
        story.append(report_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Title
        story.append(Paragraph("<b>Judul:</b>", self.subtitle_style))
        story.append(Paragraph(report.get('title', 'N/A'), self.normal_style))
        story.append(Spacer(1, 0.3*cm))
        
        # Description
        if report.get('description'):
            story.append(Paragraph("<b>Deskripsi:</b>", self.subtitle_style))
            story.append(Paragraph(report.get('description', ''), self.normal_style))
            story.append(Spacer(1, 0.3*cm))
        
        # Evidence
        if report.get('evidence_paths'):
            story.append(Paragraph("<b>Bukti Foto:</b>", self.subtitle_style))
            evidence_paths = report.get('evidence_paths', '').split(',')
            for path in evidence_paths:
                if path.strip():
                    story.append(Paragraph(f"• {path.strip()}", self.header_style))
            story.append(Spacer(1, 0.3*cm))
        
        # Footer
        story.append(Spacer(1, 1*cm))
        story.append(Paragraph(f"Dicetak pada: {datetime.now().strftime('%d %B %Y, %H:%M WIB')}", self.header_style))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_reports_summary_pdf(self, reports: List[Dict[str, Any]], site_name: str, from_date: Optional[str] = None, to_date: Optional[str] = None) -> BytesIO:
        """Generate PDF for multiple security reports"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
        story = []
        
        # Header
        story.append(Paragraph("VEROLUX MANAGEMENT SYSTEM", self.title_style))
        story.append(Paragraph("Ringkasan Laporan Keamanan", self.subtitle_style))
        story.append(Spacer(1, 0.3*cm))
        
        # Summary Info
        summary_data = [
            ['Situs', site_name],
            ['Total Laporan', str(len(reports))],
        ]
        
        if from_date:
            summary_data.append(['Dari Tanggal', from_date])
        if to_date:
            summary_data.append(['Sampai Tanggal', to_date])
        
        # Count by type
        type_counts = {}
        severity_counts = {'low': 0, 'medium': 0, 'high': 0}
        status_counts = {'open': 0, 'in_progress': 0, 'closed': 0}
        
        for report in reports:
            rtype = report.get('report_type', 'unknown')
            type_counts[rtype] = type_counts.get(rtype, 0) + 1
            
            if report.get('severity'):
                severity_counts[report.get('severity', 'low')] = severity_counts.get(report.get('severity', 'low'), 0) + 1
            
            status = report.get('status', 'open')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        summary_data.append(['', ''])
        summary_data.append(['<b>Ringkasan per Tipe:</b>', ''])
        for rtype, count in type_counts.items():
            summary_data.append([f"  {self._format_report_type(rtype)}", str(count)])
        
        summary_data.append(['', ''])
        summary_data.append(['<b>Ringkasan per Tingkat Keparahan:</b>', ''])
        for severity, count in severity_counts.items():
            if count > 0:
                summary_data.append([f"  {self._format_severity(severity)}", str(count)])
        
        summary_data.append(['', ''])
        summary_data.append(['<b>Ringkasan per Status:</b>', ''])
        for status, count in status_counts.items():
            if count > 0:
                summary_data.append([f"  {self._format_status(status)}", str(count)])
        
        summary_table = Table(summary_data, colWidths=[6*cm, 10*cm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#1a237e')),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Reports List
        story.append(Paragraph("<b>Daftar Laporan:</b>", self.subtitle_style))
        story.append(Spacer(1, 0.2*cm))
        
        for idx, report in enumerate(reports, 1):
            story.append(Paragraph(f"<b>{idx}. {report.get('title', 'N/A')}</b>", self.normal_style))
            
            report_info = [
                f"ID: #{report.get('id')}",
                f"Tipe: {self._format_report_type(report.get('report_type', ''))}",
                f"Tanggal: {self._format_datetime(report.get('created_at'))}",
            ]
            
            if report.get('severity'):
                report_info.append(f"Keparahan: {self._format_severity(report.get('severity'))}")
            
            if report.get('location_text'):
                report_info.append(f"Lokasi: {report.get('location_text')}")
            
            story.append(Paragraph(" | ".join(report_info), self.header_style))
            
            if report.get('description'):
                desc = report.get('description', '')[:200]
                if len(report.get('description', '')) > 200:
                    desc += "..."
                story.append(Paragraph(desc, self.header_style))
            
            story.append(Spacer(1, 0.3*cm))
            
            if idx < len(reports):
                story.append(Spacer(1, 0.2*cm))
        
        # Footer
        story.append(Spacer(1, 1*cm))
        story.append(Paragraph(f"Dicetak pada: {datetime.now().strftime('%d %B %Y, %H:%M WIB')}", self.header_style))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_patrol_log_pdf(self, patrol: Dict[str, Any], site_name: str, user_name: str) -> BytesIO:
        """Generate PDF for a patrol log"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
        story = []
        
        # Header
        story.append(Paragraph("VEROLUX MANAGEMENT SYSTEM", self.title_style))
        story.append(Paragraph("Laporan Patroli", self.subtitle_style))
        story.append(Spacer(1, 0.3*cm))
        
        # Patrol Info
        start_time = self._format_datetime(patrol.get('start_time'))
        end_time = self._format_datetime(patrol.get('end_time')) if patrol.get('end_time') else "Masih berlangsung"
        
        duration = ""
        if patrol.get('start_time') and patrol.get('end_time'):
            start = datetime.fromisoformat(str(patrol.get('start_time')).replace('Z', '+00:00'))
            end = datetime.fromisoformat(str(patrol.get('end_time')).replace('Z', '+00:00'))
            diff = end - start
            hours = diff.seconds // 3600
            minutes = (diff.seconds % 3600) // 60
            duration = f"{hours} jam {minutes} menit"
        
        patrol_data = [
            ['No. Patrol', f"#{patrol.get('id', 'N/A')}"],
            ['Situs', site_name],
            ['Petugas', user_name],
            ['Waktu Mulai', start_time],
            ['Waktu Selesai', end_time],
            ['Durasi', duration if duration else "N/A"],
            ['Area', patrol.get('area_text', 'N/A')],
        ]
        
        patrol_table = Table(patrol_data, colWidths=[4*cm, 12*cm])
        patrol_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f5f5')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        
        story.append(patrol_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Notes
        if patrol.get('notes'):
            story.append(Paragraph("<b>Catatan:</b>", self.subtitle_style))
            story.append(Paragraph(patrol.get('notes', ''), self.normal_style))
            story.append(Spacer(1, 0.3*cm))
        
        # Footer
        story.append(Spacer(1, 1*cm))
        story.append(Paragraph(f"Dicetak pada: {datetime.now().strftime('%d %B %Y, %H:%M WIB')}", self.header_style))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def _format_datetime(self, dt_str: Optional[str]) -> str:
        """Format datetime string to Indonesian format"""
        if not dt_str:
            return "N/A"
        try:
            if isinstance(dt_str, str):
                dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            else:
                dt = dt_str
            return dt.strftime('%d %B %Y, %H:%M WIB')
        except:
            return str(dt_str)
    
    def _format_report_type(self, rtype: str) -> str:
        """Format report type to Indonesian"""
        type_map = {
            'daily': 'Laporan Harian',
            'incident': 'Insiden',
            'finding': 'Temuan',
            'daily_summary': 'Ringkasan Harian',
            'CLEANING_ISSUE': 'Masalah Kebersihan',
            'VEHICLE_UNSAFE': 'Kendaraan Tidak Aman',
            'TRIP_ISSUE': 'Masalah Perjalanan',
            'ACCIDENT': 'Kecelakaan',
            'CHECKLIST_NON_COMPLIANCE': 'Ketidakpatuhan Checklist',
        }
        return type_map.get(rtype, rtype.replace('_', ' ').title())
    
    def _format_severity(self, severity: str) -> str:
        """Format severity to Indonesian"""
        severity_map = {
            'low': 'Rendah',
            'medium': 'Sedang',
            'high': 'Tinggi',
        }
        return severity_map.get(severity.lower(), severity.title())
    
    def _format_status(self, status: str) -> str:
        """Format status to Indonesian"""
        status_map = {
            'open': 'Terbuka',
            'in_progress': 'Sedang Diproses',
            'closed': 'Ditutup',
        }
        return status_map.get(status.lower(), status.replace('_', ' ').title())

