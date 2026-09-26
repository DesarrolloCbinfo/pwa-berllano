import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useConsumoApi from "../../hooks/useConsumoApi";
import useSession from "../../hooks/useSession";
import { routes } from "../../utils/Routes";
import { useAuth } from "../../context/AuthContext";

interface CorteData {
  corte_maximo: number;
  corte_parcial_maximo: number;
}

export default function CorteDia() {
  const { consumoApi } = useConsumoApi();
  const session = useSession();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [ultimoCorte, setUltimoCorte] = useState<CorteData | null>(null);
  const [loading, setLoading] = useState(false);

  const fechaActual = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const horaActual = new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Obtener el último corte
  const fetchUltimoCorte = async () => {
    try {
      setLoading(true);
      const res = await consumoApi.get(
        "/api/PuntoDeVenta/get_corte_actual",
        {
          params: {
            sucursal: session?.sucursal,
            caja: 1,
          },
        }
      );

      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setUltimoCorte(data[0]);
      }
    } catch (error) {
      console.error("Error al obtener el último corte:", error);
      Swal.fire("Error", "No se pudo obtener información del corte", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cerrar corte del día - solo presionar botón
  const cerrarCorteDia = async () => {
    if (!ultimoCorte) {
      Swal.fire("Error", "No se encontró información del corte", "error");
      return;
    }

    try {
      setLoading(true);

      const requestBody = {
        sucursal: session?.sucursal || 0,
        corte: ultimoCorte.corte_maximo,
        corteParcial: ultimoCorte.corte_parcial_maximo,
        caja: 1,
        monto: 0, // El SP calculará el monto internamente
        corteFinal: true, // Corte de día es corte final
        usr: session?.id || "",
        cia: 1,
        ultimoRetiro: 0
      };

      console.log("Datos enviados al cerrar corte:", requestBody);

      // API para cerrar corte final - POST con body
      const res = await consumoApi.post(
        "/api/cortedia/cerrar",
        requestBody
      );

      const data = res.data;

      if (data?.corteProcesado || data?.mensaje) {
        Swal.fire({
          title: "Corte de día realizado",
          text: "El corte se ha cerrado. ¿Desea imprimir el reporte de las ventas de hoy?",
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Sí",
          cancelButtonText: "No",
          allowOutsideClick: false,
        }).then((result) => {
          if (result.isConfirmed) {
            imprimirReporteVentas();
          } else {
            logout();
            navigate(routes.login);
          }
        });
      } else {
        Swal.fire(
          "Error",
          data?.mensaje || "No fue posible realizar el corte",
          "error"
        );
      }
    } catch (err: any) {
      console.error("Error completo:", err);
      console.error("Respuesta del servidor:", err?.response);
      console.error("Data del error:", err?.response?.data);
      
      const errorMessage = err?.response?.data?.mensaje 
        || err?.response?.data?.detalle 
        || err?.response?.data
        || err?.message 
        || "Error de comunicación con el servidor";
      
      Swal.fire({
        icon: "error",
        title: "Error al cerrar el corte",
        html: `<p>${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}</p>`,
        footer: err?.response?.status ? `Código de error: ${err.response.status}` : ''
      });
    } finally {
      setLoading(false);
    }
  };

  const formatearFechaReporte = (fecha: Date) => {
    const meses = [
      "ene", "feb", "mar", "abr", "may", "jun",
      "jul", "ago", "sep", "oct", "nov", "dic",
    ];
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = meses[fecha.getMonth()];
    const anio = String(fecha.getFullYear()).slice(-2);
    return `${dia}-${mes}-${anio}`;
  };

  const formatoMoneda = (valor: unknown) => {
    const num = Number(valor);
    if (Number.isNaN(num)) return "-";
    return num.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const escaparHtml = (texto: string) => {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  };

  const construirHtmlReporte = (rows: Array<Record<string, unknown>>) => {
    const fechaInicio = formatearFechaReporte(new Date());
    const fechaFin = fechaInicio;

    let html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Detalle de Ventas por Estilista</title>
          <style>
            @page { size: letter portrait; margin: 1cm; }
            body { font-family: Arial, sans-serif; font-size: 9pt; color: #000; }
            .header { text-align: left; margin-bottom: 10px; }
            .header h2 { margin: 0 0 4px 0; font-size: 12pt; font-weight: bold; }
            .header .sub { font-size: 9pt; }
            .sucursal, .estilista { font-weight: bold; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            th, td { padding: 3px 5px; text-align: left; vertical-align: top; }
            th { border-bottom: 1px solid #000; font-weight: bold; }
            .num { text-align: right; }
            .total { font-weight: bold; border-top: 1px solid #000; }
            .total-dia { font-weight: bold; border-top: 2px solid #000; font-size: 10pt; }
            .section { page-break-inside: avoid; }
          </style>
        </head>
        <body onafterprint="window.close()">
          <div class="header">
            <h2>Detalle de Ventas por Estilista</h2>
            <div class="sub">Desde ${fechaInicio} hasta ${fechaFin}</div>
          </div>
    `;

    let currentSucursal = "";
    let currentEstilista = "";

    for (const row of rows) {
      const sucursal = String(row.Sucursal ?? "");
      const estilista = String(row.Estilista ?? "");
      const cliente = String(row.Cliente ?? "");

      if (cliente === "Total del día") {
        if (currentEstilista) {
          html += `</tbody></table></div>`;
          currentEstilista = "";
        }
        html += `
          <table>
            <tr class="total-dia">
              <td colspan="5"></td>
              <td class="num">Total del día</td>
              <td class="num">${formatoMoneda(row.Importe)}</td>
            </tr>
          </table>
        `;
        continue;
      }

      if (cliente === "Total") {
        html += `
          <tr class="total">
            <td colspan="5"></td>
            <td class="num">Total</td>
            <td class="num">${formatoMoneda(row.Importe)}</td>
          </tr>
        `;
        continue;
      }

      if (sucursal && sucursal !== currentSucursal) {
        currentSucursal = sucursal;
        html += `<div class="sucursal">${escaparHtml(sucursal)}</div>`;
      }

      if (estilista && estilista !== currentEstilista) {
        if (currentEstilista) {
          html += `</tbody></table></div>`;
        }
        currentEstilista = estilista;
        html += `<div class="section"><div class="estilista">${escaparHtml(estilista)}</div>`;
        html += `
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th class="num">Cant</th>
                <th class="num">Importe</th>
                <th class="num">Total</th>
                <th class="num">Visitas</th>
              </tr>
            </thead>
            <tbody>
        `;
      }

      html += `
        <tr>
          <td>${escaparHtml(String(row.Fecha ?? "").split("T")[0])}</td>
          <td>${escaparHtml(String(row.Cliente ?? ""))}</td>
          <td>${escaparHtml(String(row.Descripcion ?? ""))}</td>
          <td class="num">${escaparHtml(String(row.Cant ?? ""))}</td>
          <td class="num">${formatoMoneda(row.Importe)}</td>
          <td class="num">${formatoMoneda(row.Importe)}</td>
          <td class="num">${escaparHtml(String(row.Visitas ?? ""))}</td>
        </tr>
      `;
    }

    if (currentEstilista) {
      html += `</tbody></table></div>`;
    }

    html += `
        <script>
          window.addEventListener('afterprint', function () { window.close(); });
        </script>
      </body>
      </html>
    `;

    return html;
  };

  const imprimirReporteVentas = async () => {
    if (!session?.sucursal) {
      Swal.fire("Error", "No se encontró la sucursal de la sesión.", "error");
      logout();
      navigate(routes.login);
      return;
    }

    const hoy = new Date();
    const hoyFormateado = formatearFechaReporte(hoy);

    // Se abre inmediatamente para evitar el bloqueo de ventanas emergentes.
    const ventana = window.open("", "_blank");
    if (!ventana) {
      Swal.fire("Aviso", "Permite las ventanas emergentes para imprimir el reporte.", "warning");
      logout();
      navigate(routes.login);
      return;
    }

    ventana.document.open();
    ventana.document.write(`
      <html>
        <head><meta charset="utf-8" /><title>Cargando reporte...</title></head>
        <body><p>Cargando reporte de ventas...</p></body>
      </html>
    `);
    ventana.document.close();

    try {
      const res = await consumoApi.get(
        "/api/CatReportes/sp_ventas_estilista_corte_dia",
        {
          params: {
            sucursal: session.sucursal,
            fecha_inicio: hoyFormateado,
            fecha_fin: hoyFormateado,
          },
        }
      );

      const rows = Array.isArray(res.data) ? (res.data as Array<Record<string, unknown>>) : [];

      ventana.document.open();
      ventana.document.write(construirHtmlReporte(rows));
      ventana.document.close();
      ventana.focus();
      ventana.print();

      ventana.onafterprint = () => {
        ventana.close();
        logout();
        navigate(routes.login);
      };
    } catch (err: any) {
      ventana.close();
      console.error("Error al consultar reporte de ventas:", err);
      Swal.fire(
        "Error",
        err.response?.data?.mensaje || "No fue posible obtener el reporte de ventas.",
        "error"
      );
      logout();
      navigate(routes.login);
    }
  };

  // Confirmar antes de cerrar
  const confirmarCerrar = () => {
    Swal.fire({
      title: "¿Finalizar corte de día?",
      text: "Esta acción cerrará el corte y no podrá revertirse",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        cerrarCorteDia();
      }
    });
  };

  // Cancelar
  const cancelar = () => {
    navigate(-1);
  };

  // Cargar datos al iniciar
  useEffect(() => {
    if (session?.sucursal) {
      fetchUltimoCorte();
    }
  }, [session?.sucursal]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: "auto", fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <Typography
        variant="h3"
        sx={{ mb: 0.5, fontWeight: "bold", textAlign: "center", color: "primary.main" }}
      >
        Módulo de Corte de Día
      </Typography>

      {/* Info del corte */}
      <Paper elevation={2} sx={{ p: 1, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-around",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: "0.85rem" }}>
            <strong>Sucursal:</strong> {session?.dSucursal || session?.sucursal}
          </Typography>
          <Typography sx={{ fontSize: "0.85rem" }}>
            <strong>Corte:</strong> {ultimoCorte?.corte_maximo ?? "N/A"}
          </Typography>
          <Typography sx={{ fontSize: "0.85rem" }}>
            <strong>Corte parcial:</strong> {ultimoCorte?.corte_parcial_maximo ?? "N/A"}
          </Typography>
        </Box>
      </Paper>

      {/* Resumen del corte */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 1.5 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: "bold" }}>
            Resumen del Corte
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1.5,
            }}
          >
            {[
              { label: "Sucursal", value: session?.dSucursal || session?.sucursal || "N/A" },
              { label: "Corte", value: ultimoCorte?.corte_maximo ?? "N/A" },
              { label: "Corte Parcial", value: ultimoCorte?.corte_parcial_maximo ?? "N/A" },
              { label: "Caja", value: "1" },
              { label: "Fecha", value: fechaActual },
              { label: "Hora", value: horaActual },
            ].map((item, idx) => (
              <Box key={idx}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontWeight: "bold", fontSize: "0.95rem" }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ my: 1 }} />

      {/* Botones */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={confirmarCerrar}
          disabled={loading || !ultimoCorte}
          sx={{
            px: 3,
            py: 1,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.9rem",
            minWidth: 120,
          }}
        >
          {loading ? "Procesando..." : "Finalizar Corte"}
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={cancelar}
          sx={{
            px: 3,
            py: 1,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.9rem",
            minWidth: 120,
          }}
        >
          Cancelar
        </Button>
      </Box>

    </Box>
  );
}
