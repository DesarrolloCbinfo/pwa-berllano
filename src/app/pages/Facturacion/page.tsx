import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Card, CardContent, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Menu, IconButton, ListItemIcon
} from '@mui/material';
import {
  Receipt, Description, PictureAsPdf, Email, Send, Cancel,
  CheckCircle, RadioButtonUnchecked, Search, NavigateBefore, NavigateNext, Visibility, Download, MoreVert, People, Edit, Delete
} from '@mui/icons-material';
import type { IClienteFiscal } from './interfaces/IFactura';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import useConsumoApiFacturacion from '../../../hooks/useConsumoApiFacturacion';
import useConsumoApi from '../../../hooks/useConsumoApi';
import useSession from '../../../hooks/useSession';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import autoTable from 'jspdf-autotable';
import logoImage from '../../../assets/imgs/berllanoLogo.png';

const REGIMEN_FISCAL_DESCRIPTIONS: Record<string, string> = {
  '601': 'General de Ley Personas Morales',
  '603': 'Personas Morales con Fines no Lucrativos',
  '605': 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
  '606': 'Arrendamiento',
  '607': 'Régimen de Enajenación o Adquisición de Bienes',
  '608': 'Demás ingresos',
  '609': 'Consolidación',
  '610': 'Residentes en el Extranjero sin Establecimiento Permanente en México',
  '611': 'Ingresos por Dividendos (socios y accionistas)',
  '612': 'Personas Físicas con Actividades Empresariales y Profesionales',
  '614': 'Ingresos por intereses',
  '615': 'Régimen de los ingresos por obtención de premios',
  '616': 'Sin obligaciones fiscales',
  '620': 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
  '621': 'Incorporación Fiscal',
  '622': 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
  '623': 'Opcional para Grupos de Sociedades',
  '624': 'Coordinados',
  '625': 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
  '626': 'Régimen Simplificado de Confianza',
};

const TIPO_RELACION_OPTIONS = [
  { clave: '', descripcion: 'Sin relación' },
  { clave: '01', descripcion: 'Nota de crédito de los documentos relacionados' },
  { clave: '02', descripcion: 'Nota de débito de los documentos relacionados' },
  { clave: '03', descripcion: 'Devolución de mercancía sobre facturas o traslados previos' },
  { clave: '04', descripcion: 'Sustitución de los CFDI previos' },
  { clave: '05', descripcion: 'Traslados de mercancias facturados previamente' },
  { clave: '06', descripcion: 'Factura generada por los traslados previos' },
  { clave: '07', descripcion: 'CFDI por aplicación de anticipo' },
];

const PERIODICIDAD_DESC: Record<string, string> = {
  '01': 'Diaria', '02': 'Semanal', '03': 'Quincenal',
  '04': 'Mensual', '05': 'Bimestral',
};

const MES_DESC: Record<string, string> = {
  '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
  '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
  '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

function getRegimenFiscalDesc(code: string): string {
  return `${code} - ${REGIMEN_FISCAL_DESCRIPTIONS[code] || 'Descripción no disponible'}`;
}

function convertirCifraALetra(cifra: number): string {
  const cifras = ['Cero', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'];
  const decenas = ['', 'Diez', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'];
  const especiales = ['Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve'];
  const centenas = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos'];

  function convertirTresCifras(numero: number): string {
    const centena = Math.floor(numero / 100);
    const decena = Math.floor((numero % 100) / 10);
    const unidad = numero % 10;
    let resultado = '';
    if (centena > 0) {
      resultado += centena === 1 && decena === 0 && unidad === 0 ? 'Cien' : centenas[centena];
      resultado += ' ';
    }
    if (decena > 1) {
      resultado += decenas[decena];
      if (unidad > 0) resultado += ' y ' + cifras[unidad];
    } else if (decena === 1) {
      resultado += unidad === 0 ? decenas[decena] : especiales[unidad - 1];
    } else {
      if (unidad > 0) resultado += cifras[unidad];
    }
    return resultado.trim();
  }

  const entero = Math.floor(cifra);
  const centavos = Math.round((cifra - entero) * 100);
  if (entero === 0) {
    return 'Cero Pesos' + (centavos > 0 ? ' con ' + (centavos < 10 ? '0' + centavos : centavos) + '/100 M.N.' : '');
  }

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const unidades = entero % 1000;
  let literal = '';
  if (millones > 0) literal += millones === 1 ? 'Un Millón' : convertirTresCifras(millones) + ' Millones';
  if (miles > 0) {
    if (millones > 0) literal += ', ';
    literal += convertirTresCifras(miles) + ' Mil';
  }
  if (unidades > 0) {
    if (millones > 0 || miles > 0) literal += ' ';
    literal += convertirTresCifras(unidades);
  }
  literal += ' Pesos';
  if (centavos > 0) literal += ' con ' + (centavos < 10 ? '0' + centavos : centavos) + '/100 M.N.';
  return literal.trim();
}

async function generatePdfBlob(xmlContent: string): Promise<Blob> {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

  const comprobante = xmlDoc.getElementsByTagName('cfdi:Comprobante')[0] || xmlDoc.getElementsByTagName('Comprobante')[0];
  const emisor = xmlDoc.getElementsByTagName('cfdi:Emisor')[0] || xmlDoc.getElementsByTagName('Emisor')[0];
  const receptor = xmlDoc.getElementsByTagName('cfdi:Receptor')[0] || xmlDoc.getElementsByTagName('Receptor')[0];
  const timbre = xmlDoc.getElementsByTagName('tfd:TimbreFiscalDigital')[0] || xmlDoc.getElementsByTagName('TimbreFiscalDigital')[0];
  if (!timbre || !comprobante || !emisor || !receptor) throw new Error('XML inválido: faltan nodos requeridos');

  const serie = comprobante.getAttribute('Serie') || '';
  const folio = comprobante.getAttribute('Folio') || '';
  const uuid = timbre.getAttribute('UUID') || '';
  const fechaTimbrado = timbre.getAttribute('FechaTimbrado') || '';
  const rfcProvCertif = timbre.getAttribute('RfcProvCertif') || '';
  const selloCFD = timbre.getAttribute('SelloCFD') || '';
  const selloSAT = timbre.getAttribute('SelloSAT') || '';
  const noCertificadoSAT = timbre.getAttribute('NoCertificadoSAT') || '';
  const version = timbre.getAttribute('Version') || '';
  const rfcEmisor = emisor.getAttribute('Rfc') || '';
  const rfcReceptor = receptor.getAttribute('Rfc') || '';
  const total = parseFloat(comprobante.getAttribute('Total') || '0').toFixed(6);
  const selloCFDLast8 = selloCFD ? selloCFD.slice(-8) : (selloSAT ? selloSAT.slice(-8) : 'XXXXXXXX');

  const urlQR = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${uuid}&re=${rfcEmisor}&rr=${rfcReceptor}&tt=${total}&fe=${selloCFDLast8}`;
  const qrDataUrl = await QRCode.toDataURL(urlQR, { width: 256, height: 256 });

  const regimenFiscalEmisor = emisor.getAttribute('RegimenFiscal') || '';
  const regimenFiscalReceptor = receptor.getAttribute('RegimenFiscalReceptor') || '';
  const totalLetra = convertirCifraALetra(parseFloat(comprobante.getAttribute('Total') || '0'));
  const subtotal = comprobante.getAttribute('SubTotal') || '0';
  const iva = (parseFloat(comprobante.getAttribute('Total') || '0') - parseFloat(subtotal));

  const conceptos = xmlDoc.getElementsByTagName('cfdi:Concepto');
  const formaPago = comprobante.getAttribute('FormaPago') || '';
  const metodoPago = comprobante.getAttribute('MetodoPago') || '';

  const infoGlobal = comprobante.getElementsByTagName('cfdi:InformacionGlobal')[0];
  const infoGlobalHtml = infoGlobal ? `
    <div style="margin-top:10px;">
      <h3 style="font-size:11px; margin:0;"><strong>Información Global</strong></h3>
      <p style="font-size:10px; margin:3px 0;">
        <strong>Periodicidad:</strong> ${PERIODICIDAD_DESC[infoGlobal.getAttribute('Periodicidad') || ''] || infoGlobal.getAttribute('Periodicidad')},
        <strong>Mes:</strong> ${MES_DESC[infoGlobal.getAttribute('Meses') || ''] || infoGlobal.getAttribute('Meses')},
        <strong>Año:</strong> ${infoGlobal.getAttribute('Año')}
      </p>
    </div>` : '';

  async function htmlToImage(html: string, width = 794): Promise<string> {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.top = '0';
    div.style.width = width + 'px';
    div.innerHTML = html;
    document.body.appendChild(div);
    try {
      const canvas = await html2canvas(div, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      return canvas.toDataURL('image/png');
    } finally {
      document.body.removeChild(div);
    }
  }

  const headerHtml = `
    <div style="font-family:helvetica,sans-serif;font-size:16px;padding:10px;color:black;background:white;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div style="flex:0 0 auto;">
          <img src="${logoImage}" alt="Logo" style="height:55px;">
          <p style="font-size:12px;margin:2px 0;">CFDI: ${serie}${folio}</p>
        </div>
        <div style="flex:1;text-align:center;padding:0 15px;">
          <p style="font-size:20px;font-weight:bold;margin:0;">LLANOBER</p>
          <p style="font-size:16px;margin:2px 0;">RFC: ${rfcEmisor}</p>
          <p style="font-size:14px;margin:2px 0;">${getRegimenFiscalDesc(regimenFiscalEmisor)}</p>
        </div>
        <div style="flex:0 0 auto;text-align:right;position:relative;">
          <span style="position:absolute;top:-8px;right:-8px;font-size:13px;color:#880000;font-weight:bold;">V. 4.0</span>
          <p style="font-size:16px;margin:2px 0;"><strong>Fecha:</strong> ${comprobante.getAttribute('Fecha')}</p>
          <p style="font-size:16px;margin:2px 0;"><strong>Serie:</strong> ${serie}</p>
          <p style="font-size:16px;margin:2px 0;"><strong>Folio:</strong> ${folio}</p>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #ccc;margin:5px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
        <p style="font-size:16px;margin:0;"><strong>Lugar de expedición:</strong> ${comprobante.getAttribute('LugarExpedicion')}</p>
        <p style="font-size:16px;margin:0;"><strong>Tipo de Comprobante:</strong> ${comprobante.getAttribute('TipoDeComprobante')}</p>
      </div>
      <div style="background-color:#f5f5f5;padding:8px;border-radius:3px;margin:5px 0;">
        <div style="display:flex;align-items:center;margin-bottom:5px;">
          <p style="flex:0 1 auto;margin:0;font-size:18px;font-weight:bold;">Cliente</p>
          <hr style="flex:1;margin:0 0 0 10px;border:none;border-top:1px solid #ccc;">
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;">
          <p style="font-size:14px;margin:2px 0;"><strong>Nombre:</strong> ${receptor.getAttribute('Nombre')}</p>
          <p style="font-size:14px;margin:2px 0;"><strong>RFC:</strong> ${rfcReceptor}</p>
          <p style="font-size:14px;margin:2px 0;"><strong>Uso CFDI:</strong> ${receptor.getAttribute('UsoCFDI')}</p>
          <p style="font-size:14px;margin:2px 0;"><strong>Régimen Fiscal:</strong> ${getRegimenFiscalDesc(regimenFiscalReceptor)}</p>
          <p style="font-size:14px;margin:2px 0;"><strong>Método de pago:</strong> ${metodoPago}</p>
          <p style="font-size:14px;margin:2px 0;"><strong>Forma de Pago:</strong> ${formaPago}</p>
        </div>
      </div>
    </div>`;

  const headerImg = await htmlToImage(headerHtml);

  const pdf = new jsPDF('p', 'mm', 'letter');
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 8;
  const contentWidth = pageWidth - marginX * 2;

  const imgProps = pdf.getImageProperties(headerImg);
  const headerH = (imgProps.height * contentWidth) / imgProps.width;
  pdf.addImage(headerImg, 'PNG', marginX, 5, contentWidth, headerH);

  const tableRows: any[][] = [];
  for (let i = 0; i < conceptos.length; i++) {
    const c = conceptos[i];
    const impuestos = c.getElementsByTagName('cfdi:Traslado')[0] || c.getElementsByTagName('Traslado')[0];
    const tasaIVA = impuestos ? impuestos.getAttribute('TasaOCuota') || impuestos.getAttribute('tasaocuota') || '0.16' : '0.16';
    const importeConIva = parseFloat(c.getAttribute('Importe') || '0');
    const impuestoIva = Math.round(importeConIva - (importeConIva / (1 + parseFloat(tasaIVA)))) / 100;
    const subText = `${c.getAttribute('ClaveUnidad')}\n${c.getAttribute('ClaveProdServ')}\nIVA ${formatCurrency(impuestoIva)}\n0.00  ${tasaIVA}`;
    tableRows.push([
      c.getAttribute('Cantidad'),
      c.getAttribute('Descripcion'),
      subText,
      tasaIVA,
      formatCurrency(importeConIva),
      formatCurrency(parseFloat(c.getAttribute('ValorUnitario') || '0')),
    ]);
  }

  let pageNum = 1;
  const totalPages = { current: 1 };

  autoTable(pdf, {
    startY: headerH + 5,
    head: [['Cant.', 'Descripción', 'Claves', 'T.F.', 'Importe', 'P. Unit.']],
    body: tableRows,
    theme: 'grid',
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 7, cellPadding: 0.6, lineWidth: 0.1, lineColor: [180, 180, 180], textColor: [0, 0, 0] },
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'left', cellWidth: 40, fontSize: 6.5, textColor: [136, 136, 136], cellPadding: { top: 0, right: 1, bottom: 0.5, left: 1 } },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 24 },
    },
    didDrawPage: () => {
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(`Página ${pageNum++}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    },
  });

  totalPages.current = pageNum - 1;

  const footerHtml = `
    <div style="font-family:helvetica,sans-serif;font-size:14px;padding:10px;color:black;background:white;width:794px;">
      <div style="display:flex;justify-content:space-between;">
        <div style="flex:1;padding-right:15px;">
          <p style="font-size:14px;margin:2px 0;"><strong>Cantidad con letra:</strong></p>
          <p style="font-size:14px;margin:2px 0;font-style:italic;">${totalLetra}</p>
          <div style="margin:8px 0;">
            <p style="font-size:14px;margin:2px 0;"><strong>Serie:</strong> ${serie} <strong>Folio:</strong> ${folio}</p>
            <p style="font-size:14px;margin:2px 0;"><strong>Folio Fiscal:</strong> ${uuid}</p>
            <p style="font-size:14px;margin:2px 0;"><strong>Fecha de Certificación:</strong> ${fechaTimbrado}</p>
            <p style="font-size:14px;margin:2px 0;"><strong>Num. de serie del certificado del SAT:</strong> ${noCertificadoSAT}</p>
          </div>
          ${infoGlobalHtml}
          <p style="font-size:14px;margin:2px 0;"><strong>Forma de Pago:</strong> ${formaPago}</p>
          <p style="font-size:14px;margin:2px 0;"><strong>Fecha de Pago:</strong> </p>
        </div>
        <div style="flex:0 0 auto;min-width:170px;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
            <tr style="background-color:#f5f5f5;">
              <td style="text-align:left;padding:4px;font-size:14px;font-weight:bold;border-bottom:1px solid #ddd;">SUBTOTAL:</td>
              <td style="text-align:right;padding:4px;font-size:14px;border-bottom:1px solid #ddd;">${formatCurrency(parseFloat(subtotal))}</td>
            </tr>
            <tr>
              <td style="text-align:left;padding:4px;font-size:14px;font-weight:bold;border-bottom:1px solid #ddd;">IVA:</td>
              <td style="text-align:right;padding:4px;font-size:14px;border-bottom:1px solid #ddd;">${formatCurrency(iva)}</td>
            </tr>
            <tr style="background-color:#f5f5f5;">
              <td style="text-align:left;padding:4px;font-size:14px;font-weight:bold;">Total:</td>
              <td style="text-align:right;padding:4px;font-size:14px;font-weight:bold;">${formatCurrency(parseFloat(total))}</td>
            </tr>
          </table>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:15px;border-top:1px solid #ccc;padding-top:10px;">
        <div style="font-size:10px;color:#666;flex:1;">
          <p style="margin:0;"><strong>Cadena original del complemento de certificación digital del SAT:</strong></p>
          <p style="margin:2px 0;word-break:break-all;">||${version}|${uuid}|${fechaTimbrado}|${rfcProvCertif}|${selloCFD}|${noCertificadoSAT}|${selloSAT}||</p>
          <p style="margin:8px 0 0 0;"><strong>Sello digital del CFDI:</strong></p>
          <p style="margin:2px 0;word-break:break-all;font-size:9px;">${selloCFD}</p>
          <p style="margin:8px 0 0 0;"><strong>Sello digital del SAT:</strong></p>
          <p style="margin:2px 0;word-break:break-all;font-size:9px;">${selloSAT}</p>
        </div>
        <div style="flex:0 0 auto;text-align:center;padding-left:20px;">
          <img src="${qrDataUrl}" alt="QR" style="width:120px;height:120px;">
          <p style="font-size:10px;margin:2px 0;">Este documento es una representación impresa de un CFDI</p>
        </div>
      </div>
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid #ccc;font-size:12px;color:#444;">
        <p style="margin:2px 0;text-align:center;">Si tiene alguna duda con su factura envíe un correo a berllanofacturacion2019@gmail.com o llame al tel. 01.22.88.12.19.89</p>
        <p style="margin:2px 0;text-align:center;">La posesión de este documento no implica su liquidación</p>
        <p style="margin:2px 0;text-align:center;">Operador : ADMIN - Administrador SISTEMAS v1</p>
      </div>
      <div style="margin-top:12px;font-size:11px;color:#444;display:flex;justify-content:space-between;">
        <span>Fecha de impresión ${new Date().toLocaleString('es-MX')}</span>
      </div>
    </div>`;

  // Page numbering tracking
  let pageCounter = 0;

  (pdf as any).internal.events.subscribe('addPage', () => { pageCounter++; });

  const finalTableY = (pdf as any).lastAutoTable?.finalY || 200;
  const footerImg = await htmlToImage(footerHtml);
  const footerProps = pdf.getImageProperties(footerImg);
  const footerH = (footerProps.height * contentWidth) / footerProps.width;

  if (finalTableY + footerH + 5 > pageHeight) {
    pdf.addPage();
    pdf.addImage(footerImg, 'PNG', marginX, 10, contentWidth, footerH);
  } else {
    pdf.addImage(footerImg, 'PNG', marginX, finalTableY + 5, contentWidth, footerH);
  }

  const totalP = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalP; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text(`Página ${i} de ${totalP}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  return pdf.output('blob');
}

async function sendFacturaEmail(xmlContent: string, recipientEmail: string, serie: string, folio: string): Promise<boolean> {
  try {
    const pdfBlob = await generatePdfBlob(xmlContent);
    if (!pdfBlob || pdfBlob.size === 0) throw new Error('El PDF no se generó correctamente.');

    const pdfBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    const xmlBase64 = btoa(unescape(encodeURIComponent(xmlContent)));

    const emailData = {
      to: `${recipientEmail}, soporte@cbinformatica.net`,
      subject: 'FACTURA ELECTRONICA BERLLANO',
      body: 'Adjunto encontrará su factura.',
      attachmentPath: '',
      Attachments: [
        { FileName: `${serie}-${folio}.pdf`, FileContent: pdfBase64, MimeType: 'application/pdf' },
        { FileName: `${serie}-${folio}.xml`, FileContent: xmlBase64, MimeType: 'application/xml' },
      ],
    };

    const response = await fetch('https://api.cbinformatica.net:9004/api/Email/send-soporte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) throw new Error(await response.text());
    return true;
  } catch (err: any) {
    throw new Error(err.message || 'Error al enviar el email');
  }
}

export default function FacturacionPage() {
  const session = useSession();
  const { consumoApi: apiFacturacion } = useConsumoApiFacturacion();
  const { consumoApi } = useConsumoApi();

  const [tabValue, setTabValue] = useState(0);

  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const [ventas, setVentas] = useState<any[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [selectedTotal, setSelectedTotal] = useState(0);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  const [modalCFDI, setModalCFDI] = useState(false);
  const [usoCfdiOptions, setUsoCfdiOptions] = useState<any[]>([]);
  const [formaPagoOptions, setFormaPagoOptions] = useState<any[]>([]);
  const [metodoPagoOptions, setMetodoPagoOptions] = useState<any[]>([]);
  const [formData, setFormData] = useState({ usoCfdi: '', formaPago: '', metodoPago: '', uuid: '', tipoRelacion: '' });
  const [selectedName, setSelectedName] = useState('');
  const [selectedIdC, setSelectedIdC] = useState('');

  const [modalCliente, setModalCliente] = useState(false);
  const [clientesFiscales, setClientesFiscales] = useState<IClienteFiscal[]>([]);
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [clientePageNumber, setClientePageNumber] = useState(1);
  const [clienteTotalRecords, setClienteTotalRecords] = useState(0);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const clientePageSize = 10;
  const [clienteSeleccionado, setClienteSeleccionado] = useState<IClienteFiscal | null>(null);

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [modalPreview, setModalPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingFacturar, setLoadingFacturar] = useState(false);

  const [facturas, setFacturas] = useState<any[]>([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);

  const [modalCancelarSAT, setModalCancelarSAT] = useState(false);
  const [facturaACancelar, setFacturaACancelar] = useState<any>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('02');
  const [uuidSustituto, setUuidSustituto] = useState('');
  const [cancelandoSAT, setCancelandoSAT] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement | null; factura: any | null }>({ el: null, factura: null });

  const [modalPdfPreview, setModalPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [loadingPdfPreview, setLoadingPdfPreview] = useState(false);

  const [loadingClientesFiscales, setLoadingClientesFiscales] = useState(false);
  const [modalClienteFiscal, setModalClienteFiscal] = useState(false);
  const [editandoClienteFiscal, setEditandoClienteFiscal] = useState(false);
  const [clienteFiscalForm, setClienteFiscalForm] = useState<IClienteFiscal>({ id: 0, rfc: '', nombreFiscal: '', cpFiscal: '', regimenFiscal: '', usoCFDI: '', correoFiscal: '' });

  const fetchedUuidKey = useRef('');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [uso, forma, metodo] = await Promise.all([
          apiFacturacion.get('ObtenerUsoCfdi?id=0'),
          apiFacturacion.get('ObtenerFormaPago?id=0'),
          apiFacturacion.get('ObtenerMetodoPago?id=0'),
        ]);
        setUsoCfdiOptions(uso.data);
        setFormaPagoOptions(forma.data);
        setMetodoPagoOptions(metodo.data);
      } catch (err) {
        console.error('Error fetching options:', err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const suc = session?.sucursal ?? 0;
    const cli = Number(selectedIdC ?? 0);
    if (!suc || !cli) return;

    const key = `${suc}_${cli}`;
    if (fetchedUuidKey.current === key) return;

    let cancelled = false;
    apiFacturacion.get('ObtenerUUIDs', { params: { sucursal: suc, cliente: cli } }).then(res => {
      if (cancelled) return;
      setFormData(prev => ({ ...prev, uuid: '' }));
      const arr = Array.isArray(res.data) ? res.data : [];
      const unique = arr.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uuid === v.uuid) === i);
      unique.sort((a: any, b: any) => (a.folio ?? 0) - (b.folio ?? 0));
      setUuidOptions(unique);
      fetchedUuidKey.current = key;
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [session?.sucursal, selectedIdC]);

  const [uuidOptions, setUuidOptions] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!fechaInicio || !fechaFin) {
      setError('Ingresa ambas fechas.');
      return;
    }
    setLoadingVentas(true);
    setError(null);
    try {
      Swal.fire({ title: 'Consultando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await apiFacturacion.get('ObtenerVentasNoTimbradas2', {
        params: { sucursal: session?.sucursal ?? 0, caja: 1, fecha1: fechaInicio, fecha2: fechaFin },
      });
      Swal.close();
      if (res.data && res.data.length > 0) {
        setVentas(res.data);
        setRowSelection({});
        setSelectedRows([]);
        setSelectedTotal(0);
      } else {
        setVentas([]);
        Swal.fire({ icon: 'info', title: 'Sin resultados', text: 'No se encontraron ventas en ese rango.' });
      }
    } catch (err: any) {
      Swal.close();
      setError(err.message || 'Error al consultar');
    } finally {
      setLoadingVentas(false);
    }
  };

  const handleRowSelectionChange = (updater: any) => {
    const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
    setRowSelection(newSelection);
    const selected = ventas.filter((row: any) => newSelection[row.noVenta?.toString()]);
    setSelectedRows(selected.map((row: any) => ({ original: row })));
    setSelectedTotal(selected.reduce((sum: number, row: any) => sum + Number(row.importe || 0), 0));
  };

  const handleFacturar = (row?: any, isMultiple = false) => {
    if (isMultiple && selectedRows.length > 0) {
      const uniqueClients = new Set(selectedRows.map((r: any) => r.original.id_cliente_venta));
      if (uniqueClients.size > 1) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Todas las ventas deben ser del mismo cliente.' });
        return;
      }
      const first = selectedRows[0];
      setSelectedIdC(String(first.original.id_cliente_venta));
      setSelectedName(String(first.original.nombre));
      setSelectedRow(null);
    } else if (row) {
      setSelectedRow(row);
      setSelectedIdC(String(row.original.id_cliente_venta ?? ''));
      setSelectedName(String(row.original.nombre ?? ''));
    }
    setModalCFDI(true);
  };

  const handleTimbrarFactura = async () => {
    if (!selectedRow && selectedRows.length === 0) {
      setError('Selecciona una o más ventas.');
      return;
    }
    setLoadingFacturar(true);
    const isMultiple = selectedRows.length > 0;
    const params: any = {
      noVenta: isMultiple ? selectedRows.map((r: any) => r.original.noVenta).join(',') : selectedRow.original.noVenta,
      sucursal: isMultiple ? selectedRows[0].original.sucursal : selectedRow.original.sucursal,
      caja: isMultiple ? selectedRows[0].original.caja : selectedRow.original.caja,
      formaPago: formData.formaPago,
      tipoComprobante: 'I',
      metodoPago: formData.metodoPago,
      usoCfdi: formData.usoCfdi,
      idCliente: selectedIdC,
      uuid: formData.uuid,
      tipoRelacion: formData.tipoRelacion,
    };

    Swal.fire({ title: 'Facturando...', text: 'Este proceso puede tomar unos momentos.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const endpoint = isMultiple ? 'get_data_cfd19_multiple' : 'GenerarFactura2';
      const res = await apiFacturacion.get(endpoint, { params });
      Swal.close();

      if (res.status === 200) {
        const xmlData = res.data;
        const headers = res.headers;
        const uuid = headers['uuid'] || '';
        const folio = `${headers['serie'] || ''}-${headers['folio'] || ''}`;
        const mensaje = headers['mensaje'] || '';

        Swal.fire({
          title: 'Factura generada',
          html: `<div style="text-align:left;"><b>UUID:</b> ${uuid}<br><b>Folio:</b> ${folio}<br><b>Mensaje:</b> ${mensaje}</div>`,
          icon: 'success',
          confirmButtonText: 'Aceptar',
          showCancelButton: true,
          cancelButtonText: 'Cerrar',
          didOpen: () => {
            const container = document.getElementById('swal2-html-container');
            if (container) {
              const btnRow = document.createElement('div');
              btnRow.style.display = 'flex';
              btnRow.style.gap = '8px';
              btnRow.style.marginTop = '12px';

              const xmlBtn = document.createElement('button');
              xmlBtn.innerText = 'XML';
              xmlBtn.className = 'swal2-confirm swal2-styled';
              xmlBtn.style.flex = '1';
              xmlBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = `data:application/xml;charset=utf-8,${encodeURIComponent(xmlData)}`;
                link.download = `${folio}.xml`;
                link.click();
              };
              btnRow.appendChild(xmlBtn);

              const pdfBtn = document.createElement('button');
              pdfBtn.innerText = 'PDF';
              pdfBtn.className = 'swal2-confirm swal2-styled';
              pdfBtn.style.flex = '1';
              pdfBtn.onclick = async () => {
                const blob = await generatePdfBlob(xmlData);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${folio}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              };
              btnRow.appendChild(pdfBtn);

              const emailBtn = document.createElement('button');
              emailBtn.innerText = 'Email';
              emailBtn.className = 'swal2-confirm swal2-styled';
              emailBtn.style.flex = '1';
              emailBtn.onclick = () => {
                Swal.fire({
                  title: 'Enviar por correo',
                  input: 'email',
                  inputLabel: 'Ingresa el correo del destinatario',
                  showCancelButton: true,
                  inputValidator: (v) => !v ? 'Ingresa un correo' : null,
                }).then(async (result) => {
                  if (result.isConfirmed && result.value) {
                    try {
                      await sendFacturaEmail(xmlData, result.value, headers['serie'] || '', headers['folio'] || '');
                      Swal.fire('Enviado', 'Correo enviado exitosamente.', 'success');
                    } catch (e: any) {
                      Swal.fire('Error', e.message, 'error');
                    }
                  }
                });
              };
              btnRow.appendChild(emailBtn);

              container.appendChild(btnRow);
            }
          },
        });

        if (isMultiple) {
          const ids = selectedRows.map((r: any) => r.original.noVenta);
          setVentas(prev => prev.filter((item: any) => !ids.includes(item.noVenta)));
          setSelectedRows([]);
          setRowSelection({});
        } else {
          setVentas(prev => prev.filter((item: any) => item.noVenta !== selectedRow.original.noVenta));
        }
        setModalCFDI(false);
        resetForm();
      } else {
        setError('Error al generar la factura.');
      }
    } catch (err: any) {
      Swal.close();
      setModalCFDI(false);
      const errMsg = err.response?.data?.errMsg || err.response?.data?.message || err.message || 'Error de conexión';
      Swal.fire({ icon: 'error', title: 'Error', text: errMsg });
    } finally {
      setLoadingFacturar(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedRow && selectedRows.length === 0) return;
    setLoadingPreview(true);
    const isMultiple = selectedRows.length > 0;
    const params: any = {
      noVenta: isMultiple ? selectedRows.map((r: any) => r.original.noVenta).join(',') : selectedRow.original.noVenta,
      sucursal: isMultiple ? selectedRows[0].original.sucursal : selectedRow.original.sucursal,
      caja: isMultiple ? selectedRows[0].original.caja : selectedRow.original.caja,
      formaPago: formData.formaPago,
      tipoComprobante: 'I',
      metodoPago: formData.metodoPago,
      usoCfdi: formData.usoCfdi,
      idCliente: selectedIdC,
      uuid: formData.uuid,
      tipoRelacion: formData.tipoRelacion,
    };
    try {
      const endpoint = isMultiple ? 'get_data_cfd19_preview_multiple' : 'GenerarFacturaPreview';
      const res = await apiFacturacion.get(endpoint, { params });
      setPreviewData(res.data ?? []);
      setModalPreview(true);
    } catch {
      setModalCFDI(false);
      Swal.fire('Error', 'No se pudo obtener la vista previa.', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const resetForm = () => {
    setFormData({ usoCfdi: '', formaPago: '', metodoPago: '', uuid: '', tipoRelacion: '' });
    setSelectedName('');
    setSelectedIdC('');
    setSelectedRow(null);
    setClienteSeleccionado(null);
  };

  const getDesc = (options: any[], clave: string) => options.find(o => o.clave === clave)?.descripcion || clave;

  const handleModalSelectCliente = (cliente: IClienteFiscal) => {
    setSelectedIdC(String(cliente.id));
    setSelectedName(cliente.nombreFiscal);
    setClienteSeleccionado(cliente);
    setFormData(p => ({ ...p, usoCfdi: cliente.usoCFDI }));
    setModalCliente(false);
  };

  const fetchClientesFiscales = async (searchTerm: string, pageNumber: number) => {
    setLoadingClientes(true);
    try {
      const res = await apiFacturacion.get('clientes-fiscales', {
        params: { pageNumber, pageSize: clientePageSize, searchTerm },
      });
      const data = res.data;
      setClientesFiscales(data.clientes || []);
      setClienteTotalRecords(data.totalRecords || 0);
      setClientePageNumber(data.pageNumber || pageNumber);
    } catch {
      setClientesFiscales([]);
      setClienteTotalRecords(0);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleOpenModalCliente = () => {
    setModalCliente(true);
    setClienteSearchTerm('');
    fetchClientesFiscales('', 1);
  };

  const handleClienteSearchChange = (term: string) => {
    setClienteSearchTerm(term);
    fetchClientesFiscales(term, 1);
  };

  const fetchFacturas = useCallback(async () => {
    setLoadingFacturas(true);
    try {
      const res = await apiFacturacion.get('ObtenerVentasTimbradas2', {
        params: { sucursal: session?.sucursal ?? 0, caja: 1, fecha1: '2022-01-01', fecha2: '2027-03-21' },
      });
      setFacturas(Array.isArray(res.data) ? res.data : []);
    } catch {
      setFacturas([]);
    } finally {
      setLoadingFacturas(false);
    }
  }, [session?.sucursal]);

  useEffect(() => {
    if (tabValue === 1) fetchFacturas();
  }, [tabValue, fetchFacturas]);

  const downloadXML = (xml: string, fileName: string) => {
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async (factura: any) => {
    const { value: email } = await Swal.fire({
      title: 'Enviar por correo',
      input: 'email',
      inputLabel: 'Ingresa el correo',
      showCancelButton: true,
      inputValidator: (v) => !v ? 'Ingresa un correo' : null,
    });
    if (!email) return;
    try {
      await sendFacturaEmail(factura.xml, email, factura.serie, String(factura.folio));
      Swal.fire('Enviado', 'Correo enviado exitosamente.', 'success');
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handlePdfPreview = async (factura: any) => {
    setLoadingPdfPreview(true);
    setModalPdfPreview(true);
    try {
      const blob = await generatePdfBlob(factura.xml);
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch {
      setModalPdfPreview(false);
      Swal.fire('Error', 'No se pudo generar la vista previa del PDF.', 'error');
    } finally {
      setLoadingPdfPreview(false);
    }
  };

  const handlePdfDownload = async (factura: any) => {
    const blob = await generatePdfBlob(factura.xml);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${factura.serie}-${factura.folio}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cancelaFacturaSistema = async (factura: any) => {
    const { value: motivo } = await Swal.fire({
      title: 'Cancelar factura en sistema',
      input: 'text',
      inputLabel: 'Motivo de cancelación',
      showCancelButton: true,
      inputValidator: (v) => !v ? 'Escribe un motivo' : null,
    });
    if (!motivo) return;
    try {
      const res = await apiFacturacion.post('CancelarFacturaSistema', null, {
        params: { serie: factura.serie, folio: factura.folio, usuario: session?.id ?? 0, motivo_cancelacion: motivo },
      });
      Swal.fire('Cancelado', res.data?.msg || res.data?.message || 'Cancelación exitosa', 'success');
      fetchFacturas();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Error al cancelar', 'error');
    }
  };

  const abrirCancelarSAT = (factura: any) => {
    setFacturaACancelar(factura);
    setModalCancelarSAT(true);
  };

  const ejecutarCancelacionSAT = async () => {
    if (!facturaACancelar) return;
    setCancelandoSAT(true);
    try {
      const res = await fetch('https://api.cbinformatica.net:9004/api/cancelacion/berllano/cfdi', {
        method: 'POST',
        headers: { 'Accept': '*/*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serie: facturaACancelar.serie,
          folio: facturaACancelar.folio,
          motivo: motivoCancelacion,
          uuidSustituto: motivoCancelacion === '01' ? uuidSustituto : '',
          acuseSI: true,
          emailEmisor: '',
          emailReceptor: '',
          prueba: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Cancelado en SAT', data.acuse || 'Cancelación exitosa', 'success');
      } else {
        Swal.fire('Error SAT', data.error || 'Error en cancelación', 'error');
      }
      setModalCancelarSAT(false);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setCancelandoSAT(false);
    }
  };

  const handleEnableInvoice = async (invoice: any) => {
    try {
      const res = await fetch(`https://api.cbinformatica.net:9004/api/ROGARAdmin/HabilitaFactura?idCfdVenta=${invoice.id}`, {
        method: 'POST',
        headers: { 'Accept': '*/*', 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.codigo === 0) {
        setFacturas(prev => prev.map(f => f.id === invoice.id ? { ...f, habilitada: true } : f));
        Swal.fire('Habilitada', 'Factura habilitada correctamente.', 'success');
      } else {
        throw new Error(data.mensaje2 || 'Error al habilitar');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const fetchClientesFiscalesTab = async () => {
    setLoadingClientesFiscales(true);
    try {
      const res = await consumoApi.get('/api/RfcFiscales/sp_bw_cat_rfcFiscales_sel');
      setClientesFiscales(res.data || []);
    } catch {
      Swal.fire('Error', 'No se pudieron cargar los clientes fiscales', 'error');
    } finally {
      setLoadingClientesFiscales(false);
    }
  };

  const handleOpenClienteFiscal = (cliente?: IClienteFiscal) => {
    if (cliente) {
      setClienteFiscalForm({ ...cliente });
      setEditandoClienteFiscal(true);
    } else {
      setClienteFiscalForm({ id: 0, rfc: '', nombreFiscal: '', cpFiscal: '', regimenFiscal: '', usoCFDI: '', correoFiscal: '' });
      setEditandoClienteFiscal(false);
    }
    setModalClienteFiscal(true);
  };

  const handleSaveClienteFiscal = async () => {
    const { rfc, nombreFiscal, cpFiscal, regimenFiscal, usoCFDI, correoFiscal } = clienteFiscalForm;
    if (!rfc || !nombreFiscal || !regimenFiscal || !usoCFDI) {
      Swal.fire('Validación', 'RFC, Nombre Fiscal, Régimen Fiscal y Uso CFDI son obligatorios.', 'warning');
      return;
    }
    try {
      if (editandoClienteFiscal) {
        await consumoApi.put('/api/RfcFiscales/sp_bw_cat_rfcFiscales_upd', clienteFiscalForm);
      } else {
        await consumoApi.post('/api/RfcFiscales/sp_bw_cat_rfcFiscales_ins', { rfc, nombreFiscal, cpFiscal, regimenFiscal, usoCFDI, correoFiscal });
      }
      Swal.fire({ icon: 'success', title: editandoClienteFiscal ? 'Actualizado' : 'Creado', timer: 1500, showConfirmButton: false });
      setModalClienteFiscal(false);
      fetchClientesFiscalesTab();
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || err.message || 'Error al guardar', 'error');
    }
  };

  const handleDeleteClienteFiscal = async (id: number) => {
    const result = await Swal.fire({ title: '¿Eliminar?', text: 'Esta acción no se puede deshacer', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#d32f2f' });
    if (!result.isConfirmed) return;
    try {
      await consumoApi.delete(`/api/RfcFiscales/sp_bw_cat_rfcFiscales_del?id=${id}`);
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
      fetchClientesFiscalesTab();
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || err.message || 'Error al eliminar', 'error');
    }
  };

  const columnsVentas: MRT_ColumnDef<any>[] = [
    { accessorKey: 'fecha', header: 'Fecha', size: 90, Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString() },
    { accessorKey: 'dSucursal', header: 'Sucursal', size: 120 },
    { accessorKey: 'nombre', header: 'Cliente', size: 150 },
    { accessorKey: 'noVenta', header: 'No Venta', size: 90 },
    { accessorKey: 'caja', header: 'Caja', size: 60 },
    {
      accessorKey: 'importe', header: 'Importe', size: 100,
      Cell: ({ cell }) => formatCurrency(cell.getValue<number>()),
    },
    {
      id: 'acciones', header: 'Acciones', size: 100,
      Cell: ({ row }) => (
        <Button size="small" variant="contained" color="success" onClick={() => handleFacturar(row, false)}>Facturar</Button>
      ),
    },
    // {
    //   id: 'estado', header: 'Estado', size: 100,
    //   Cell: ({ row }) => row.original.habilitada
    //     ? <Chip icon={<CheckCircle />} label="Timbrada" color="success" size="small" variant="outlined" />
    //     : <Chip icon={<RadioButtonUnchecked />} label="Pendiente" size="small" variant="outlined" />,
    // },
  ];

  const columnsFacturas: MRT_ColumnDef<any>[] = [
    {
      id: 'acciones', header: 'Acciones', size: 170,
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <IconButton size="small" title="Vista previa PDF" onClick={() => handlePdfPreview(row.original)}>
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton size="small" title="Descargar XML" onClick={() => downloadXML(row.original.xml, `${row.original.serie}-${row.original.folio}`)}>
            <Description fontSize="small" />
          </IconButton>
          <IconButton size="small" title="Cancelar en SAT" onClick={() => abrirCancelarSAT(row.original)}>
            <Cancel fontSize="small" color="error" />
          </IconButton>
          <IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, factura: row.original })}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
    { accessorKey: 'dSucursal', header: 'Sucursal', size: 100 },
    { accessorKey: 'serie', header: 'Serie', size: 60 },
    { accessorKey: 'folio', header: 'Folio', size: 70 },
    { accessorKey: 'dCliente', header: 'Cliente', size: 120 },
    { accessorKey: 'importe', header: 'Importe', size: 100, Cell: ({ cell }) => formatCurrency(cell.getValue<number>()) },
    { accessorKey: 'uuid', header: 'UUID', size: 200 },
    { accessorKey: 'fechaCFDI', header: 'Fecha CFDI', size: 100, Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString() },
  ];

  const columnsClientesFiscales: MRT_ColumnDef<IClienteFiscal>[] = [
    {
      id: 'acciones', header: 'Acciones', size: 100,
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => handleOpenClienteFiscal(row.original)}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeleteClienteFiscal(row.original.id)}><Delete fontSize="small" /></IconButton>
        </Box>
      ),
    },
    { accessorKey: 'rfc', header: 'RFC', size: 140 },
    { accessorKey: 'nombreFiscal', header: 'Nombre Fiscal', size: 200 },
    { accessorKey: 'cpFiscal', header: 'CP', size: 80 },
    { accessorKey: 'regimenFiscal', header: 'Régimen Fiscal', size: 120 },
    { accessorKey: 'usoCFDI', header: 'Uso CFDI', size: 80 },
    { accessorKey: 'correoFiscal', header: 'Correo', size: 180 },
  ];

  useEffect(() => {
    if (tabValue === 2) fetchClientesFiscales();
  }, [tabValue]);

  return (
    <Box>
      {/* ─── Header ─── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Receipt sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Facturación Electrónica CFDI 4.0</Typography>
      </Box>

      {/* ─── Tabs ─── */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab icon={<Receipt />} iconPosition="start" label="Generar Factura" />
        <Tab icon={<Description />} iconPosition="start" label="Facturas Timbradas" />
        <Tab icon={<People />} iconPosition="start" label="Clientes Fiscales" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ═══════════ TAB 0: GENERAR FACTURA ═══════════ */}
      {tabValue === 0 && (
        <Box>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Consultar Ventas</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <TextField label="Fecha Inicio" type="date" size="small" value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 160 }} />
                <TextField label="Fecha Fin" type="date" size="small" value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 160 }} />
                <Button variant="contained" startIcon={<Search />} onClick={handleSearch} disabled={loadingVentas}
                  sx={{ py: 1 }}>Consultar</Button>
              </Box>
            </CardContent>
          </Card>

          {loadingVentas && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

          {!loadingVentas && ventas.length > 0 && (
            <>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant="contained" color="primary" onClick={() => handleFacturar(undefined, true)}
                  disabled={selectedRows.length === 0}>
                  Facturar Seleccionadas ({selectedRows.length})
                </Button>
                <Button variant="outlined" color="inherit" onClick={() => { setRowSelection({}); setSelectedRows([]); setSelectedTotal(0); }}
                  disabled={selectedRows.length === 0}>Limpiar</Button>
                {selectedRows.length > 0 && (
                  <Chip label={`Total seleccionado: ${formatCurrency(selectedTotal)}`} color="info" />
                )}
              </Box>

              <MaterialReactTable
                columns={columnsVentas}
                data={ventas}
                enableRowSelection
                onRowSelectionChange={handleRowSelectionChange}
                getRowId={(row) => row.noVenta?.toString() || Math.random().toString()}
                state={{ rowSelection }}
                initialState={{ density: 'compact' }}
                enableStickyHeader
              />
            </>
          )}

          {!loadingVentas && ventas.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Realiza una consulta para ver las ventas pendientes de facturar.
            </Typography>
          )}
        </Box>
      )}

      {/* ═══════════ TAB 1: FACTURAS TIMBRADAS ═══════════ */}
      {tabValue === 1 && (
        <Box>
          {loadingFacturas ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : facturas.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No hay facturas timbradas.</Typography>
          ) : (
            <MaterialReactTable
              columns={columnsFacturas}
              data={facturas}
              enableStickyHeader
              initialState={{ density: 'compact', sorting: [{ id: 'folio', desc: true }] }}
            />
          )}
        </Box>
      )}

      {/* ═══════════ TAB 2: CLIENTES FISCALES ═══════════ */}
      {tabValue === 2 && (
        <Box>
          <Button variant="contained" startIcon={<People />} onClick={() => handleOpenClienteFiscal()} sx={{ mb: 2 }}>
            Agregar Cliente Fiscal
          </Button>

          {loadingClientesFiscales ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : clientesFiscales.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No hay clientes fiscales registrados.</Typography>
          ) : (
            <MaterialReactTable
              columns={columnsClientesFiscales}
              data={clientesFiscales}
              enableStickyHeader
              initialState={{ density: 'compact' }}
            />
          )}
        </Box>
      )}

      {/* ═════ CFDI Configuration Modal ═════ */}
      <Dialog open={modalCFDI} onClose={() => { if (!loadingFacturar) { resetForm(); setModalCFDI(false); } }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRows.length > 0
            ? `Facturar múltiples ventas: ${selectedRows.map((r: any) => r.original.noVenta).join(', ')}`
            : `Facturar venta: ${selectedRow?.original?.noVenta}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
            <TextField size="small" label="Cliente" value={selectedName} fullWidth slotProps={{ input: { readOnly: true } }} />
            <Button variant="outlined" onClick={handleOpenModalCliente} sx={{ minWidth: 120 }}>Seleccionar</Button>
          </Box>

          {clienteSeleccionado && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Información Fiscal del Cliente</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Typography variant="body2"><strong>RFC:</strong> {clienteSeleccionado.rfc}</Typography>
                <Typography variant="body2"><strong>Régimen Fiscal:</strong> {getRegimenFiscalDesc(clienteSeleccionado.regimenFiscal)}</Typography>
                <Typography variant="body2"><strong>CP Fiscal:</strong> {clienteSeleccionado.cpFiscal}</Typography>
                <Typography variant="body2"><strong>Correo:</strong> {clienteSeleccionado.correoFiscal}</Typography>
              </Box>
            </Box>
          )}

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Uso de CFDI</InputLabel>
            <Select value={formData.usoCfdi} label="Uso de CFDI" onChange={e => setFormData(p => ({ ...p, usoCfdi: e.target.value }))}>
              {usoCfdiOptions.map(o => <MenuItem key={o.clave} value={o.clave}>{o.descripcion}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Forma de Pago</InputLabel>
            <Select value={formData.formaPago} label="Forma de Pago" onChange={e => setFormData(p => ({ ...p, formaPago: e.target.value }))}>
              {formaPagoOptions.map(o => <MenuItem key={o.clave} value={o.clave}>{o.descripcion}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Método de Pago</InputLabel>
            <Select value={formData.metodoPago} label="Método de Pago" onChange={e => setFormData(p => ({ ...p, metodoPago: e.target.value }))}>
              {metodoPagoOptions.map(o => <MenuItem key={o.clave} value={o.clave}>{o.descripcion}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>UUID Relacionado</InputLabel>
            <Select value={formData.uuid} label="UUID Relacionado" onChange={e => setFormData(p => ({ ...p, uuid: e.target.value }))}>
              <MenuItem value="">Sin relación</MenuItem>
              {uuidOptions.map((o: any) => (
                <MenuItem key={o.uuid} value={o.uuid}>{o.serie}-{o.folio} · {o.uuid}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Tipo de relación</InputLabel>
            <Select value={formData.tipoRelacion} label="Tipo de relación" onChange={e => setFormData(p => ({ ...p, tipoRelacion: e.target.value }))}>
              {TIPO_RELACION_OPTIONS.map(o => (
                <MenuItem key={o.clave} value={o.clave}>{o.clave ? `${o.clave} - ${o.descripcion}` : o.descripcion}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePreview} color="info" disabled={loadingPreview}>{loadingPreview ? 'Cargando...' : 'Vista previa'}</Button>
          <Button onClick={handleTimbrarFactura} variant="contained" color="success" disabled={loadingFacturar}>
            {loadingFacturar ? <CircularProgress size={20} /> : 'Facturar'}
          </Button>
          <Button onClick={() => { resetForm(); setModalCFDI(false); }} color="inherit" disabled={loadingFacturar}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* ═════ Cliente fiscal selector modal (paginated search) ═════ */}
      <Dialog open={modalCliente} onClose={() => setModalCliente(false)} maxWidth="md" fullWidth>
        <DialogTitle>Seleccionar Cliente Fiscal</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar cliente fiscal..."
              value={clienteSearchTerm}
              onChange={e => handleClienteSearchChange(e.target.value)}
              slotProps={{ input: { endAdornment: loadingClientes ? <CircularProgress size={20} /> : <Search /> } }}
            />
          </Box>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '50vh' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Nombre Fiscal</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>RFC</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Régimen Fiscal</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientesFiscales.length === 0 && !loadingClientes ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">Sin resultados</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiscales.map(cliente => (
                    <TableRow key={cliente.id} hover>
                      <TableCell>{cliente.nombreFiscal}</TableCell>
                      <TableCell>{cliente.rfc}</TableCell>
                      <TableCell>{getRegimenFiscalDesc(cliente.regimenFiscal)}</TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="contained" onClick={() => handleModalSelectCliente(cliente)}>
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {clienteTotalRecords > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Página {clientePageNumber} de {Math.ceil(clienteTotalRecords / clientePageSize)} ({clienteTotalRecords} registros)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<NavigateBefore />}
                  disabled={clientePageNumber <= 1}
                  onClick={() => fetchClientesFiscales(clienteSearchTerm, clientePageNumber - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="small"
                  endIcon={<NavigateNext />}
                  disabled={clientePageNumber * clientePageSize >= clienteTotalRecords}
                  onClick={() => fetchClientesFiscales(clienteSearchTerm, clientePageNumber + 1)}
                >
                  Siguiente
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setModalCliente(false)} color="inherit">Cancelar</Button></DialogActions>
      </Dialog>

      {/* ═════ Preview modal ═════ */}
      <Dialog open={modalPreview} onClose={() => setModalPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Vista previa de la factura</DialogTitle>
        <DialogContent>
          {previewData.length > 0 ? (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Card variant="outlined" sx={{ flex: 1, minWidth: 200, p: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>Cliente</Typography>
                  <Typography variant="body2"><strong>Nombre:</strong> {previewData[0].receptorNombre}</Typography>
                  <Typography variant="body2"><strong>RFC:</strong> {previewData[0].receptorRfc}</Typography>
                  <Typography variant="body2"><strong>Uso CFDI:</strong> {getDesc(usoCfdiOptions, previewData[0].receptorUsoCFDI)}</Typography>
                  <Typography variant="body2"><strong>Régimen Fiscal:</strong> {getRegimenFiscalDesc(previewData[0].receptorRegimenFiscal)}</Typography>
                  <Typography variant="body2"><strong>CP:</strong> {previewData[0].receptorDomicilioFiscal}</Typography>
                </Card>
                <Card variant="outlined" sx={{ flex: 1, minWidth: 200, p: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>Emisor</Typography>
                  <Typography variant="body2"><strong>Nombre:</strong> {previewData[0].emisorNombre}</Typography>
                  <Typography variant="body2"><strong>RFC:</strong> {previewData[0].emisorRfc}</Typography>
                  <Typography variant="body2"><strong>Régimen Fiscal:</strong> {getRegimenFiscalDesc(previewData[0].emisorRegimenFiscal)}</Typography>
                  <Typography variant="body2"><strong>CP:</strong> {previewData[0].lugarExpedicion}</Typography>
                </Card>
                <Card variant="outlined" sx={{ flex: 1, minWidth: 200, p: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>Comprobante</Typography>
                  <Typography variant="body2"><strong>Tipo:</strong> {previewData[0].tipoComprobante}</Typography>
                  <Typography variant="body2"><strong>Forma Pago:</strong> {getDesc(formaPagoOptions, previewData[0].formaDePago)}</Typography>
                  <Typography variant="body2"><strong>Método Pago:</strong> {getDesc(metodoPagoOptions, previewData[0].metodoPago)}</Typography>
                </Card>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Clave ProdServ</TableCell>
                      <TableCell>Clave Unidad</TableCell>
                      <TableCell align="right">Valor Unitario</TableCell>
                      <TableCell align="right">Importe</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{item.cantidadProducto}</TableCell>
                        <TableCell>{item.descripcionProducto}</TableCell>
                        <TableCell>{item.claveProdServ}</TableCell>
                        <TableCell>{item.claveUnidad}</TableCell>
                        <TableCell align="right">{formatCurrency(Number(item.valorUnitario))}</TableCell>
                        <TableCell align="right">{formatCurrency(Number(item.importe))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ textAlign: 'right', mt: 2 }}>
                <Typography variant="body2"><strong>Subtotal:</strong> {formatCurrency(previewData.reduce((sum: number, i: any) => sum + Number(i.subtotal), 0))}</Typography>
                <Typography variant="body2"><strong>IVA:</strong> {formatCurrency(
                  previewData.reduce((sum: number, i: any) => sum + Number(i.total), 0) -
                  previewData.reduce((sum: number, i: any) => sum + Number(i.subtotal), 0)
                )}</Typography>
                <Typography variant="body1" fontWeight={600}><strong>Total:</strong> {formatCurrency(previewData.reduce((sum: number, i: any) => sum + Number(i.total), 0))}</Typography>
              </Box>
            </>
          ) : (
            <Typography color="text.secondary">No hay datos para mostrar.</Typography>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setModalPreview(false)} color="inherit">Cerrar</Button></DialogActions>
      </Dialog>

      {/* ═════ Cancelar SAT modal ═════ */}
      <Dialog open={modalCancelarSAT} onClose={() => setModalCancelarSAT(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancelar factura en el SAT</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Folio: <strong>{facturaACancelar?.serie}{facturaACancelar?.folio}</strong>
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Motivo de cancelación</InputLabel>
            <Select value={motivoCancelacion} label="Motivo de cancelación" onChange={e => setMotivoCancelacion(e.target.value)}>
              <MenuItem value="01">01 - Comprobante emitido con errores con relación</MenuItem>
              <MenuItem value="02">02 - Comprobante emitido con errores sin relación</MenuItem>
              <MenuItem value="03">03 - No se llevó a cabo la operación</MenuItem>
              <MenuItem value="04">04 - Operación nominativa relacionada en una factura global</MenuItem>
            </Select>
          </FormControl>
          {motivoCancelacion === '01' && (
            <TextField fullWidth size="small" label="UUID que sustituye" value={uuidSustituto}
              onChange={e => setUuidSustituto(e.target.value)} sx={{ mb: 2 }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalCancelarSAT(false)} color="inherit">Cancelar</Button>
          <Button onClick={ejecutarCancelacionSAT} variant="contained" color="error" disabled={cancelandoSAT}>
            {cancelandoSAT ? <CircularProgress size={20} /> : 'Cancelar en SAT'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═════ Acciones dropdown ═════ */}
      <Menu
        anchorEl={menuAnchor.el}
        open={Boolean(menuAnchor.el)}
        onClose={() => setMenuAnchor({ el: null, factura: null })}
      >
        <MenuItem onClick={() => { handleSendEmail(menuAnchor.factura); setMenuAnchor({ el: null, factura: null }); }}>
          <ListItemIcon><Send fontSize="small" /></ListItemIcon> Enviar Email
        </MenuItem>
        {menuAnchor.factura?.habilitada === false && (
          <MenuItem onClick={() => { handleEnableInvoice(menuAnchor.factura); setMenuAnchor({ el: null, factura: null }); }}>
            <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon> Habilitar
          </MenuItem>
        )}
        <MenuItem onClick={() => { cancelaFacturaSistema(menuAnchor.factura); setMenuAnchor({ el: null, factura: null }); }}>
          <ListItemIcon><Cancel fontSize="small" color="error" /></ListItemIcon> Cancelar Sistema
        </MenuItem>
      </Menu>

      {/* ═════ PDF Preview Modal ═════ */}
      <Dialog open={modalPdfPreview} onClose={() => { URL.revokeObjectURL(pdfPreviewUrl); setModalPdfPreview(false); }} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Vista previa del PDF
          <Button variant="outlined" size="small" startIcon={<Download />}
            onClick={() => {
              const a = document.createElement('a');
              a.href = pdfPreviewUrl;
              a.download = 'factura.pdf';
              a.click();
            }} disabled={loadingPdfPreview || !pdfPreviewUrl}>Descargar</Button>
        </DialogTitle>
        <DialogContent sx={{ height: '80vh', p: 0 }}>
          {loadingPdfPreview ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : pdfPreviewUrl ? (
            <iframe src={pdfPreviewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ═════ Modal Cliente Fiscal ═════ */}
      <Dialog open={modalClienteFiscal} onClose={() => setModalClienteFiscal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editandoClienteFiscal ? 'Editar' : 'Nuevo'} Cliente Fiscal</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField size="small" label="RFC" value={clienteFiscalForm.rfc} onChange={e => setClienteFiscalForm(p => ({ ...p, rfc: e.target.value.toUpperCase() }))} />
            <TextField size="small" label="Nombre Fiscal" value={clienteFiscalForm.nombreFiscal} onChange={e => setClienteFiscalForm(p => ({ ...p, nombreFiscal: e.target.value }))} />
            <TextField size="small" label="CP Fiscal" value={clienteFiscalForm.cpFiscal} onChange={e => setClienteFiscalForm(p => ({ ...p, cpFiscal: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>Régimen Fiscal</InputLabel>
              <Select value={clienteFiscalForm.regimenFiscal} label="Régimen Fiscal" onChange={e => setClienteFiscalForm(p => ({ ...p, regimenFiscal: e.target.value }))}>
                {Object.entries(REGIMEN_FISCAL_DESCRIPTIONS).map(([k, v]) => <MenuItem key={k} value={k}>{k} - {v}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Uso CFDI</InputLabel>
              <Select value={clienteFiscalForm.usoCFDI} label="Uso CFDI" onChange={e => setClienteFiscalForm(p => ({ ...p, usoCFDI: e.target.value }))}>
                {usoCfdiOptions.map((o: any) => <MenuItem key={o.clave} value={o.clave}>{o.descripcion}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Correo Fiscal" value={clienteFiscalForm.correoFiscal} onChange={e => setClienteFiscalForm(p => ({ ...p, correoFiscal: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalClienteFiscal(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveClienteFiscal} variant="contained">{editandoClienteFiscal ? 'Actualizar' : 'Guardar'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
