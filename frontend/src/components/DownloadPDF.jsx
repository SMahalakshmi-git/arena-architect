import jsPDF from "jspdf";

export default function DownloadPDF({ projects = [], materials = [], suppliers = [] }) {
  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Arena Architect — Procurement Summary", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    doc.setFontSize(14);
    doc.text("Projects", 14, 45);
    doc.setFontSize(10);
    projects.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.name} — ${p.location} — ${p.status}`, 14, 55 + i * 8);
    });

    doc.setFontSize(14);
    doc.text("Top Suppliers", 14, 100);
    doc.setFontSize(10);
    suppliers.slice(0, 5).forEach((s, i) => {
      doc.text(`${i + 1}. ${s.name} — ${s.region} — Score: ${s.reliability_score}`, 14, 110 + i * 8);
    });

    doc.save("procurement-summary.pdf");
  };

  return (
    <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
      Download PDF
    </button>
  );
}