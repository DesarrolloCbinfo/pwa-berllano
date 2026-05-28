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

interface CorteData {
  corte_maximo: number;
  corte_parcial_maximo: number;
}

export default function CorteDia() {
  const { consumoApi } = useConsumoApi();
  const session = useSession();
  const navigate = useNavigate();

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
          window.location.reload();
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
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: "auto" }}>
      <Typography
        variant="h3"
        sx={{ mb: 1, fontWeight: "bold", textAlign: "center", color: "primary.main" }}
      >
        Módulo de Corte de Día
      </Typography>

      {/* Info del corte */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-around",
            gap: 2,
          }}
        >
          <Typography>
            <strong>Sucursal:</strong> {session?.dSucursal || session?.sucursal}
          </Typography>
          <Typography>
            <strong>Corte:</strong> {ultimoCorte?.corte_maximo ?? "N/A"}
          </Typography>
          <Typography>
            <strong>Corte parcial:</strong> {ultimoCorte?.corte_parcial_maximo ?? "N/A"}
          </Typography>
        </Box>
      </Paper>

      {/* Resumen del corte */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
            Resumen del Corte
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="body1" color="text.secondary">
                Sucursal
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {session?.dSucursal || session?.sucursal || "N/A"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" color="text.secondary">
                Corte
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {ultimoCorte?.corte_maximo ?? "N/A"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" color="text.secondary">
                Corte Parcial
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {ultimoCorte?.corte_parcial_maximo ?? "N/A"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" color="text.secondary">
                Caja
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                1
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" color="text.secondary">
                Fecha
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {fechaActual}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" color="text.secondary">
                Hora
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {horaActual}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Botones */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={confirmarCerrar}
          disabled={loading || !ultimoCorte}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
            minWidth: 150,
          }}
        >
          {loading ? "Procesando..." : "Finalizar Corte"}
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={cancelar}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
            minWidth: 150,
          }}
        >
          Cancelar
        </Button>
      </Box>

      {/* Footer */}
      <Typography
        variant="body2"
        sx={{ textAlign: "center", color: "text.secondary", mt: 2 }}
      >
      </Typography>
    </Box>
  );
}
