import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { formatoFecha, formatoMoneda, sumarRecepciones, titulosReporte } from './reporte';
import type { ConsultaRecepcion, FilaRecepcion } from './reporte';

function fechaPeriodoPdf(fecha: string) {
  const [anio, mes, dia] = fecha.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${dia}-${meses[Number(mes) - 1]}.-${anio.slice(-2)}`;
}

export function crearPdfRecepciones(
  consulta: ConsultaRecepcion,
  filas: FilaRecepcion[],
  fechaImpresion = new Date(),
) {
  if (filas.length === 0) throw new Error('No hay registros para exportar.');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true });
  const margen = 18;
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const anchoTabla = ancho - margen * 2;
  const titulo = titulosReporte[consulta.nivel];
  doc.setProperties({ title: titulo, subject: 'Recepción de mercancías', author: 'Berllano' });
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(20);
  const lineasTitulo: string[] = doc.splitTextToSize(titulo, anchoTabla);
  const finTitulo = 14 + (lineasTitulo.length - 1) * 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const contexto: string[] = [];
  if (consulta.nivel !== 'sucursales') {
    contexto.push(`Sucursal: ${consulta.sucursal.nombre}`);
  }
  if (consulta.nivel === 'folios') {
    contexto.push(`Proveedor: ${consulta.proveedor.id} - ${consulta.proveedor.nombre}`);
  }
  const lineasContexto: string[] = contexto.flatMap((linea) => doc.splitTextToSize(linea, anchoTabla));
  const inicioTabla = finTitulo + 17 + lineasContexto.length * 5;
  const esFolios = consulta.nivel === 'folios';
  const columnasTexto = esFolios ? 2 : 1;
  const totales = sumarRecepciones(filas);

  autoTable(doc, {
    startY: inicioTabla,
    margin: { top: inicioTabla, bottom: 20, left: margen, right: margen },
    theme: 'plain',
    showHead: 'everyPage',
    showFoot: 'lastPage',
    rowPageBreak: 'avoid',
    head: [[
      ...(esFolios ? ['Fecha', 'Folio'] : [consulta.nivel === 'sucursales' ? 'Sucursal' : 'Proveedor']),
      'Subtotal', 'IVA', 'Total',
    ]],
    body: filas.map((fila) => [
      ...(esFolios ? [formatoFecha(fila.fecha), fila.clave] : [fila.nombre || fila.clave]),
      formatoMoneda(fila.subtotal), formatoMoneda(fila.iva), formatoMoneda(fila.total),
    ]),
    foot: [[
      { content: 'Totales:', colSpan: columnasTexto, styles: { halign: 'right' } },
      formatoMoneda(totales.subtotal), formatoMoneda(totales.iva), formatoMoneda(totales.total),
    ]],
    styles: {
      font: 'helvetica', fontSize: 9, textColor: [20, 20, 20],
      cellPadding: { top: 1.7, bottom: 1.7, left: 1, right: 1 },
      lineColor: [150, 150, 150], lineWidth: { bottom: 0.15 }, overflow: 'linebreak',
    },
    headStyles: { textColor: [0, 65, 0], fontStyle: 'bold', lineWidth: 0 },
    footStyles: { fontStyle: 'bold', halign: 'right', lineWidth: { top: 0.35, bottom: 0.15 } },
    columnStyles: {
      ...(esFolios ? { 0: { cellWidth: 27 }, 1: { cellWidth: anchoTabla - 129 } } : {}),
      [columnasTexto]: { halign: 'right', cellWidth: 34 },
      [columnasTexto + 1]: { halign: 'right', cellWidth: 34 },
      [columnasTexto + 2]: { halign: 'right', cellWidth: 34 },
    },
    didParseCell: ({ section, column, cell }) => {
      if (section === 'head' && column.index >= columnasTexto) cell.styles.halign = 'right';
    },
    willDrawPage: () => {
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(20);
      doc.setTextColor(0);
      doc.text(lineasTitulo, margen, 14, { lineHeightFactor: 1.13 });
      doc.setDrawColor(0);
      doc.setLineWidth(1.2);
      doc.line(margen, finTitulo + 3, ancho - margen, finTitulo + 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(145, 0, 0);
      doc.text(`Del ${fechaPeriodoPdf(consulta.fechaInicial)}   al ${fechaPeriodoPdf(consulta.fechaFinal)}`, margen, finTitulo + 9);
      doc.setTextColor(30);
      lineasContexto.forEach((linea, indice) => doc.text(linea, margen, finTitulo + 15 + indice * 5));
    },
  });

  const impresion = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(fechaImpresion);
  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50);
    doc.text(`Impresión: ${impresion}`, margen, alto - 9);
    doc.text(`Página ${pagina} de ${paginas}`, ancho - margen, alto - 9, { align: 'right' });
  }
  return doc;
}

export async function exportarPdfRecepciones(consulta: ConsultaRecepcion, filas: FilaRecepcion[]) {
  const doc = crearPdfRecepciones(consulta, filas);
  await doc.save(`Recepcion_mercancias_${consulta.nivel}_${consulta.fechaInicial}_${consulta.fechaFinal}.pdf`, { returnPromise: true });
}
