import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Quote, User } from "../db/database";

const BRAND_COLOR: [number, number, number] = [234, 88, 12]; // orange-600
const DARK: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [100, 100, 100];
const LIGHT_GRAY: [number, number, number] = [245, 245, 245];

function formatCurrency(n: number) {
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function generateQuotePDF(quote: Quote, issuer: User) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // ── Encabezado con fondo ──
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, W, 42, "F");

  // Logo/símbolo
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("⚡", 14, 20);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ElectroQuote", 26, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Cotizaciones Eléctricas", 26, 24);

  // Número de cotización
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const quoteNum = `COT-${quote.id.substring(0, 8).toUpperCase()}`;
  doc.text(quoteNum, W - 14, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Fecha: ${formatDate(quote.createdAt)}`, W - 14, 20, { align: "right" });
  doc.text(`Validez: ${quote.validityDays} días`, W - 14, 26, { align: "right" });

  const statusMap: Record<string, string> = {
    borrador: "BORRADOR",
    enviada: "ENVIADA",
    aprobada: "APROBADA",
    rechazada: "RECHAZADA",
  };
  doc.setFont("helvetica", "bold");
  doc.text(`Estado: ${statusMap[quote.status]}`, W - 14, 34, { align: "right" });

  let y = 52;

  // ── Datos del emisor y cliente ──
  doc.setFontSize(9);
  doc.setTextColor(...DARK);

  // Emisor
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_COLOR);
  doc.text("COTIZACIÓN EMITIDA POR:", 14, y);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  y += 5;
  doc.text(issuer.name, 14, y);
  y += 4;
  doc.text(issuer.company, 14, y);
  y += 4;
  doc.text(issuer.email, 14, y);
  y += 4;
  doc.text(issuer.phone, 14, y);

  // Cliente
  const clientX = W / 2 + 5;
  let cy = 52;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_COLOR);
  doc.text("COTIZACIÓN PARA:", clientX, cy);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  cy += 5;
  doc.text(quote.clientName, clientX, cy);
  cy += 4;
  if (quote.clientEmail) doc.text(quote.clientEmail, clientX, cy), (cy += 4);
  if (quote.clientPhone) doc.text(quote.clientPhone, clientX, cy), (cy += 4);
  if (quote.clientAddress) {
    const addr = doc.splitTextToSize(quote.clientAddress, 85);
    doc.text(addr, clientX, cy);
    cy += addr.length * 4;
  }

  y = Math.max(y, cy) + 6;

  // ── Proyecto ──
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(14, y, W - 28, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_COLOR);
  doc.text("PROYECTO:", 18, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(quote.projectName, 18 + 28, y + 5);
  if (quote.projectDescription) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const desc = doc.splitTextToSize(quote.projectDescription, W - 50);
    doc.text(desc, 18, y + 10);
  }

  y += 20;

  // ── Tabla de materiales agrupados por categoría ──
  const grouped = quote.items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof quote.items>
  );

  const tableRows: (string | number)[][] = [];

  for (const [cat, items] of Object.entries(grouped)) {
    tableRows.push([{ content: cat, colSpan: 6, styles: { fontStyle: "bold", fillColor: [234, 88, 12], textColor: [255, 255, 255] } } as any]);
    items.forEach((item) => {
      tableRows.push([
        item.materialName,
        item.unit,
        item.quantity,
        formatCurrency(item.unitPrice),
        formatCurrency(item.subtotal),
        item.notes || "",
      ]);
    });
  }

  // Fila de mano de obra
  if (quote.laborCost > 0) {
    tableRows.push([
      { content: "Mano de Obra", colSpan: 6, styles: { fontStyle: "bold", fillColor: [234, 88, 12], textColor: [255, 255, 255] } } as any,
    ]);
    tableRows.push(["Mano de obra", "global", 1, formatCurrency(quote.laborCost), formatCurrency(quote.laborCost), ""]);
  }

  autoTable(doc, {
    startY: y,
    head: [["Material / Descripción", "Unidad", "Cant.", "Precio Unit.", "Subtotal", "Notas"]],
    body: tableRows as any,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 18 },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 25 },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Totales ──
  const totalsX = W - 14 - 70;

  const totalsData = [
    ["Subtotal Materiales + MO:", formatCurrency(quote.subtotal)],
  ];
  if (quote.discountPercent > 0) {
    totalsData.push([`Descuento (${quote.discountPercent}%):`, `- ${formatCurrency(quote.discountAmount)}`]);
  }
  if (quote.taxPercent > 0) {
    totalsData.push([`IVA (${quote.taxPercent}%):`, formatCurrency(quote.taxAmount)]);
  }

  autoTable(doc, {
    startY: y,
    body: totalsData,
    styles: { fontSize: 9 },
    columnStyles: { 0: { halign: "right" }, 1: { halign: "right", cellWidth: 30 } },
    margin: { left: totalsX },
    tableWidth: 70,
    theme: "plain",
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // Total final
  doc.setFillColor(...BRAND_COLOR);
  doc.roundedRect(totalsX - 4, y, 74, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL:", totalsX, y + 7);
  doc.text(formatCurrency(quote.total), W - 14, y + 7, { align: "right" });

  y += 18;

  // ── Notas ──
  if (quote.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_COLOR);
    doc.text("Notas y condiciones:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const notes = doc.splitTextToSize(quote.notes, W - 28);
    doc.text(notes, 14, y + 5);
    y += 5 + notes.length * 4 + 4;
  }

  // ── Pie de página ──
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(0, pageH - 14, W, 14, "F");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("Generado por ElectroQuote – Sistema de Cotizaciones Eléctricas", W / 2, pageH - 6, { align: "center" });

  doc.save(`Cotizacion_${quoteNum}_${quote.clientName.replace(/\s+/g, "_")}.pdf`);
}
