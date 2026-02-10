import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import "jspdf-autotable";

// Copia aquí la función generatePdf de InvoicePDFGenerator, 
// pero haz que reciba xmlContent y devuelva un Blob o base64

export async function generateInvoicePdfBlob(xmlContent: string): Promise<Blob> {

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

    console.log("XML parseado:", xmlDoc);

    const comprobante =
      xmlDoc.getElementsByTagName("cfdi:Comprobante")[0] || xmlDoc.getElementsByTagName("Comprobante")[0];
    const emisor = xmlDoc.getElementsByTagName("cfdi:Emisor")[0] || xmlDoc.getElementsByTagName("Emisor")[0];
    const receptor = xmlDoc.getElementsByTagName("cfdi:Receptor")[0] || xmlDoc.getElementsByTagName("Receptor")[0];
    // Extraer el nodo del Timbre Fiscal Digital
    const timbreFiscalDigital =
      xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0] ||
      xmlDoc.getElementsByTagName("TimbreFiscalDigital")[0];

    // Validar que el nodo existe antes de extraer atributos
    if (!timbreFiscalDigital) {
      console.error("⚠️ Error: No se encontró el nodo 'TimbreFiscalDigital' en el XML.");
      alert("Error al procesar la factura. No se encontró información de timbrado.");
      return;
    }

    const conceptos = xmlDoc.getElementsByTagName("cfdi:Concepto");

    // Debugging para Serie y Folio
    console.log("Comprobante encontrado:", comprobante);
    console.log("Atributos disponibles:", comprobante ? [...comprobante.attributes].map((attr) => attr.name) : []);

    const serie = comprobante?.getAttribute("Serie");
    const folio = comprobante?.getAttribute("Folio");

    console.log("Serie extraída:", serie);
    console.log("Folio extraído:", folio);

    // Usar valores por defecto si no se encuentran
    const serieValue = serie || "No encontrado";
    const folioValue = folio || "No encontrado";
    const complemento = xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital");
    const rfcEmisor = emisor.getAttribute("Rfc");
    const rfcReceptor = receptor.getAttribute("Rfc");
    const total = parseFloat(comprobante.getAttribute("Total")).toFixed(6); // Total del CFDI

    const periodicidad = xmlDoc.getElementsByTagName("cfdi:InformacionGlobal")[0];
    const CfdiRelacionados = xmlDoc.getElementsByTagName("cfdi:CfdiRelacionados")[0];
    // Verificar si se encontró el complemento y extraer la información
    // const timbreFiscalDigital = complemento[0];
    const version = timbreFiscalDigital.getAttribute("Version");
    const uuid = timbreFiscalDigital?.getAttribute("UUID") || "No encontrado";
    const fechaTimbrado = timbreFiscalDigital.getAttribute("FechaTimbrado");
    const rfcProvCertif = timbreFiscalDigital.getAttribute("RfcProvCertif");
    //const selloCFD = timbreFiscalDigital.getAttribute('SelloCFD');
    const noCertificadoSAT = timbreFiscalDigital.getAttribute("NoCertificadoSAT");
    // const selloSAT = timbreFiscalDigital.getAttribute('SelloSAT');
    // const selloCFDLast8 = selloCFD.slice(-8); // Últimos 8 caracteres del sello digital
    // Extraer valores con validación
    const selloCFD = timbreFiscalDigital.getAttribute("SelloCFD") || ""; // ⚠️ Aquí es donde fallaba
    const selloSAT = timbreFiscalDigital.getAttribute("SelloSAT") || "";

    // Si `selloCFD` está vacío, usar `selloSAT`
    const selloCFDLast8 = selloCFD ? selloCFD.slice(-8) : selloSAT.slice(-8) || "XXXXXXXX";

    const cadenaOriginal = `${version}|${uuid}|${fechaTimbrado}|${rfcProvCertif}|${selloCFD}|${noCertificadoSAT}|${selloSAT}`;
    const urlQR = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${uuid}&re=${rfcEmisor}&rr=${rfcReceptor}&tt=${total}&fe=${selloCFDLast8}`;

    const qrDataUrl = await QRCode.toDataURL(urlQR, { width: 256, height: 256 });

    console.log("✅ UUID:", timbreFiscalDigital.getAttribute("UUID"));
    console.log("✅ Fecha Timbrado:", timbreFiscalDigital.getAttribute("FechaTimbrado"));
    console.log("✅ Sello CFD:", selloCFD);
    console.log("✅ Sello SAT:", selloSAT);
    console.log("✅ Últimos 8 caracteres:", selloCFDLast8);

    // Objeto de mapeo para los códigos de régimen fiscal
    const regimenFiscalDescriptions = {
      "601": "General de Ley Personas Morales",
      "603": "Personas Morales con Fines no Lucrativos",
      "605": "Sueldos y Salarios e Ingresos Asimilados a Salarios",
      "606": "Arrendamiento",
      "607": "Régimen de Enajenación o Adquisición de Bienes",
      "608": "Demás ingresos",
      "609": "Consolidación",
      "610": "Residentes en el Extranjero sin Establecimiento Permanente en México",
      "611": "Ingresos por Dividendos (socios y accionistas)",
      "612": "Personas Físicas con Actividades Empresariales y Profesionales",
      "614": "Ingresos por intereses",
      "615": "Régimen de los ingresos por obtención de premios",
      "616": "Sin obligaciones fiscales",
      "620": "Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
      "621": "Incorporación Fiscal",
      "622": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
      "623": "Opcional para Grupos de Sociedades",
      "624": "Coordinados",
      "625": "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
      "626": "Régimen Simplificado de Confianza",
    };

    // Función para obtener la descripción completa del régimen fiscal
    function getRegimenFiscalDescription(code) {
      return `${code} - ${regimenFiscalDescriptions[code] || "Descripción no disponible"}`;
    }

    function formatCurrency(value) {
      return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(value);
    }

    function convertirCifraALetra(cifra) {
      const cifras = ["Cero", "Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve"];
      const decenas = [
        "",
        "Diez",
        "Veinte",
        "Treinta",
        "Cuarenta",
        "Cincuenta",
        "Sesenta",
        "Setenta",
        "Ochenta",
        "Noventa",
      ];
      const especiales = [
        "Once",
        "Doce",
        "Trece",
        "Catorce",
        "Quince",
        "Dieciséis",
        "Diecisiete",
        "Dieciocho",
        "Diecinueve",
      ];
      const centenas = [
        "",
        "Ciento",
        "Doscientos",
        "Trescientos",
        "Cuatrocientos",
        "Quinientos",
        "Seiscientos",
        "Setecientos",
        "Ochocientos",
        "Novecientos",
      ];

      function convertirTresCifras(numero) {
        const centena = Math.floor(numero / 100);
        const decena = Math.floor((numero % 100) / 10);
        const unidad = numero % 10;
        let resultado = "";

        if (centena > 0) {
          resultado += centena === 1 && decena === 0 && unidad === 0 ? "Cien" : centenas[centena];
          resultado += " ";
        }

        if (decena > 1) {
          resultado += decenas[decena];
          if (unidad > 0) {
            resultado += " y " + cifras[unidad];
          }
        } else if (decena === 1) {
          if (unidad === 0) {
            resultado += decenas[decena];
          } else {
            resultado += especiales[unidad - 1];
          }
        } else {
          if (unidad > 0) {
            resultado += cifras[unidad];
          }
        }

        return resultado.trim();
      }

      const entero = Math.floor(cifra);
      const centavos = Math.round((cifra - entero) * 100);

      if (entero === 0) {
        return "Cero Pesos" + (centavos > 0 ? " con " + (centavos < 10 ? "0" + centavos : centavos) + "/100 M.N." : "");
      }

      const millones = Math.floor(entero / 1000000);
      const miles = Math.floor((entero % 1000000) / 1000);
      const unidades = entero % 1000;

      let numeroLiteral = "";

      if (millones > 0) {
        numeroLiteral += millones === 1 ? "Un Millón" : convertirTresCifras(millones) + " Millones";
      }

      if (miles > 0) {
        if (millones > 0) {
          numeroLiteral += ", ";
        }
        numeroLiteral += convertirTresCifras(miles) + " Mil";
      }

      if (unidades > 0) {
        if (millones > 0 || miles > 0) {
          numeroLiteral += " ";
        }
        numeroLiteral += convertirTresCifras(unidades);
      }

      numeroLiteral += " Pesos";

      if (centavos > 0) {
        numeroLiteral += " con " + (centavos < 10 ? "0" + centavos : centavos) + "/100 M.N.";
      }

      if (cifra < 0) {
        numeroLiteral = "Menos " + numeroLiteral;
      }

      return numeroLiteral.trim();
    }

    function getPeriodicidadDescription(value) {
      const descriptions = {
        "01": "Diaria",
        "02": "Semanal",
        "03": "Quincenal",
        "04": "Mensual",
        "05": "Bimestral",
        // Agrega más si es necesario
      };
      return descriptions[value] || value;
    }

    function getMesDescription(value) {
      const descriptions = {
        "01": "Enero",
        "02": "Febrero",
        "03": "Marzo",
        "04": "Abril",
        "05": "Mayo",
        "06": "Junio",
        "07": "Julio",
        "08": "Agosto",
        "09": "Septiembre",
        "10": "Octubre",
        "11": "Noviembre",
        "12": "Diciembre",
      };
      return descriptions[value] || value;
    }

    const totalFactura = convertirCifraALetra(comprobante.getAttribute("Total"));

    // Crear el HTML de la factura
    const logo = "./img/logoPE.png";
    const regimenFiscalCodeEmisor = emisor.getAttribute("RegimenFiscal");
    const regimenFiscalCodeReceptor = receptor.getAttribute("RegimenFiscalReceptor");
    const informacionGlobal = comprobante.getElementsByTagName("cfdi:InformacionGlobal")[0];

    const informacionGlobalHtml = informacionGlobal
      ? `
    <div style="margin-top: 20px;">
      <h3 style="font-size: 25px;"><strong>Información Global</strong></h3>
      <p style="font-size: 25px;">
        <strong>Periodicidad:</strong> ${getPeriodicidadDescription(informacionGlobal.getAttribute("Periodicidad"))}, 
        <strong>Mes:</strong> ${getMesDescription(informacionGlobal.getAttribute("Meses"))}, 
        <strong>Año:</strong> ${informacionGlobal.getAttribute("Año")}
      </p>
    </div>
  `
      : "";

    // Crear el HTML para el encabezado (parte superior)

    //     <div style="margin-left: 25px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
    //     <p style="text-align: center; font-size: 40px;"><strong>${emisor.getAttribute("Nombre")}</strong></p>
    //     <p style="text-align: center; font-size: 25px;"><strong>${getRegimenFiscalDescription(
    //       regimenFiscalCodeEmisor
    //     )}</strong></p>
    //     <p style="text-align: center;font-size: 25px;"><strong>CFDI: ${serie}${folio}</strong></p>
    //   </div>
const invoiceHtmlHeader = `
  <div style="font-family: helvetica, sans-serif; font-size: 18px; padding: 10px 20px; color: black; background: white;">
    <div style="display: flex; align-items: center;">
      <div style="flex: 0 0 auto;"></div>
    </div>
    <hr>
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <p style="font-size: 18px;"><strong>Nombre Emisor:</strong> ${emisor.getAttribute("Nombre")}</p>
      <p style="font-size: 18px;"><strong>RFC Emisor:</strong> ${emisor.getAttribute("Rfc")}</p>
      <p style="font-size: 18px;"><strong>Fecha y hora: </strong>${comprobante.getAttribute("Fecha")}</p>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <p style="font-size: 18px;"><strong>Régimen Fiscal:</strong> ${getRegimenFiscalDescription(
        emisor.getAttribute("RegimenFiscal") || ""
      )}</p>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <p style="text-align: left; font-size: 18px;"><strong>Lugar de expedición:</strong> ${comprobante.getAttribute(
        "LugarExpedicion"
      )}</p> 
      <p style="font-size: 18px;" ><strong>Serie: </strong>${comprobante.getAttribute("Serie")}</p>
      <p style="font-size: 18px;" ><strong>Folio: </strong>${comprobante.getAttribute("Folio")}</p>
    </div>
    <div style="display: flex; align-items: center;">
      <p style="flex: 0 1 auto; margin: 0; padding: 0; font-size: 18px;"><strong>[Cliente]</strong></p>
      <hr style="flex: 1; margin: 0; padding: 0; border: none; border-top: 1px solid black;">
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px;">
      <p style="font-size: 18px;" ><strong>Nombre : </strong>${receptor.getAttribute("Nombre")}</p>
      <p style="font-size: 18px;"><strong>Metodo de pago:</strong> ${comprobante.getAttribute("MetodoPago")}</p>
      <p style="font-size: 18px;" ><strong>RFC : </strong>${receptor.getAttribute("Rfc")}</p>
      <p style="font-size: 18px;" ><strong>Tipo de Comprobante: </strong>${comprobante.getAttribute(
        "TipoDeComprobante"
      )}</p>
      <p style="font-size: 18px;" ><strong>Forma de Pago: </strong>${comprobante.getAttribute("FormaPago")}</p>
      <p style="font-size: 18px;" ><strong>Uso de CFDI: </strong>${receptor.getAttribute("UsoCFDI")}</p>
      <p style="font-size: 18px;" ><strong>Régimen Fiscal: </strong>${getRegimenFiscalDescription(
        regimenFiscalCodeReceptor
      )}</p>
    </div>
  </div>
`;

    // Crear el HTML para el pie de página (parte inferior)
    const invoiceHtmlFooter = `
      <div style="font-family: Arial, sans-serif; font-size: 25px; padding: 100px;  color: black;">
       <div style="display: flex; justify-content: space-between;">
          <div>
            <p style="font-size: 25px;"><strong>Cantidad Con letra:</strong></p>
            <p style="font-size: 25px;">${totalFactura}</p>
            <p style="font-size: 25px;"><strong>Serie:</strong> ${serie} <strong>Folio:</strong> ${folio}</p>
            <p style="font-size: 25px;"><strong>Folio Fiscal:</strong> ${uuid}</p>
            <p style="font-size: 25px;"><strong>Fecha de Certificación:</strong> ${fechaTimbrado}</p>
              ${informacionGlobalHtml}
             
          </div>
          <div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="text-align: left; padding: 5px; font-size: 25px;"><strong>Subtotal&nbsp;16%:</strong></td>
                <td style="text-align: right; padding: 5px; font-size: 25px;">${formatCurrency(
                  comprobante.getAttribute("SubTotal")
                )}</td>
              </tr>
              <tr>
                <td style="text-align: left; padding: 5px; font-size: 25px;"><strong>IVA 16%:</strong></td>
                <td style="text-align: right; padding: 5px; font-size: 25px;">${formatCurrency(
                  parseFloat(comprobante.getAttribute("Total")) - parseFloat(comprobante.getAttribute("SubTotal"))
                )}</td>
              </tr>
              <tr>
                <td style="text-align: left; padding: 5px; font-size: 25px;"><strong>Total:</strong></td>
                <td style="text-align: right; padding: 5px; font-size: 25px;">${formatCurrency(
                  comprobante.getAttribute("Total")
                )}</td>
              </tr>
            </table>
          </div>
        </div>
        <p style="font-size: 25px;"><strong>No. de serie del certificado Digital:</strong></p>
        <p style="font-size: 25px;">${comprobante.getAttribute("NoCertificado")}</p>
        <p style="font-size: 25px;"><strong>No. de serie del certificado SAT:</strong></p>
        <p style="font-size: 25px;">${noCertificadoSAT}</p>
        <p style="font-size: 25px;"><strong>Sello digital del CFDI:</strong></p>
        <p style="font-size: 20px; word-wrap: break-word; max-width: 100%;">${comprobante.getAttribute("Sello")}</p>
        <p style="font-size: 25px;"><strong>Sello digital del SAT:</strong></p>
        <p style="font-size: 20px; word-wrap: break-word; max-width: 100%;">${selloSAT}</p>
        <p style="font-size: 25px;"><strong>Cadena original del complemento de certificación digital del SAT:</strong></p>
        <p style="word-wrap: break-word; max-width: 100%;font-size: 20px;">${cadenaOriginal}</p>
        <div>
        <img src="${qrDataUrl}" alt="QR Code" style="display: block; margin-right: auto; margin-left: 0;" />
        
        </div>

        </div>
    `;
const originalBodyBg = document.body.style.backgroundColor;
document.body.style.backgroundColor = "white";
    // Crear el contenedor temporal para el encabezado
const headerContainer = document.createElement("div");
headerContainer.innerHTML = invoiceHtmlHeader;
document.body.appendChild(headerContainer);

    // Crear el contenedor temporal para el pie de página
    const footerContainer = document.createElement("div");
    footerContainer.innerHTML = invoiceHtmlFooter;
    document.body.appendChild(footerContainer);

    // Crear el PDF
    const pdf = new jsPDF("p", "mm", "a4");

    // --- HEADER CON TEXTO JS PDF ---
let headerY = 18; // Margen superior inicial

pdf.setFontSize(14);
pdf.setFont("helvetica", "bold");
pdf.text("Factura Electrónica", 105, headerY, { align: "center" });

headerY += 8;
pdf.setFontSize(10);
pdf.setFont("helvetica", "bold");
pdf.text("Nombre Emisor:", 12, headerY);
pdf.setFont("helvetica", "normal");
pdf.text(emisor.getAttribute("Nombre") || "", 45, headerY);

pdf.setFont("helvetica", "bold");
pdf.text("RFC Emisor:", 120, headerY);
pdf.setFont("helvetica", "normal");
pdf.text(emisor.getAttribute("Rfc") || "", 150, headerY);

headerY += 6;
pdf.setFont("helvetica", "bold");
pdf.text("Fecha y hora:", 12, headerY);
pdf.setFont("helvetica", "normal");

// Formatea la fecha del comprobante a DD/MM/AAAA HH:MM:ss
const fechaRaw = comprobante.getAttribute("Fecha") || "";
let fechaFormateada = fechaRaw;
if (fechaRaw) {
  const d = new Date(fechaRaw.replace(" ", "T"));
  const pad = (n: number) => n.toString().padStart(2, "0");
  fechaFormateada = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

pdf.text(fechaFormateada, 45, headerY);

pdf.setFont("helvetica", "bold");
pdf.text("Régimen Fiscal:", 120, headerY);
pdf.setFont("helvetica", "normal");
pdf.text(getRegimenFiscalDescription(emisor.getAttribute("RegimenFiscal") || ""), 150, headerY, { maxWidth: 40 });

headerY += 6;
pdf.setFont("helvetica", "bold");
pdf.text("Lugar de expedición:", 12, headerY+3);
pdf.setFont("helvetica", "normal");
pdf.text(comprobante.getAttribute("LugarExpedicion") || "", 55, headerY+3);

pdf.setFont("helvetica", "bold");
pdf.text("Serie:", 120, headerY+3);
pdf.setFont("helvetica", "normal");
pdf.text(comprobante.getAttribute("Serie") || "", 135, headerY+3);

pdf.setFont("helvetica", "bold");
pdf.text("Folio:", 160, headerY+3);
pdf.setFont("helvetica", "normal");
pdf.text(comprobante.getAttribute("Folio") || "", 175, headerY+3);

headerY += 8;
pdf.setFont("helvetica", "bold");
pdf.text("Cliente", 12, headerY);

headerY += 6;
pdf.setFont("helvetica", "bold");
pdf.text("Nombre:", 12, headerY);
pdf.setFont("helvetica", "normal");
pdf.text(receptor.getAttribute("Nombre") || "", 35, headerY);

pdf.setFont("helvetica", "bold");
pdf.text("RFC:", 120, headerY);
pdf.setFont("helvetica", "normal");
pdf.text(receptor.getAttribute("Rfc") || "", 135, headerY);

headerY += 6;
pdf.setFont("helvetica", "bold");
pdf.text("Método de pago:", 12, headerY);
pdf.setFont("helvetica", "normal");
pdf.text(comprobante.getAttribute("MetodoPago") || "", 45, headerY);

pdf.setFont("helvetica", "bold");
pdf.text("Forma de pago:", 120, headerY);
pdf.setFont("helvetica", "normal");
pdf.text(comprobante.getAttribute("FormaPago") || "", 150, headerY);

headerY += 6;
pdf.setFont("helvetica", "bold");
pdf.text("Tipo de Comprobante:", 12, headerY);
pdf.setFont("helvetica", "normal");
pdf.text(comprobante.getAttribute("TipoDeComprobante") || "", 55, headerY);

pdf.setFont("helvetica", "bold");
pdf.text("Uso de CFDI:", 120, headerY);
pdf.setFont("helvetica", "normal");
pdf.text(receptor.getAttribute("UsoCFDI") || "", 150, headerY);

headerY += 6;
pdf.setFont("helvetica", "bold");
pdf.text("Régimen Fiscal Receptor:", 12, headerY);
pdf.setFont("helvetica", "normal");
pdf.text(getRegimenFiscalDescription(receptor.getAttribute("RegimenFiscalReceptor") || ""), 65, headerY);

// --- FIN HEADER ---
// Puedes continuar con la tabla usando startY: headerY + 4

    // Convertir el encabezado HTML a imagen y agregarlo al PDF
// const headerCanvas = await html2canvas(headerContainer, { scale: 1 });
// const headerImgData = headerCanvas.toDataURL("image/jpeg");
//     const pdfWidth = 210; // Ancho de una hoja A4 en mm

//     // Obtener las propiedades de la imagen para mantener la relación de aspecto
//     const imgProps = pdf.getImageProperties(headerImgData);
//     const imgWidth = pdfWidth; // Hacer que el ancho sea todo el de A4
//     const imgHeight = (imgProps.height * imgWidth) / imgProps.width; // Ajustar el alto proporcionalmente

//     // Añadir la imagen al PDF
//     pdf.addImage(headerImgData, "JPEG", 0, 0, imgWidth, imgHeight);
    // const startYPosition = imgHeight + 2; // Deja 10mm de margen entre la imagen y la tabl
    // Generar la tabla en el centro del PDF
// Ordenar conceptos por NoIdentificacion ascendente
const conceptosOrdenados = Array.from(conceptos).sort((a, b) => {
  const aVal = a.getAttribute("NoIdentificacion") || "";
  const bVal = b.getAttribute("NoIdentificacion") || "";
  // Si es numérico, compara como número; si no, como string
  const aNum = Number(aVal), bNum = Number(bVal);
  if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
  return aVal.localeCompare(bVal, undefined, { numeric: true });
});

// Generar las filas de la tabla incluyendo NoIdentificacion y Tasa IVA
const tableRows = conceptosOrdenados.map((concepto) => {
  // Buscar la tasa IVA en los nodos hijos del concepto
  let tasaIva = "";
  const impuestos = concepto.getElementsByTagName("cfdi:Impuestos")[0];
  if (impuestos) {
    const traslados = impuestos.getElementsByTagName("cfdi:Traslado");
    for (let i = 0; i < traslados.length; i++) {
      const traslado = traslados[i];
      if (
        traslado.getAttribute("Impuesto") === "002" || // IVA
        traslado.getAttribute("Impuesto") === "IVA"
      ) {
        tasaIva = traslado.getAttribute("TasaOCuota") || "";
        // Si viene como 0.160000, lo convertimos a porcentaje
        if (tasaIva && tasaIva.includes(".")) {
          tasaIva = (parseFloat(tasaIva) * 100).toFixed(2) + "%";
        }
        break;
      }
    }
  }

// Generar las filas de la tabla incluyendo NoIdentificacion
  return [
    concepto.getAttribute("Cantidad"),
    concepto.getAttribute("ClaveUnidad"),
    concepto.getAttribute("ClaveProdServ"),
    concepto.getAttribute("Descripcion"),
    concepto.getAttribute("NoIdentificacion") || "",
    tasaIva,
    formatCurrency(parseFloat(concepto.getAttribute("ValorUnitario")).toFixed(2)),
    formatCurrency(parseFloat(concepto.getAttribute("Importe")).toFixed(2)),
  ];
});
    // pdf.autoTable({
    //   head: [["Cant.", "Unidad", "Clave Producto", "Descripción", "Precio", "Importe"]],
    //   body: tableRows,
    //   startY: startYPosition, // Comienza después de la imagen del encabezado
    //   theme: "striped", // Puedes usar 'striped', 'grid', o 'plain'
    //   styles: {
    //     fontSize: 10, // Tamaño general de la fuente
    //     lineWidth: 0.1, // Grosor de las líneas del borde
    //     lineColor: [0, 0, 0], // Color de las líneas del borde en RGB (negro)
    //   },
    //   columnStyles: {
    //     4: { halign: "right" }, // Alineación a la derecha para la columna de "Precio"
    //     5: { halign: "right" }, // Alineación a la derecha para la columna de "Importe"
    //   },
    //   tableLineColor: [0, 0, 0], // Color del borde de la tabla (negro)
    //   tableLineWidth: 0.1, // Grosor del borde de la tabla
    // });

    pdf.autoTable({
  head: [["Cant.", "Unidad", "Clave Producto", "Descripción", "No. Identificación", "Tasa IVA", "Precio", "Importe"]],
  body: tableRows,
  startY: headerY + 4, // Empieza después del header
  theme: "plain", // Sin bordes
  styles: {
    fontSize: 8,      // Letra más pequeña
    cellPadding: 0.2, // Casi sin interlineado
    lineWidth: 0,     // Sin líneas
    textColor: [0, 0, 0],
    halign: "left",
    valign: "middle",
  },
  headStyles: {
    fontStyle: "bold",
    fillColor: [240, 240, 240],
    textColor: [0, 0, 0],
    halign: "center",
    lineWidth: 0,
    fontSize: 8, // También más pequeño en encabezado
    cellPadding: 0.2,
  },
columnStyles: {
    0: { halign: "center", cellWidth: 13 },  // Cant.
    1: { halign: "center", cellWidth: 15 },  // Unidad
    2: { halign: "center", cellWidth: 25 },  // Clave Producto
    3: { halign: "left",   cellWidth: 45 },  // Descripción
    4: { halign: "center", cellWidth: 22 },  // No. Identificación
    5: { halign: "center", cellWidth: 18 },  // Tasa IVA
    6: { halign: "right",  cellWidth: 20 },  // Precio
    7: { halign: "right",  cellWidth: 20 },  // Importe
},
  didDrawCell: (data) => {
    // Opcional: puedes agregar líneas horizontales suaves si quieres separar visualmente
    // pero por defecto, sin líneas
  },
});

    // // Convertir el pie de página HTML a imagen y agregarlo al PDF
    // const footerCanvas = await html2canvas(footerContainer, { scale: 2 });
    // const footerImgData = footerCanvas.toDataURL('image/jpeg');
    // pdf.addPage(); // Mover el pie de página a una nueva página si es necesario
    // pdf.addImage(footerImgData, 'JPEG', 0, 0, imgWidth, 200);

    // Obtener la posicion final de la tabla
    let finalY = pdf.autoTable.previous.finalY + 5; // La posicion Y donde termino la tabla

    const pageHeight = pdf.internal.pageSize.height; // Altura de la pagina
    const marginBottom = 20; // Margen inferior para el contenido
    const startYNewPage = 20; // Margen superior al crear una nueva pagina

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const lineSpacing = 5; // Espacio base entre lineas

    const cfdiRelacionadosNodes =
      CfdiRelacionados
        ? Array.from(CfdiRelacionados.getElementsByTagName("cfdi:CfdiRelacionado"))
        : [];
    const cfdiHeadingHeight = cfdiRelacionadosNodes.length > 0 ? lineSpacing : 0;
    const cfdiBlockSpacing = cfdiRelacionadosNodes.length * lineSpacing;

    const cadenaLines = pdf.splitTextToSize(cadenaOriginal, 145);
    const cadenaExtraHeight = Math.max(0, cadenaLines.length - 1) * lineSpacing;

    const requiredSpace = 160 + cfdiHeadingHeight + cfdiBlockSpacing + cadenaExtraHeight;

    if (finalY + requiredSpace > pageHeight - marginBottom) {
      pdf.addPage();
      finalY = startYNewPage;
    }

    // Determinar la posicion X donde esta alineado el "Importe" en la tabla
    const xPositionForImporte = 195; // Ajustar esta X a la posicion de "Importe" en la tabla

    // Agregar Subtotal, IVA y Total alineados a la derecha, debajo de la columna "Importe"

    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text("Subtotal 16%:", 150, finalY); // Coloca el texto de Subtotal
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    pdf.text(formatCurrency(comprobante.getAttribute("SubTotal")), xPositionForImporte, finalY, { align: "right" });

    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text("IVA 16%:", 150, finalY + lineSpacing); // Coloca el texto de IVA
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    pdf.text(
      formatCurrency(
        parseFloat(comprobante.getAttribute("Total") || "0") - parseFloat(comprobante.getAttribute("SubTotal") || "0")
      ),
      xPositionForImporte,
      finalY + lineSpacing,
      { align: "right" }
    );

    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text("Total:", 150, finalY + 2 * lineSpacing); // Coloca el texto de Total
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    pdf.text(formatCurrency(comprobante.getAttribute("Total")), xPositionForImporte, finalY + 2 * lineSpacing, {
      align: "right",
    });

    //informacion GLOBAL
    // Cambiar a fuente negrita para "Información Global"
    if (periodicidad) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Información Global:", 100, finalY + 4 * lineSpacing, { align: "left" });

      // Concatenar todo el texto en una sola línea con un poco de espacio adicional
      const extraSpacing = 5; // Espacio adicional de 5 unidades

      pdf.setFont("helvetica", "bold");
      pdf.text("Periodicidad: ", 100, finalY + 5 * lineSpacing, { align: "left" });
      pdf.setFont("helvetica", "normal");
      pdf.text(
        getPeriodicidadDescription(informacionGlobal.getAttribute("Periodicidad")),
        pdf.getTextWidth("Periodicidad: ") + 100 + extraSpacing,
        finalY + 5 * lineSpacing
      );

      pdf.setFont("helvetica", "bold");
      pdf.text(
        "Mes: ",
        pdf.getTextWidth(
          "Periodicidad: " + getPeriodicidadDescription(informacionGlobal.getAttribute("Periodicidad"))
        ) +
          105 +
          extraSpacing,
        finalY + 5 * lineSpacing
      );
      pdf.setFont("helvetica", "normal");
      pdf.text(
        getMesDescription(informacionGlobal.getAttribute("Meses")),
        pdf.getTextWidth(
          "Periodicidad: " + getPeriodicidadDescription(informacionGlobal.getAttribute("Periodicidad")) + "Mes: "
        ) +
          105 +
          extraSpacing * 2,
        finalY + 5 * lineSpacing
      );

      pdf.setFont("helvetica", "bold");
      pdf.text(
        "Año: ",
        pdf.getTextWidth(
          "Periodicidad: " +
            getPeriodicidadDescription(informacionGlobal.getAttribute("Periodicidad")) +
            "Mes: " +
            getMesDescription(informacionGlobal.getAttribute("Meses"))
        ) +
          100 +
          extraSpacing * 3,
        finalY + 5 * lineSpacing
      );
      pdf.setFont("helvetica", "normal");
      pdf.text(
        informacionGlobal.getAttribute("Año"),
        pdf.getTextWidth(
          "Periodicidad: " +
            getPeriodicidadDescription(informacionGlobal.getAttribute("Periodicidad")) +
            "Mes: " +
            getMesDescription(informacionGlobal.getAttribute("Meses")) +
            "Año: "
        ) +
          100 +
          extraSpacing * 4,
        finalY + 5 * lineSpacing
      );
    }
    // Calcular el espacio adicional necesario para los UUIDs relacionados
    let additionalSpacing = cfdiBlockSpacing;
    if (cfdiRelacionadosNodes.length > 0) {
      const tipoRelacion = CfdiRelacionados?.getAttribute("TipoRelacion") || "";

      pdf.setFont("helvetica", "bold");
      pdf.text(`CFDI Relacionados (Tipo: ${tipoRelacion}):`, 100, finalY + 6 * lineSpacing, { align: "left" });

      // Mostrar todos los UUIDs relacionados
      let currentY = finalY + 7 * lineSpacing;
      cfdiRelacionadosNodes.forEach((relacionado, index) => {
        const uuidRelacionado = relacionado.getAttribute("UUID");
        if (uuidRelacionado) {
          pdf.setFont("helvetica", "normal");
          pdf.text(`${index + 1}. ${uuidRelacionado}`, 100, currentY, { align: "left" });
          currentY += lineSpacing;
        }
      });
    }

    // ajustando el la informacion de la izquierda


    //cantidad con letra
    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text("Cantidad con letra:", 12, finalY); // Coloca el texto en negrita
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    pdf.text(totalFactura, 12, finalY + lineSpacing);

    //folio fiscal
    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text("Folio Fiscal:", 12, finalY + 2 * lineSpacing); // Coloca el texto en negrita
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    pdf.text(uuid, 12, finalY + 3 * lineSpacing);

    //fecha certificacion
    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text("Fecha de Certificación:", 12, finalY + lineSpacing + lineSpacing + lineSpacing + lineSpacing); // Coloca el texto en negrita
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    pdf.text(fechaTimbrado || "", 12, finalY + lineSpacing + lineSpacing + lineSpacing + lineSpacing + lineSpacing);

    //No. de serie del certificado Digital - Ajustar posición con el espacio adicional
    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text(
      "No. de serie del certificado Digital:",
      12,
      finalY + lineSpacing + lineSpacing + lineSpacing + lineSpacing + lineSpacing + lineSpacing + additionalSpacing
    ); // Coloca el texto en negrita
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    pdf.text(
      comprobante.getAttribute("NoCertificado") || "",
      12,
      finalY + lineSpacing + lineSpacing + lineSpacing + lineSpacing + lineSpacing + lineSpacing + lineSpacing + additionalSpacing
    );

    //No. de serie del certificado SAT - Ajustar posición con el espacio adicional
    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text(
      "No. de serie del certificado SAT:",
      12,
      finalY +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        additionalSpacing
    ); // Coloca el texto en negrita
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    pdf.text(
      noCertificadoSAT || "",
      12,
      finalY +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        additionalSpacing
    );

    //Sello digital del CFDI - Ajustar posición con el espacio adicional
    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text(
      "Sello digital del CFDI:",
      12,
      finalY +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        additionalSpacing
    ); // Coloca el texto en negrita
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    pdf.text(
      comprobante.getAttribute("Sello") || "",
      12,
      finalY +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        lineSpacing +
        additionalSpacing,
      { maxWidth: 180 }
    );

    //Sello digital del SAT - Ajustar posición con el espacio adicional
    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text("Sello digital del SAT:", 12, finalY + lineSpacing + 70 + additionalSpacing); // Coloca el texto en negrita
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    pdf.text(selloSAT, 12, finalY + lineSpacing + 75 + additionalSpacing, { maxWidth: 180 });

    //cadena original - Ajustar posición con el espacio adicional
    pdf.setFont("helvetica", "bold"); // Cambia la fuente a negrita
    pdf.text("Cadena original del complemento de certificación digital del SAT:", 12, finalY + lineSpacing + 95 + additionalSpacing); // Coloca el texto en negrita
    pdf.setFont("helvetica", "normal"); // Cambia la fuente de nuevo a normal
    const qrXPosition = 12; // Posición X del QR
    const qrYPosition = finalY + lineSpacing + 100 + additionalSpacing; // Posición Y del QR ajustada

    // Añadir el código QR en la posición definida
    pdf.addImage(qrDataUrl, "PNG", qrXPosition, qrYPosition + 10, 30, 30);

    // Ajustar la posición del texto al lado del QR
    const textXPosition = qrXPosition + 35; // Añade el ancho del QR (50) + margen de 5
    pdf.text(cadenaLines, textXPosition, qrYPosition + 5, {
      align: "left",
    });


    

    // Eliminar los contenedores temporales
    document.body.removeChild(headerContainer);
    document.body.removeChild(footerContainer);
document.body.style.backgroundColor = originalBodyBg;

  
  return pdf.output("blob");
}
