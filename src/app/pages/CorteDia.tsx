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
        usr: session?.user?.id || session?.id || "",
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
          text: data?.mensaje || "El corte se ha cerrado y procesado en tesorería de forma exitosa.",
          icon: "success",
          allowOutsideClick: false,
        }).then(() => {
          logout();
          navigate(routes.login);
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
