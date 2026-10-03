import type { HealthReport } from '../types';
import jsPDF from 'jspdf';

const URGENCY_COLOR: Record<string, [number, number, number]> = {
  GREEN: [22, 163, 74],
  YELLOW: [217, 119, 6],
  RED: [220, 38, 38],
};

const URGENCY_LABEL: Record<string, string> = {
  GREEN: 'HOME CARE – Safe to manage at home with rest & monitoring',
  YELLOW: 'CLINIC VISIT – Clinical evaluation recommended within 24h',
  RED: 'SEEK URGENT CARE – Prompt emergency medical evaluation required',
};

const COMPLETENESS_LABEL: Record<string, string> = {
  high: 'High (Detailed responses provided)',
  moderate: 'Moderate (Standard assessment)',
  limited: 'Limited (Initial symptom overview)',
};

export function generateHealthReportPDF(report: HealthReport): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageW - 2 * margin;

  // Header band
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 0, pageW, 34, 'F');

  doc.setFillColor(15, 118, 110); // Teal 700
  doc.rect(0, 26, pageW, 8, 'F');

  // Logo badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 6, 20, 14, 2, 2, 'F');
  doc.setTextColor(13, 148, 136);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MB+', margin + 3.5, 15);

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MediBridge AI', margin + 24, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Healthcare Triage & Care Navigator', margin + 24, 20);

  doc.setFontSize(7.5);
  doc.text('Triage Assessment Report — Not a Medical Diagnosis', margin + 24, 31.5);
  doc.text(
    `Date: ${new Date(report.timestamp).toLocaleString('en-IN')}`,
    pageW - margin - 50,
    31.5
  );

  // Urgency badge in header
  const [r, g, b] = URGENCY_COLOR[report.urgencyLevel] || [13, 148, 136];
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageW - margin - 44, 6, 44, 14, 2, 2, 'F');
  doc.setTextColor(r, g, b);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${report.urgencyLevel} TIER`, pageW - margin - 37, 15);

  let y = 42;

  // Patient Context Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'S');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSESSMENT CONTEXT', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Patient: ${report.patientName} (${report.age}y, ${report.gender})`, margin + 4, y + 12);
  doc.text(`Assessment For: ${report.careFor || 'myself'}`, margin + 4, y + 18);

  const completeness = COMPLETENESS_LABEL[report.informationCompleteness] || 'Standard';
  doc.text(`Completeness: ${completeness}`, margin + 75, y + 12);
  doc.text(
    report.referralId ? `Referral ID: ${report.referralId}` : `Report ID: ${report.id.slice(0, 10).toUpperCase()}`,
    margin + 75,
    y + 18
  );

  y += 28;

  // Triage Urgency Result Banner
  doc.setFillColor(r, g, b);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Triage Level: ${report.urgencyLevel}`, margin + 4, y + 5.5);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(URGENCY_LABEL[report.urgencyLevel] || '', margin + 4, y + 10.5);
  y += 19;

  // Doctor-Ready Summary Box (Highlighted for clinical handoff)
  doc.setFillColor(240, 253, 250); // Teal 50
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(204, 251, 241);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'S');

  doc.setTextColor(15, 118, 110);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCTOR-READY CLINICAL SUMMARY', margin + 4, y + 5.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const docSummaryText = report.doctorSummary || report.summary;
  const docSummaryLines = doc.splitTextToSize(docSummaryText, contentWidth - 8);
  doc.text(docSummaryLines.slice(0, 3), margin + 4, y + 11);
  y += 27;

  // Reported Symptoms Box
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Reported Symptoms', margin, y);
  y += 4;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const sympLines = doc.splitTextToSize(report.symptoms, contentWidth - 8);
  doc.text(sympLines.slice(0, 2), margin + 4, y + 5.5);
  y += 16;

  // Why this recommendation? (Reasoning Factors)
  if (report.reasoningFactors && report.reasoningFactors.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Why this recommendation? (Explainable Reasoning)', margin, y);
    y += 4.5;

    report.reasoningFactors.slice(0, 3).forEach((factor) => {
      doc.setFillColor(r, g, b);
      doc.circle(margin + 2.5, y - 1, 0.9, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(factor, contentWidth - 8);
      doc.text(lines, margin + 6, y);
      y += lines.length * 3.8 + 1.5;
    });
    y += 2;
  }

  // Recommended Next Steps
  const actions = report.nextSteps?.length ? report.nextSteps : report.immediateActions || [];
  if (actions.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommended Actions', margin, y);
    y += 4.5;

    actions.slice(0, 3).forEach((action, i) => {
      doc.setFillColor(r, g, b);
      doc.circle(margin + 2.5, y - 1, 0.9, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(`${i + 1}. ${action}`, contentWidth - 8);
      doc.text(lines, margin + 6, y);
      y += lines.length * 3.8 + 1.5;
    });
    y += 2;
  }

  // Warning Signs
  const warnings = report.warningSigns?.length ? report.warningSigns : report.warningSignsToWatch || [];
  if (warnings.length > 0) {
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Warning Signs — Seek Urgent Care If Observed:', margin, y);
    y += 4;

    warnings.slice(0, 2).forEach((w) => {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(146, 64, 14);
      const lines = doc.splitTextToSize(`• ${w}`, contentWidth - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 3.5 + 1;
    });
    y += 2;
  }

  // Single Clearest Next Step
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Next Step:', margin + 4, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const nextLines = doc.splitTextToSize(report.recommendedNextStep, contentWidth - 8);
  doc.text(nextLines.slice(0, 2), margin + 4, y + 8.5);
  y += 16;

  // Disclaimer Box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT SAFETY NOTICE', margin + 4, y + 4);
  doc.setFont('helvetica', 'normal');
  const disclaimer =
    'This report is an automated health triage guide, NOT a medical diagnosis. Always consult a qualified healthcare professional. In emergencies, dial 108 or 112 immediately.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 8);
  doc.text(disclaimerLines, margin + 4, y + 8);

  // Footer
  const footerY = pageH - 8;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, footerY - 4, pageW, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'MediBridge AI – Tech4Health Healthcare Navigator | Free & Confidential',
    margin,
    footerY + 2
  );
  doc.text('Emergency: 108 | 112', pageW - margin - 28, footerY + 2);

  doc.save(
    `MediBridge_Report_${report.patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`
  );
}
