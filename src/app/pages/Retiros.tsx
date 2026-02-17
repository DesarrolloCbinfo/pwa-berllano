import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Swal from "sweetalert2";
import useConsumoApi from "../../hooks/useConsumoApi";
import useSession from "../../hooks/useSession";

// Tipo para la respuesta del corte actual
type CorteActual = {
  corte_maximo: number;
  corte_parcial_maximo: number;
};

const denominaciones = [
  1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1
];

export default function Retiros() {
  const { consumoApi } = useConsumoApi();
  const session = useSession();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [dataCorteActual, setDataCorteActual] = useState<CorteActual | null>(null);
  const [retiros, setRetiros] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Inicializar retiros en 0
  useEffect(() => {
    const init: Record<number, number> = {};
    denominaciones.forEach(d => init[d] = 0);
    setRetiros(init);
  }, []);

  // Cargar corte actual
  useEffect(() => {
    fetchCorteActual();
  }, [session?.sucursal]);

  const fetchCorteActual = async () => {
    if (!session?.sucursal) return;
    
    try {
      const res = await consumoApi.get(
        `/api/PuntoDeVenta/get_corte_actual?caja=1&sucursal=${session.sucursal}`
      );
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDataCorteActual(res.data[0]);
      }
    } catch (error) {
      console.error("Error cargando corte actual:", error);
    }
  };

  const handleCantidadChange = (denominacion: number, value: number) => {
    setRetiros(prev => ({
      ...prev,
      [denominacion]: Math.max(0, value)
    }));
  };

  const handleIncrement = (denominacion: number) => {
    setRetiros(prev => ({
      ...prev,
      [denominacion]: (prev[denominacion] || 0) + 1
    }));
  };

  const handleDecrement = (denominacion: number) => {
    setRetiros(prev => ({
      ...prev,
      [denominacion]: Math.max(0, (prev[denominacion] || 0) - 1)
    }));
  };

  const totalRetiro = useMemo(() => {
    return denominaciones.reduce(
      (acc, d) => acc + d * (retiros[d] || 0),
      0
    );
  }, [retiros]);

  const RegistraRetiro = async () => {
    if (!session) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No hay sesión activa",
        confirmButtonColor: "#d33",
      });
      return;
    }

    if (!dataCorteActual) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener la información del corte actual",
        confirmButtonColor: "#d33",
      });
      return;
    }

    if (totalRetiro === 0) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "El total del retiro debe ser mayor a 0",
        confirmButtonColor: "#f8bb86",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await consumoApi.post(
        "/api/PuntoDeVenta/sp_kiosko_registra_retiro",
        null,
        {
          params: {
            caja: 1,
            sucursal: session.sucursal,
            corte: dataCorteActual.corte_maximo,
            corte_parcial: dataCorteActual.corte_parcial_maximo,
            retiro: totalRetiro,
            usuario: `'${session.claveEmpleado || session.id || "00001"}'`,
            observaciones: observaciones.trim() || "sin observacion registrada",
          },
        }
      );

      const resultado = Array.isArray(response.data) && response.data.length > 0 
        ? response.data[0] 
        : response.data;

      if (resultado.codigo === 0) {
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: resultado.mensaje1 || "Retiro registrado correctamente",
          confirmButtonColor: "#3085d6",
        });

        // Limpiar formulario
        const init: Record<number, number> = {};
        denominaciones.forEach(d => init[d] = 0);
        setRetiros(init);
        setObservaciones("");
        
        // Recargar corte actual
        fetchCorteActual();
      } else {
        Swal.fire({
          icon: "warning",
          title: "Atención",
          text: resultado.mensaje1 || "No se pudo registrar el retiro",
          confirmButtonColor: "#f8bb86",
        });
      }
    } catch (error) {
      console.error("Error al registrar retiro:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al registrar el retiro. Por favor, intenta nuevamente.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDenominacion = (d: number) => {
    if (d >= 1) {
      return `$${d.toFixed(0)}`;
    }
    return `$${d.toFixed(1)}`;
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold", textAlign: "center" }}>
        Módulo de
      </Typography>
      <Typography variant="h3" sx={{ mb: 3, fontWeight: "bold", textAlign: "center", color: "primary.main" }}>
        Retiros del Corte
      </Typography>

      {/* Info del corte */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={4}>
            <Typography align="center">
              <strong>Caja:</strong> 1
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography align="center">
              <strong>Corte:</strong> {dataCorteActual?.corte_maximo ?? "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography align="center">
              <strong>Corte Parcial:</strong> {dataCorteActual?.corte_parcial_maximo ?? "N/A"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Grid de denominaciones */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Desglose por Denominación
          </Typography>
          
          {denominaciones.map((d, index) => (
            <Box key={d}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.5,
                  gap: 2,
                }}
              >
                {/* Denominación */}
                <Typography
                  variant="h6"
                  sx={{
                    minWidth: 80,
                    fontWeight: "bold",
                    color: d >= 20 ? "success.main" : "warning.main",
                  }}
                >
                  {formatDenominacion(d)}
                </Typography>

                {/* Operador X */}
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  X
                </Typography>

                {/* Controles de cantidad */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleDecrement(d)}
                    sx={{
                      bgcolor: "grey.100",
                      border: "1px solid",
                      borderColor: "grey.300",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>

                  <TextField
                    type="number"
                    value={retiros[d] || 0}
                    onChange={(e) => handleCantidadChange(d, parseInt(e.target.value) || 0)}
                    inputProps={{
                      min: 0,
                      style: { textAlign: "center" },
                    }}
                    sx={{ width: 70 }}
                    size="small"
                  />

                  <IconButton
                    size="small"
                    onClick={() => handleIncrement(d)}
                    sx={{
                      bgcolor: "grey.100",
                      border: "1px solid",
                      borderColor: "grey.300",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Operador = */}
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  =
                </Typography>

                {/* Resultado */}
                <Typography
                  variant="h6"
                  sx={{
                    minWidth: 100,
                    textAlign: "right",
                    fontWeight: "bold",
                    color: (retiros[d] || 0) > 0 ? "primary.main" : "text.secondary",
                  }}
                >
                  ${(d * (retiros[d] || 0)).toFixed(2)}
                </Typography>
              </Box>
              {index < denominaciones.length - 1 && <Divider />}
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Total */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 3,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Total Egreso:</Typography>
        <Typography variant="h4" fontWeight="bold">
          ${totalRetiro.toFixed(2)}
        </Typography>
      </Paper>

      {/* Observaciones */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
            Observación:
          </Typography>
          <TextField
            fullWidth
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ingrese observaciones del retiro"
            variant="outlined"
            size={isMobile ? "medium" : "small"}
          />
        </CardContent>
      </Card>

      {/* Botones */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={RegistraRetiro}
          disabled={loading || totalRetiro === 0}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
            minWidth: 120,
          }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => window.history.back()}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
            minWidth: 120,
          }}
        >
          Salir
        </Button>
      </Box>
    </Box>
  );
}
