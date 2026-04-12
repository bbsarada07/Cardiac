import os
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet

class PDFReportGenerator:
    """
    V4 Feature: Generates a clinical multi-variable PDF export for doctors.
    """
    def __init__(self, output_dir="exports"):
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def generate_report(self, patient_data, recent_events):
        filename = f"{self.output_dir}/{patient_data['name'].replace(' ', '_')}_Report_{datetime.datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        
        doc = SimpleDocTemplate(filename, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Header
        elements.append(Paragraph("<b>CLINICAL CARDIAC MONITORING REPORT</b>", styles['Title']))
        elements.append(Spacer(1, 12))
        
        # Patient Details
        elements.append(Paragraph(f"<b>Patient:</b> {patient_data['name']}", styles['Normal']))
        elements.append(Paragraph(f"<b>Age/Sex:</b> {patient_data['age']} / {patient_data['sex']}", styles['Normal']))
        elements.append(Paragraph(f"<b>Conditions:</b> {patient_data['conditions']}", styles['Normal']))
        elements.append(Paragraph(f"<b>Generated:</b> {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        elements.append(Spacer(1, 24))
        
        # Events Table
        elements.append(Paragraph("<b>Recent Critical Events</b>", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        if recent_events:
            data = [["Timestamp", "Type", "Risk %", "HR", "Stability"]]
            for ev in recent_events[:10]: # Top 10
                data.append([
                    ev['timestamp'][:19], 
                    ev['event_type'], 
                    f"{ev['risk_pct']:.1f}%", 
                    f"{ev['hr']:.0f}", 
                    f"{ev['stability']:.1f}"
                ])
                
            tt = Table(data, colWidths=[130, 80, 80, 80, 80])
            tt.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
                ('GRID', (0,0), (-1,-1), 1, colors.black)
            ]))
            elements.append(tt)
        else:
            elements.append(Paragraph("No critical events recorded in this session.", styles['Normal']))
            
        doc.build(elements)
        return filename
