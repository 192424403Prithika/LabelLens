import os
import io
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

class PDFService:
    def __init__(self):
        pass

    def generate_product_report(self, product: Dict[str, Any], analysis: Dict[str, Any] = None) -> bytes:
        """
        Generates a professional food-label intelligence PDF report using ReportLab.
        Matches LabelLens brand colors: Forest Green, Warm Cream, Tangerine Orange.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Brand colors
        c_forest = colors.HexColor("#1b4332")
        c_forest_light = colors.HexColor("#2d6a4f")
        c_orange = colors.HexColor("#ea580c")
        c_cream = colors.HexColor("#fefae0")
        c_gray_bg = colors.HexColor("#f8fafc")
        c_dark = colors.HexColor("#0f172a")

        # Custom typography styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=c_forest
        )

        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#475569")
        )

        section_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=17,
            textColor=c_forest_light,
            spaceBefore=12,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            'BodyTextCustom',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=c_dark
        )

        bold_style = ParagraphStyle(
            'BoldTextCustom',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=13,
            textColor=c_dark
        )

        alert_style = ParagraphStyle(
            'AlertText',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=13,
            textColor=c_orange
        )

        story = []

        # Header Banner
        header_data = [
            [
                Paragraph("<b>LabelLens</b> — AI Food Label Intelligence Report", ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=14, textColor=colors.white)),
                Paragraph("Evidence-Based Food Analysis", ParagraphStyle('H2', fontName='Helvetica', fontSize=10, textColor=colors.white, alignment=2))
            ]
        ]
        t_header = Table(header_data, colWidths=[340, 200])
        t_header.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), c_forest),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(t_header)
        story.append(Spacer(1, 14))

        # Product Title
        name = product.get("name", "Packaged Food Product")
        brand = product.get("brand", "Brand")
        category = product.get("category", "Grocery")
        barcode = product.get("barcode", "N/A")
        quality = product.get("data_quality_score", 95.0)

        story.append(Paragraph(f"{name}", title_style))
        story.append(Paragraph(f"Brand: <b>{brand}</b> | Category: <b>{category}</b> | Barcode: <b>{barcode}</b> | AI Data Quality: <b>{quality}%</b>", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=4, spaceAfter=12))

        # Allergen Banner if present
        allergens = product.get("declared_allergens", [])
        may_contain = product.get("may_contain_allergens", [])
        if allergens or may_contain:
            alert_items = []
            if allergens:
                alert_items.append(f"CONTAINS DECLARED: {', '.join(allergens).upper()}")
            if may_contain:
                alert_items.append(f"MAY CONTAIN: {', '.join(may_contain)}")
            
            t_alert = Table([[Paragraph(f"⚠️ <b>ALLERGEN ADVISORY:</b> {' | '.join(alert_items)}", alert_style)]], colWidths=[540])
            t_alert.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fff7ed")),
                ('BOX', (0, 0), (-1, -1), 1, c_orange),
                ('PADDING', (0, 0), (-1, -1), 7),
            ]))
            story.append(t_alert)
            story.append(Spacer(1, 10))

        # Nutrition Facts Section
        story.append(Paragraph("Nutrition Information", section_style))
        nut = product.get("nutrition_per_serving") or product.get("nutrition_per_100g", {})
        if hasattr(nut, "dict"): nut = nut.dict()

        serving_desc = product.get("serving_description", f"{product.get('serving_size', 100)}{product.get('serving_unit', 'g')}")

        nutrition_rows = [
            [Paragraph(f"<b>Serving Size:</b> {serving_desc}", bold_style), Paragraph(f"<b>Calories:</b> {int(nut.get('calories', 0))} kcal", bold_style)],
            [Paragraph("Total Fat", body_style), Paragraph(f"{nut.get('fat_total_g', 0)} g", bold_style)],
            [Paragraph("  - Saturated Fat", body_style), Paragraph(f"{nut.get('saturated_fat_g', 0)} g", body_style)],
            [Paragraph("Total Carbohydrates", body_style), Paragraph(f"{nut.get('carbohydrates_g', 0)} g", bold_style)],
            [Paragraph("  - Total Sugars", body_style), Paragraph(f"{nut.get('sugars_g', 0)} g", body_style)],
            [Paragraph("  - Added Sugars", body_style), Paragraph(f"{nut.get('added_sugars_g', 0)} g", body_style)],
            [Paragraph("Dietary Fiber", body_style), Paragraph(f"{nut.get('fiber_g', 0)} g", bold_style)],
            [Paragraph("Protein", body_style), Paragraph(f"{nut.get('protein_g', 0)} g", bold_style)],
            [Paragraph("Sodium", body_style), Paragraph(f"{int(nut.get('sodium_mg', 0))} mg", bold_style)],
        ]
        t_nut = Table(nutrition_rows, colWidths=[320, 220])
        t_nut.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_nut)
        story.append(Spacer(1, 12))

        # Ingredients Section
        story.append(Paragraph("AI Ingredient Understanding & Scientific Evidence", section_style))
        ing_list = product.get("ingredients_list", [])
        
        if ing_list:
            ing_table_data = [[
                Paragraph("<b>Ingredient</b>", bold_style),
                Paragraph("<b>Category</b>", bold_style),
                Paragraph("<b>Plain Explanation & Evidence</b>", bold_style)
            ]]
            for ing in ing_list[:8]:  # Show top items to fit neatly
                clean_name = ing.get("clean_name", ing.get("name", ""))
                cat = ing.get("category", "General")
                expl = ing.get("explanation", "")
                src = ing.get("evidence_source", "")
                desc_text = f"{expl} <br/><font size=7 color='#64748b'><b>Evidence:</b> {src}</font>"
                
                ing_table_data.append([
                    Paragraph(f"<b>{clean_name}</b>", body_style),
                    Paragraph(f"<font color='#2d6a4f'><b>{cat}</b></font>", body_style),
                    Paragraph(desc_text, body_style)
                ])

            t_ing = Table(ing_table_data, colWidths=[120, 110, 310])
            t_ing.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), c_forest_light),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(t_ing)
        else:
            raw_text = product.get("ingredients_raw", "Ingredients data not available.")
            story.append(Paragraph(f"<b>Ingredients:</b> {raw_text}", body_style))

        # Footer Notice
        story.append(Spacer(1, 16))
        disclaimer = (
            "<b>LabelLens Research Disclaimer:</b> This document is generated for informational and document understanding research. "
            "It does not replace certified clinical or allergen diagnosis. Check official product packaging before consumption."
        )
        story.append(Paragraph(disclaimer, ParagraphStyle('Disc', parent=styles['Normal'], fontSize=7.5, leading=10, textColor=colors.HexColor("#64748b"))))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

pdf_service = PDFService()
