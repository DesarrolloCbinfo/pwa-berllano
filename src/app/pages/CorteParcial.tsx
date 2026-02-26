import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useConsumoApi from "../../hooks/useConsumoApi";
import useSession from "../../hooks/useSession";
import { routes } from "../../utils/Routes";

interface InfoCorteItem {
  descripcion: string;
  total: number;
}

interface CorteData {
  corte_maximo: number;
  corte_parcial_maximo: number;
}

export default function CorteParcial() {
  const { consumoApi } = useConsumoApi();
  const session = useSession();
  const navigate = useNavigate();

  const [ultimoCorte, setUltimoCorte] = useState<CorteData | null>(null);
  const [infoCorte, setInfoCorte] = useState<InfoCorteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const maxIntentos = 3;

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

  // Obtener información del corte
  const fetchInfoCorte = async () => {
    if (!ultimoCorte) return;
    
    try {
      setLoading(true);
      const res = await consumoApi.get(
        "/api/PuntoDeVenta/sp_bw_get_info_corte",
        {
          params: {
            sucursal: session?.sucursal,
            caja: 1,
            corte: ultimoCorte.corte_maximo,
            corte_parcial: ultimoCorte.corte_parcial_maximo,
          },
        }
      );

      setInfoCorte(res.data);
    } catch (err) {
      console.error("Error al obtener información del corte:", err);
      Swal.fire("Error", "No se pudo cargar la información del corte", "error");
    } finally {
      setLoading(false);
    }
  };



  // Calcular total de efectivo vendido
  const totalEfectivo = useMemo(() => {
    const efectivoItem = infoCorte.find(
      (item) => item.descripcion === "Efectivo"
    );
    return efectivoItem ? Number(efectivoItem.total) : 0;
  }, [infoCorte]);

  // Calcular total de retiros
  const totalRetiros = useMemo(() => {
    const retiroItem = infoCorte.find(
      (item) => item.descripcion === "retiro"
    );
    return retiroItem ? Number(retiroItem.total) : 0;
  }, [infoCorte]);

  // Calcular monto de medios de pago no efectivo
  const montoNoEfectivo = useMemo(() => {
    return infoCorte
      .filter(
        (item) =>
          item.descripcion !== "Efectivo" && item.descripcion !== "retiro"
      )
      .reduce((acc, item) => acc + Number(item.total), 0);
  }, [infoCorte]);

  // Calcular total de venta (todos los pagos) menos retiros
  const montoCorte = useMemo(() => {
    const totalVentas = infoCorte
      .filter((item) => item.descripcion !== "retiro")
      .reduce((acc, item) => acc + Number(item.total), 0);
    return totalVentas - totalRetiros;
  }, [infoCorte, totalRetiros]);

  // Filtrar medios de pago no efectivo para la tabla
  const mediosPagoTabla = useMemo(() => {
    return infoCorte.filter(
      (item) =>
        item.descripcion !== "Efectivo" && item.descripcion !== "retiro"
    );
  }, [infoCorte]);

  // Verificar si los totales coinciden
  const totalesCoinciden = useMemo(() => {
    const r = Number(totalRetiros.toFixed(2));
    const e = Number(totalEfectivo.toFixed(2));
    return r === e && r > 0;
  }, [totalRetiros, totalEfectivo]);

  // Calcular efectivo teórico (lo que debería haber en caja)
  const efectivoTeorico = useMemo(() => {
    return Number((totalEfectivo - totalRetiros).toFixed(2));
  }, [totalEfectivo, totalRetiros]);

  // Pedir efectivo real al usuario
  const pedirEfectivo = async () => {
    const result = await Swal.fire({
      title: "Efectivo en cajón",
      input: "number",
      inputLabel: "Teclea el efectivo real en el cajón",
      inputAttributes: {
        step: "0.01",
        min: "0",
      },
      showCancelButton: true,
      confirmButtonText: "Validar",
      cancelButtonText: "Cancelar",
      allowOutsideClick: false,
      inputValidator: (value) => {
        if (!value || Number(value) < 0) {
          return "Ingresa un monto válido";
        }
        return null;
      },
    });

    if (!result.isConfirmed) return null;

    return Number(Number(result.value).toFixed(2));
  };

  // Finalizar corte
  const finalizarCorte = async () => {
    const efectivoReal = await pedirEfectivo();
    if (efectivoReal === null) return;

    const nuevosIntentos = intentos + 1;
    setIntentos(nuevosIntentos);

    const coincide = efectivoReal === efectivoTeorico;

    // No coincide
    if (!coincide) {
      // Máximo de intentos
      if (nuevosIntentos >= maxIntentos) {
        Swal.fire({
          title: "Corte con diferencia",
          html: `
            <p>Se alcanzó el número máximo de intentos.</p>
            <p><strong>Efectivo teórico:</strong> $${efectivoTeorico.toFixed(
              2
            )}</p>
            <p><strong>Efectivo capturado:</strong> $${efectivoReal.toFixed(
              2
            )}</p>
          `,
          icon: "warning",
          confirmButtonText: "Cerrar corte",
          allowOutsideClick: false,
        }).then(() => {
          cerrarCorte(efectivoReal);
        });

        return;
      }

      // Aún hay intentos
      Swal.fire({
        title: "No coincide el efectivo",
        html: `
          <p><strong>Efectivo teórico:</strong> $${efectivoTeorico.toFixed(2)}</p>
          <p><strong>Efectivo capturado:</strong> $${efectivoReal.toFixed(2)}</p>
          <p><strong>Intentos restantes:</strong> ${maxIntentos - nuevosIntentos}</p>
        `,
        icon: "error",
        confirmButtonText: "Intentar de nuevo",
        allowOutsideClick: false,
      });

      return;
    }

    // Coincide
    cerrarCorte(efectivoReal);
  };

  // Cerrar corte en la API
  const cerrarCorte = async (ultimoRetiro: number) => {
    if (!ultimoCorte) return;
    
    try {
      setLoading(true);

      const res = await consumoApi.post(
        "/api/PuntoDeVenta/sp_bw_pos_cierra_corte",
        null,
        {
          params: {
            suc: session?.sucursal,
            corte: ultimoCorte.corte_maximo,
            corte_parcial: ultimoCorte.corte_parcial_maximo,
            caja: 1,
            monto: montoCorte,
            corte_final: false,
            usr: session?.id,
            cia: 1,
            ultimo_retiro: ultimoRetiro,
          },
        }
      );

      const data = Array.isArray(res.data) ? res.data[0] : res.data;

      if (data?.codigo === 0) {
        Swal.fire(
          "Corte realizado",
          data?.mensaje1 || "Corte parcial registrado",
          "success"
        ).then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire(
          "Error",
          data?.mensaje1 || "No se pudo cerrar el corte",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo cerrar el corte", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cancelar corte
  const cancelarCorte = () => {
    Swal.fire({
      title: "¿Cancelar corte?",
      text: "Esta acción no guardará los cambios",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, continuar",
    }).then((result) => {
      if (result.isConfirmed) {
        window.history.back();
      }
    });
  };

  // Efectos para cargar datos
  useEffect(() => {
    if (session?.sucursal) {
      fetchUltimoCorte();
    }
  }, [session?.sucursal]);

  useEffect(() => {
    if (ultimoCorte?.corte_maximo) {
      fetchInfoCorte();
      setIntentos(0);
    }
  }, [ultimoCorte?.corte_maximo, ultimoCorte?.corte_parcial_maximo]);

  // Formatear fecha actual
  const fechaActual = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: "auto" }}>
      <Typography
        variant="h3"
        sx={{ mb: 1, fontWeight: "bold", textAlign: "center", color: "primary.main" }}
      >
        Módulo de Corte de caja
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
            <strong>Corte parcial:</strong>{" "}
            {ultimoCorte?.corte_parcial_maximo ?? "N/A"}
          </Typography>
        </Box>
      </Paper>

      {/* Medios de pago */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Medios de pago
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell>Tipo Pago</TableCell>
                  <TableCell align="right">Entregado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mediosPagoTabla.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell align="right">
                      ${Number(item.total).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {mediosPagoTabla.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      No hay medios de pago registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Totales */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Total de Retiros: ${totalRetiros.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Total de Efectivo: ${totalEfectivo.toFixed(2)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {!totalesCoinciden && totalRetiros > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ Los totales no coinciden. Intentos restantes:{" "}
              {maxIntentos - intentos}
            </Alert>
          )}

          {totalesCoinciden && totalRetiros === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ No se han registrado retiros.
            </Alert>
          )}

          {totalesCoinciden && totalRetiros > 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✓ Los totales coinciden. Puedes finalizar el corte.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Botones */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={finalizarCorte}
          disabled={loading}
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

        {!totalesCoinciden && totalRetiros > 0 && (
          <Button
            variant="outlined"
            color="warning"
            onClick={() => navigate(routes.retiros)}
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
            Ir a Retiros
          </Button>
        )}

        <Button
          variant="outlined"
          color="secondary"
          onClick={cancelarCorte}
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
          CORTE PARCIAL, {(session?.nombre || "ADMIN").toUpperCase()},{" "}
          {fechaActual}, USR: {(session?.nombre || "ADMIN").toUpperCase()}
        </strong>
      </Typography>
    </Box>
  );
}
