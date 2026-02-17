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

      // API para cerrar corte final - es un GET
      const res = await consumoApi.get(
        "/api/PuntoDeVenta/sp_bw_pos_cierra_corte_final",
        {
          params: {
            sucursal: session?.sucursal,
            corte: ultimoCorte.corte_maximo,
            corte_parcial: ultimoCorte.corte_parcial_maximo,
            caja: 1,
            usr: session?.id,
          },
        }
      );

      const data = Array.isArray(res.data) ? res.data[0] : res.data;

      if (data?.codigo === 0) {
        Swal.fire({
          title: "Corte de día realizado",
          html: `
            <p style="font-size: 18px; margin: 10px 0;"><strong>${data?.mensaje || "Corte final realizado con éxito"}</strong></p>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Total del corte:</strong> $${Number(data?.total_corte || 0).toFixed(2)}</p>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Efectivo:</strong> $${Number(data?.efectivo || 0).toFixed(2)}</p>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Tarjeta:</strong> $${Number(data?.tarjeta1 || 0).toFixed(2)}</p>
          `,
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
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error de comunicación con el servidor", "error");
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
        <strong>
          CORTE DE DÍA, {(session?.nombre || "ADMIN").toUpperCase()},{" "}
          {fechaActual}, USR: {(session?.nombre || "ADMIN").toUpperCase()}
        </strong>
      </Typography>
    </Box>
  );
}
