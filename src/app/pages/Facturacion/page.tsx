import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Card, CardContent, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';
import {
  Receipt, Description, PictureAsPdf, Email, Send, Cancel,
  CheckCircle, RadioButtonUnchecked, Search
} from '@mui/icons-material';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import useConsumoApiFacturacion from '../../../hooks/useConsumoApiFacturacion';
import useConsumoApi from '../../../hooks/useConsumoApi';
import useSession from '../../../hooks/useSession';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import 'jspdf-autotable';
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
  let conceptosHtml = '';
  for (let i = 0; i < conceptos.length; i++) {
    const c = conceptos[i];
    conceptosHtml += `
      <tr>
        <td style="font-size:14px; padding:4px; border-bottom:1px solid #ddd; text-align:center;">${c.getAttribute('Cantidad')}</td>
        <td style="font-size:14px; padding:4px; border-bottom:1px solid #ddd;">${c.getAttribute('Descripcion')}</td>
        <td style="font-size:14px; padding:4px; border-bottom:1px solid #ddd;">${c.getAttribute('ClaveProdServ')}</td>
        <td style="font-size:14px; padding:4px; border-bottom:1px solid #ddd;">${c.getAttribute('ClaveUnidad')}</td>
        <td style="font-size:14px; padding:4px; border-bottom:1px solid #ddd; text-align:right;">${formatCurrency(parseFloat(c.getAttribute('ValorUnitario') || '0'))}</td>
        <td style="font-size:14px; padding:4px; border-bottom:1px solid #ddd; text-align:right;">${formatCurrency(parseFloat(c.getAttribute('Importe') || '0'))}</td>
      </tr>`;
  }

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

  const logoBase64 = logoImage;

  const htmlContent = `
    <div style="font-family: helvetica, sans-serif; font-size: 16px; padding: 10px; color: black; width: 800px; background: white;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <div style="flex: 0 0 auto;">
          <img src="${logoBase64}" alt="Logo" style="height: 55px; max-width: 100%;">
        </div>
        <div style="flex: 1; text-align: center; padding: 0 15px;">
          <p style="font-size: 20px; font-weight: bold; margin: 0;">${emisor.getAttribute('Nombre')}</p>
          <p style="font-size: 16px; margin: 2px 0;">RFC: ${rfcEmisor}</p>
          <p style="font-size: 16px; margin: 2px 0;">${getRegimenFiscalDesc(regimenFiscalEmisor)}</p>
        </div>
        <div style="flex: 0 0 auto; text-align: right;">
          <p style="font-size: 18px; margin: 2px 0;"><strong>Fecha:</strong> ${comprobante.getAttribute('Fecha')}</p>
          <p style="font-size: 18px; margin: 2px 0;"><strong>Serie:</strong> ${serie}</p>
          <p style="font-size: 18px; margin: 2px 0;"><strong>Folio:</strong> ${folio}</p>
        </div>
      </div>
      <hr style="border: none; border-top: 1px solid #ccc; margin: 5px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <p style="font-size: 16px; margin: 0;"><strong>Lugar de expedición:</strong> ${comprobante.getAttribute('LugarExpedicion')}</p>
        <p style="font-size: 16px; margin: 0;"><strong>Tipo de Comprobante:</strong> ${comprobante.getAttribute('TipoDeComprobante')}</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 8px; border-radius: 3px; margin: 5px 0;">
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <p style="flex: 0 1 auto; margin: 0; padding: 0; font-size: 18px; font-weight: bold;">Cliente</p>
          <hr style="flex: 1; margin: 0 0 0 10px; padding: 0; border: none; border-top: 1px solid #ccc;">
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
          <p style="font-size: 14px; margin: 2px 0;"><strong>Nombre:</strong> ${receptor.getAttribute('Nombre')}</p>
          <p style="font-size: 14px; margin: 2px 0;"><strong>RFC:</strong> ${rfcReceptor}</p>
          <p style="font-size: 14px; margin: 2px 0;"><strong>Uso CFDI:</strong> ${receptor.getAttribute('UsoCFDI')}</p>
          <p style="font-size: 14px; margin: 2px 0;"><strong>Régimen Fiscal:</strong> ${getRegimenFiscalDesc(regimenFiscalReceptor)}</p>
          <p style="font-size: 14px; margin: 2px 0;"><strong>Método de pago:</strong> ${comprobante.getAttribute('MetodoPago')}</p>
          <p style="font-size: 14px; margin: 2px 0;"><strong>Forma de Pago:</strong> ${comprobante.getAttribute('FormaPago')}</p>
        </div>
      </div>
      <table style="width:100%; border-collapse:collapse; margin-top:10px;">
        <thead>
          <tr style="background-color:#f5f5f5;">
            <th style="text-align:center; padding:4px; font-size:14px; border:1px solid #ddd;">Cantidad</th>
            <th style="text-align:left; padding:4px; font-size:14px; border:1px solid #ddd;">Descripción</th>
            <th style="text-align:left; padding:4px; font-size:14px; border:1px solid #ddd;">ClaveProdServ</th>
            <th style="text-align:left; padding:4px; font-size:14px; border:1px solid #ddd;">ClaveUnidad</th>
            <th style="text-align:right; padding:4px; font-size:14px; border:1px solid #ddd;">Valor Unitario</th>
            <th style="text-align:right; padding:4px; font-size:14px; border:1px solid #ddd;">Importe</th>
          </tr>
        </thead>
        <tbody>${conceptosHtml}</tbody>
      </table>
      <div style="display: flex; justify-content: space-between; margin-top: 15px;">
        <div style="flex: 1; padding-right: 15px;">
          <div style="margin-bottom: 8px;">
            <p style="font-size:14px; margin: 2px 0;"><strong>Cantidad Con letra:</strong></p>
            <p style="font-size:14px; margin: 2px 0; font-style: italic;">${totalLetra}</p>
          </div>
          <div style="margin-bottom: 8px;">
            <p style="font-size:14px; margin: 2px 0;"><strong>Serie:</strong> ${serie} <strong>Folio:</strong> ${folio}</p>
            <p style="font-size:14px; margin: 2px 0;"><strong>Folio Fiscal:</strong> ${uuid}</p>
            <p style="font-size:14px; margin: 2px 0;"><strong>Fecha de Certificación:</strong> ${fechaTimbrado}</p>
          </div>
          ${infoGlobalHtml}
        </div>
        <div style="flex: 0 0 auto; width: 180px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <tr style="background-color: #f5f5f5;">
              <td style="text-align: left; padding: 4px; font-size:14px; font-weight: bold; border-bottom: 1px solid #ddd;">Subtotal 16%:</td>
              <td style="text-align: right; padding: 4px; font-size:14px; border-bottom: 1px solid #ddd;">${formatCurrency(parseFloat(subtotal))}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px; font-size:14px; font-weight: bold; border-bottom: 1px solid #ddd;">IVA 16%:</td>
              <td style="text-align: right; padding: 4px; font-size:14px; border-bottom: 1px solid #ddd;">${formatCurrency(iva)}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="text-align: left; padding: 4px; font-size: 14px; font-weight: bold;">Total:</td>
              <td style="text-align: right; padding: 4px; font-size: 14px; font-weight: bold;">${formatCurrency(parseFloat(total))}</td>
            </tr>
          </table>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
        <div style="font-size: 10px; color: #666;">
          <p style="margin: 0;"><strong>CADENA ORIGINAL:</strong></p>
          <p style="margin: 2px 0; word-break: break-all;">${version}|${uuid}|${fechaTimbrado}|${rfcProvCertif}|${selloCFD}|${noCertificadoSAT}|${selloSAT}</p>
          <p style="margin: 5px 0 0 0;"><strong>Sello Digital CFDI:</strong></p>
          <p style="margin: 2px 0; word-break: break-all; font-size: 9px;">${selloCFD}</p>
          <p style="margin: 5px 0 0 0;"><strong>Sello SAT:</strong></p>
          <p style="margin: 2px 0; word-break: break-all; font-size: 9px;">${selloSAT}</p>
        </div>
        <div style="flex: 0 0 auto; text-align: center;">
          <img src="${qrDataUrl}" alt="QR" style="width: 120px; height: 120px;">
          <p style="font-size: 10px; margin: 2px 0;">Este documento es una representación impresa de un CFDI</p>
        </div>
      </div>
    </div>`;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'letter');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
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

    const response = await fetch('https://api.cbinformatica.net:9004/api/Email/send', {
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
  const [clientes, setClientes] = useState<any[]>([]);

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
    consumoApi.get('/Cliente?id=0').then(r => setClientes(r.data)).catch(() => {});
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
  };

  const getDesc = (options: any[], clave: string) => options.find(o => o.clave === clave)?.descripcion || clave;

  const handleModalSelectCliente = (id: number, name: string) => {
    setSelectedIdC(String(id));
    setSelectedName(name);
    setModalCliente(false);
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
    {
      id: 'estado', header: 'Estado', size: 100,
      Cell: ({ row }) => row.original.habilitada
        ? <Chip icon={<CheckCircle />} label="Timbrada" color="success" size="small" variant="outlined" />
        : <Chip icon={<RadioButtonUnchecked />} label="Pendiente" size="small" variant="outlined" />,
    },
  ];

  const columnsFacturas: MRT_ColumnDef<any>[] = [
    {
      id: 'acciones', header: 'Acciones', size: 260,
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" startIcon={<Description />}
            onClick={() => downloadXML(row.original.xml, `${row.original.serie}-${row.original.folio}`)}>XML</Button>
          <Button size="small" variant="outlined" startIcon={<PictureAsPdf />}
            onClick={async () => { const blob = await generatePdfBlob(row.original.xml); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${row.original.serie}-${row.original.folio}.pdf`; a.click(); URL.revokeObjectURL(url); }}>PDF</Button>
          <Button size="small" variant="outlined" color="warning" startIcon={<Send />}
            onClick={() => handleSendEmail(row.original)}>Email</Button>
          {row.original.habilitada === false && (
            <Button size="small" variant="outlined" color="info"
              onClick={() => handleEnableInvoice(row.original)}>Habilitar</Button>
          )}
          <Button size="small" variant="outlined" color="error" startIcon={<Cancel />}
            onClick={() => cancelaFacturaSistema(row.original)}>Canc. Sistema</Button>
          <Button size="small" variant="outlined" color="error"
            onClick={() => abrirCancelarSAT(row.original)}>Canc. SAT</Button>
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

      {/* ═════ CFDI Configuration Modal ═════ */}
      <Dialog open={modalCFDI} onClose={() => { if (!loadingFacturar) setModalCFDI(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRows.length > 0
            ? `Facturar múltiples ventas: ${selectedRows.map((r: any) => r.original.noVenta).join(', ')}`
            : `Facturar venta: ${selectedRow?.original?.noVenta}`}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
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

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField size="small" label="Cliente" value={selectedName} fullWidth slotProps={{ input: { readOnly: true } }} />
            <Button variant="outlined" onClick={() => setModalCliente(true)} sx={{ minWidth: 120 }}>Seleccionar</Button>
          </Box>

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
          <Button onClick={() => setModalCFDI(false)} color="inherit" disabled={loadingFacturar}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* ═════ Cliente selector modal ═════ */}
      <Dialog open={modalCliente} onClose={() => setModalCliente(false)} maxWidth="md" fullWidth>
        <DialogTitle>Seleccionar Cliente</DialogTitle>
        <DialogContent>
          <MaterialReactTable
            columns={[
              { header: 'Acciones', size: 120, Cell: ({ row }) => (
                <Button size="small" variant="outlined" onClick={() => handleModalSelectCliente(row.original.id_cliente, row.original.nombre)}>Seleccionar</Button>
              )},
              { accessorKey: 'nombre', header: 'Nombre' },
            ]}
            data={clientes}
            enableGlobalFilter
            initialState={{ density: 'compact', showGlobalFilter: true }}
            muiSearchTextFieldProps={{ placeholder: 'Buscar cliente...', sx: { minWidth: 250 } }}
            muiTableContainerProps={{ sx: { maxHeight: '60vh' } }}
          />
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
                  <Typography variant="body2"><strong>CP:</strong> {previewData[0].receptorDomicilioFiscal}</Typography>
                </Card>
                <Card variant="outlined" sx={{ flex: 1, minWidth: 200, p: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>Emisor</Typography>
                  <Typography variant="body2"><strong>Nombre:</strong> {previewData[0].emisorNombre}</Typography>
                  <Typography variant="body2"><strong>RFC:</strong> {previewData[0].emisorRfc}</Typography>
                  <Typography variant="body2"><strong>Régimen Fiscal:</strong> {getDesc(REGIMEN_FISCAL_DESCRIPTIONS, previewData[0].emisorRegimenFiscal)}</Typography>
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
    </Box>
  );
}
