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
  Dialog,
  DialogContent,
  TextField,
  IconButton,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import useConsumoApi from "../../hooks/useConsumoApi";
import useSession from "../../hooks/useSession";
import { routes } from "../../utils/Routes";
import { useAuth } from "../../context/AuthContext";

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
  const { logout } = useAuth();

  const [ultimoCorte, setUltimoCorte] = useState<CorteData | null>(null);
  const [infoCorte, setInfoCorte] = useState<InfoCorteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const maxIntentos = 3;
  
  // Estados para modal de retiro de fondo
  const [modalRetiroAbierto, setModalRetiroAbierto] = useState(false);
  const [retirosModal, setRetirosModal] = useState<Record<number, number>>({});
  const [observacionModal, setObservacionModal] = useState<string>("");
  const [valesModal, setValesModal] = useState<number>(0);
  
  // Estados para modal de último retiro
  const [modalUltimoRetiroAbierto, setModalUltimoRetiroAbierto] = useState(false);
  const [retirosUltimoModal, setRetirosUltimoModal] = useState<Record<number, number>>({});
  const [observacionUltimoModal, setObservacionUltimoModal] = useState<string>("");
  const [valesUltimoModal, setValesUltimoModal] = useState<number>(0);
  const [montoEsperadoFormularioA, setMontoEsperadoFormularioA] = useState<number>(0);
  const [montoObligatorio, setMontoObligatorio] = useState<number>(0);
  const [ultimoRetiroCompletado, setUltimoRetiroCompletado] = useState<boolean>(false);
  
  const denominaciones = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];

  // Inicializar retiros del modal
  useEffect(() => {
    const init: Record<number, number> = {};
    denominaciones.forEach(d => init[d] = 0);
    setRetirosModal(init);
    setRetirosUltimoModal(init);
  }, []);

  // Cargar el monto esperado del módulo anterior desde la BD
  useEffect(() => {
    const cargarMontoAnterior = async () => {
      try {
        const params = {
          cia: 1,
          sucursal: session?.sucursal || 0,
          corte: ultimoCorte?.corte_maximo || 0,
          corteParcial: ultimoCorte?.corte_parcial_maximo || 0,
          caja: 1
        };
        
        console.log("Parámetros enviados al GET:", params);
        
        const respuesta = await axios.get('https://localhost:5001/api/cortedia/obtener-monto-esperado', {
          params
        });
        
        console.log("Monto recuperado de BD:", respuesta.data);

        if (respuesta.data) {
          const montoDetectado = respuesta.data.montoEsperado ?? respuesta.data.monto ?? 0;
          console.log("Monto detectado:", montoDetectado);
          setMontoObligatorio(montoDetectado);
          setMontoEsperadoFormularioA(montoDetectado);
        }
      } catch (error: any) {
        console.error("Error al obtener el monto del módulo anterior:", error);
        console.error("Detalles del error:", error?.response?.data);
        setMontoObligatorio(0);
        setMontoEsperadoFormularioA(0);
      }
    };

    if (ultimoCorte) {
      cargarMontoAnterior();
    }
  }, [ultimoCorte, session?.sucursal]);

  // Calcular total del retiro en el modal
  const totalRetiroModal = useMemo(() => {
    return denominaciones.reduce(
      (acc, d) => acc + d * (retirosModal[d] || 0),
      0
    );
  }, [retirosModal]);

  // Calcular total del último retiro en el modal
  const totalUltimoRetiroModal = useMemo(() => {
    return denominaciones.reduce(
      (acc, d) => acc + d * (retirosUltimoModal[d] || 0),
      0
    );
  }, [retirosUltimoModal]);

  // Abrir modal de retiro de fondo
  const abrirModalRetiro = () => {
    // Resetear valores
    const init: Record<number, number> = {};
    denominaciones.forEach(d => init[d] = 0);
    setRetirosModal(init);
    setObservacionModal("");
    setValesModal(0);
    setModalRetiroAbierto(true);
  };

  // Cerrar modal
  const cerrarModalRetiro = () => {
    setModalRetiroAbierto(false);
  };

  // Guardar retiro de fondo
  const guardarRetiroFondo = async () => {
    if (totalRetiroModal === 0) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "El total del retiro debe ser mayor a 0",
      });
      return;
    }

    if (!ultimoCorte) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró información del corte",
      });
      return;
    }

    const dataParaGuardar = {
      cia: 1,
      sucursal: session?.sucursal || 0,
      caja: 1,
      corte: ultimoCorte.corte_maximo,
      corteParcial: ultimoCorte.corte_parcial_maximo,
      usuario: session?.user?.id || session?.id || "",
      montoRetiro: totalRetiroModal,
      observaciones: observacionModal || ""
    };

    try {
      setLoading(true);
      const res = await axios.post('https://localhost:5001/api/Cortedia/registrar-fondo', dataParaGuardar);
      
      setLoading(false);
      cerrarModalRetiro();
      
      // Pequeño delay para asegurar que el modal se cierre antes de mostrar la alerta
      setTimeout(async () => {
        await Swal.fire({
          icon: "success",
          title: "Éxito",
          text: res.data?.mensaje || "Retiro de fondo registrado correctamente",
        });
        fetchInfoCorte();
      }, 100);
    } catch (error: any) {
      console.error("Error al guardar retiro:", error);
      setLoading(false);
      cerrarModalRetiro();
      
      const errorMessage = error?.response?.data?.mensaje 
        || error?.response?.data?.detalle 
        || error?.message 
        || "No se pudo registrar el retiro";
      
      // Pequeño delay para asegurar que el modal se cierre antes de mostrar la alerta
      setTimeout(() => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }, 100);
    }
  };

  // Abrir modal de último retiro
  const abrirModalUltimoRetiro = () => {
    // Resetear valores
    const init: Record<number, number> = {};
    denominaciones.forEach(d => init[d] = 0);
    setRetirosUltimoModal(init);
    setObservacionUltimoModal("");
    setValesUltimoModal(0);
    setModalUltimoRetiroAbierto(true);
  };

  // Cerrar modal de último retiro
  const cerrarModalUltimoRetiro = () => {
    setModalUltimoRetiroAbierto(false);
  };

  // Guardar último retiro
  const guardarUltimoRetiro = async () => {
    if (totalUltimoRetiroModal === 0) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "El total del retiro debe ser mayor a 0",
      });
      return;
    }

    if (!ultimoCorte) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró información del corte",
      });
      return;
    }

    try {
      setLoading(true);

      const requestBody = {
        cia: 1,
        sucursal: session?.sucursal || 0,
        corte: ultimoCorte.corte_maximo,
        corteParcial: ultimoCorte.corte_parcial_maximo,
        caja: 1,
        usuario: session?.user?.id || session?.id || "",
        observaciones: observacionUltimoModal || "",
        ultimoRetiroCorteParcial: totalUltimoRetiroModal,
        
        // 🚀 CAMBIO AQUÍ: Envía el estado que ya guardó los $110 (o lo que dicte la BD)
        montoEsperadoFormularioA: montoEsperadoFormularioA,
        
        b1000: retirosUltimoModal[1000] || 0,
        b500: retirosUltimoModal[500] || 0,
        b200: retirosUltimoModal[200] || 0,
        b100: retirosUltimoModal[100] || 0,
        b50: retirosUltimoModal[50] || 0,
        b20: retirosUltimoModal[20] || 0,
        m10: retirosUltimoModal[10] || 0,
        m5: retirosUltimoModal[5] || 0,
        m2: retirosUltimoModal[2] || 0,
        m1: retirosUltimoModal[1] || 0,
        m05: retirosUltimoModal[0.5] || 0,
        m02: retirosUltimoModal[0.2] || 0,
        m01: retirosUltimoModal[0.1] || 0,
        vales: valesUltimoModal || 0
      };

      console.log("Datos enviados para último retiro:", requestBody);

      const response = await axios.post("https://localhost:5001/api/Cortedia/Guardar", requestBody);

      setLoading(false);
      cerrarModalUltimoRetiro();
      
      // Pequeño delay para asegurar que el modal se cierre antes de mostrar la alerta
      setTimeout(async () => {
        await Swal.fire({
          icon: "success",
          title: "Éxito",
          text: response.data?.mensaje || "Último retiro guardado correctamente.",
        });
        setUltimoRetiroCompletado(true);
        fetchInfoCorte();
      }, 100);
    } catch (error: any) {
      console.error("Error al guardar último retiro:", error);
      setLoading(false);
      cerrarModalUltimoRetiro();
      
      const errorMessage = error?.response?.data?.mensaje 
        || error?.response?.data?.detalle 
        || error?.message 
        || "No se pudo guardar el último retiro";
      
      // Pequeño delay para asegurar que el modal se cierre antes de mostrar la alerta
      setTimeout(() => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }, 100);
    }
  };

  // Formatear denominación
  const formatDenominacion = (d: number) => {
    if (d >= 1) {
      return `$${d.toFixed(0)}`;
    }
    return `$${d.toFixed(1)}`;
  };

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
    // Confirmación inicial
    const confirmacion = await Swal.fire({
      title: "¿Desea realizar el corte parcial?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí",
      cancelButtonText: "No",
      allowOutsideClick: false,
    });

    if (!confirmacion.isConfirmed) return;

    // Alerta informativa sobre cierre del sistema
    await Swal.fire({
      title: "Información",
      text: "El sistema se cerrará para finalizar el corte parcial",
      icon: "info",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Entendido",
      allowOutsideClick: false,
    });

    // Cerrar corte directamente con el efectivo teórico
    cerrarCorte(efectivoTeorico);
  };

  // Cerrar corte en la API
  const cerrarCorte = async (ultimoRetiro: number) => {
    if (!ultimoCorte) return;
    
    try {
      setLoading(true);

      const requestBody = {
        sucursal: session?.sucursal || 0,
        corte: ultimoCorte.corte_maximo,
        corteParcial: ultimoCorte.corte_parcial_maximo,
        caja: 1,
        monto: montoCorte,
        corteFinal: false, // Corte parcial NO es corte final
        usr: session?.user?.id || session?.id || "",
        cia: 1,
        ultimoRetiro: ultimoRetiro
      };

      console.log("Datos enviados al cerrar corte parcial:", requestBody);

      const res = await consumoApi.post(
        "/api/cortedia/cerrar",
        requestBody
      );

      const data = res.data;

      if (data?.corteProcesado || data?.mensaje) {
        Swal.fire(
          "Corte realizado",
          data?.mensaje || "Corte parcial registrado. La sesión se cerrará.",
          "success"
        ).then(() => {
          // Cerrar sesión y redirigir al login
          logout();
          navigate(routes.login);
        });
      } else {
        Swal.fire(
          "Error",
          data?.mensaje || "No se pudo cerrar el corte",
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
               Los totales no coinciden. Intentos restantes:{" "}
              {maxIntentos - intentos}
            </Alert>
          )}

          {totalesCoinciden && totalRetiros === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
               No se han registrado retiros.
            </Alert>
          )}

          {totalesCoinciden && totalRetiros > 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
               Los totales coinciden. Puedes finalizar el corte.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Botones */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={abrirModalRetiro}
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
          Retiro de Fondo
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={abrirModalUltimoRetiro}
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
          Último Retiro
        </Button>

        <Button
          variant="contained"
          color="warning"
          onClick={finalizarCorte}
          disabled={!ultimoRetiroCompletado || loading}
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
      </Typography>

      {/* Modal de Retiro de Fondo */}
      <Dialog
        open={modalRetiroAbierto}
        onClose={cerrarModalRetiro}
        maxWidth="md"
        fullWidth
        sx={{ zIndex: 1300 }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {/* Encabezado */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '3px solid #000', pb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Módulo de<br />
                Retiros del Corte
              </Typography>
              <IconButton onClick={cerrarModalRetiro} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Info del corte */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography><strong>Caja:</strong> 1</Typography>
              <Typography><strong>Corte:</strong> {ultimoCorte?.corte_maximo ?? "N/A"}</Typography>
              <Typography><strong>Corte Parcial:</strong> {ultimoCorte?.corte_parcial_maximo ?? "N/A"}</Typography>
            </Box>

            {/* Denominaciones en dos columnas: Billetes y Monedas */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              {/* Columna izquierda - Billetes (1000-20) */}
              <Box sx={{ flex: 1 }}>
                {[1000, 500, 200, 100, 50, 20].map((d) => {
                  const cantidad = retirosModal[d] || 0;
                  const resultado = d * cantidad;
                  const esFila = [500, 100, 20].includes(d);
                  
                  return (
                    <Box
                      key={d}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.5,
                        bgcolor: esFila ? 'grey.200' : 'transparent',
                        px: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          {formatDenominacion(d)} X
                        </Typography>
                      </Box>
                      
                      <TextField
                        type="number"
                        value={cantidad}
                        onChange={(e) => {
                          const valor = Math.max(0, parseInt(e.target.value) || 0);
                          setRetirosModal(prev => ({ ...prev, [d]: valor }));
                        }}
                        size="small"
                        sx={{ width: 80 }}
                        inputProps={{ min: 0, style: { textAlign: 'center' } }}
                      />
                      
                      <Typography sx={{ minWidth: 30, textAlign: 'center' }}>=</Typography>
                      
                      <Typography sx={{ minWidth: 80, textAlign: 'right', fontWeight: 'bold' }}>
                        {resultado.toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Columna derecha - Monedas (10-0.1) */}
              <Box sx={{ flex: 1 }}>
                {[10, 5, 2, 1, 0.5, 0.2, 0.1].map((d) => {
                  const cantidad = retirosModal[d] || 0;
                  const resultado = d * cantidad;
                  const esFila = [5, 1, 0.2, 0.1].includes(d);
                  
                  return (
                    <Box
                      key={d}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.5,
                        bgcolor: esFila ? 'grey.200' : 'transparent',
                        px: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          {formatDenominacion(d)} X
                        </Typography>
                      </Box>
                      
                      <TextField
                        type="number"
                        value={cantidad}
                        onChange={(e) => {
                          const valor = Math.max(0, parseInt(e.target.value) || 0);
                          setRetirosModal(prev => ({ ...prev, [d]: valor }));
                        }}
                        size="small"
                        sx={{ width: 80 }}
                        inputProps={{ min: 0, style: { textAlign: 'center' } }}
                      />
                      
                      <Typography sx={{ minWidth: 30, textAlign: 'center' }}>=</Typography>
                      
                      <Typography sx={{ minWidth: 80, textAlign: 'right', fontWeight: 'bold' }}>
                        {resultado.toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Fila de VALES debajo de las dos columnas */}
            <Box sx={{ mb: 3 }}>

              {/* Fila de VALES */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.5,
                  bgcolor: '#c8e6c9',
                  px: 1,
                  mt: 1
                }}
              >
                <Typography sx={{ fontWeight: 'bold', minWidth: 100 }}>VALES</Typography>
                <TextField
                  type="number"
                  value={valesModal}
                  onChange={(e) => setValesModal(parseFloat(e.target.value) || 0)}
                  size="small"
                  sx={{ width: 80 }}
                  inputProps={{ min: 0, step: 0.01, style: { textAlign: 'center' } }}
                />
                <Typography sx={{ minWidth: 30, textAlign: 'center' }}>=</Typography>
                <Typography sx={{ minWidth: 80, textAlign: 'right', fontWeight: 'bold' }}>
                  {valesModal.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Total Retiro */}
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Total Retiro: ${totalRetiroModal.toFixed(2)}
              </Typography>
            </Box>

            {/* Observación */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ mb: 1, fontWeight: 'bold' }}>Observación:</Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={observacionModal}
                onChange={(e) => setObservacionModal(e.target.value)}
                placeholder="Ingrese observaciones..."
              />
            </Box>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={guardarRetiroFondo}
                disabled={loading}
              >
                Guardar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={cerrarModalRetiro}
              >
                Salir
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal de Último Retiro */}
      <Dialog
        open={modalUltimoRetiroAbierto}
        onClose={cerrarModalUltimoRetiro}
        maxWidth="md"
        fullWidth
        sx={{ zIndex: 1300 }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {/* Encabezado */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '3px solid #000', pb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Módulo de<br />
                Retiros del Corte
              </Typography>
              <IconButton onClick={cerrarModalUltimoRetiro} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Info del corte */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography><strong>Caja:</strong> 1</Typography>
              <Typography><strong>Corte:</strong> {ultimoCorte?.corte_maximo ?? "N/A"}</Typography>
              <Typography><strong>Corte Parcial:</strong> {ultimoCorte?.corte_parcial_maximo ?? "N/A"}</Typography>
            </Box>

            {/* Denominaciones en dos columnas: Billetes y Monedas */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              {/* Columna izquierda - Billetes (1000-20) */}
              <Box sx={{ flex: 1 }}>
                {[1000, 500, 200, 100, 50, 20].map((d) => {
                  const cantidad = retirosUltimoModal[d] || 0;
                  const resultado = d * cantidad;
                  const esFila = [500, 100, 20].includes(d);
                  
                  return (
                    <Box
                      key={d}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.5,
                        bgcolor: esFila ? 'grey.200' : 'transparent',
                        px: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          {formatDenominacion(d)} X
                        </Typography>
                      </Box>
                      
                      <TextField
                        type="number"
                        value={cantidad}
                        onChange={(e) => {
                          const valor = Math.max(0, parseInt(e.target.value) || 0);
                          setRetirosUltimoModal(prev => ({ ...prev, [d]: valor }));
                        }}
                        size="small"
                        sx={{ width: 80 }}
                        inputProps={{ min: 0, style: { textAlign: 'center' } }}
                      />
                      
                      <Typography sx={{ minWidth: 30, textAlign: 'center' }}>=</Typography>
                      
                      <Typography sx={{ minWidth: 80, textAlign: 'right', fontWeight: 'bold' }}>
                        {resultado.toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Columna derecha - Monedas (10-0.1) */}
              <Box sx={{ flex: 1 }}>
                {[10, 5, 2, 1, 0.5, 0.2, 0.1].map((d) => {
                  const cantidad = retirosUltimoModal[d] || 0;
                  const resultado = d * cantidad;
                  const esFila = [5, 1, 0.2, 0.1].includes(d);
                  
                  return (
                    <Box
                      key={d}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.5,
                        bgcolor: esFila ? 'grey.200' : 'transparent',
                        px: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          {formatDenominacion(d)} X
                        </Typography>
                      </Box>
                      
                      <TextField
                        type="number"
                        value={cantidad}
                        onChange={(e) => {
                          const valor = Math.max(0, parseInt(e.target.value) || 0);
                          setRetirosUltimoModal(prev => ({ ...prev, [d]: valor }));
                        }}
                        size="small"
                        sx={{ width: 80 }}
                        inputProps={{ min: 0, style: { textAlign: 'center' } }}
                      />
                      
                      <Typography sx={{ minWidth: 30, textAlign: 'center' }}>=</Typography>
                      
                      <Typography sx={{ minWidth: 80, textAlign: 'right', fontWeight: 'bold' }}>
                        {resultado.toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Fila de VALES debajo de las dos columnas */}
            <Box sx={{ mb: 3 }}>

              {/* Fila de VALES */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.5,
                  bgcolor: '#c8e6c9',
                  px: 1,
                  mt: 1
                }}
              >
                <Typography sx={{ fontWeight: 'bold', minWidth: 100 }}>VALES</Typography>
                <TextField
                  type="number"
                  value={valesUltimoModal}
                  onChange={(e) => setValesUltimoModal(parseFloat(e.target.value) || 0)}
                  size="small"
                  sx={{ width: 80 }}
                  inputProps={{ min: 0, step: 0.01, style: { textAlign: 'center' } }}
                />
                <Typography sx={{ minWidth: 30, textAlign: 'center' }}>=</Typography>
                <Typography sx={{ minWidth: 80, textAlign: 'right', fontWeight: 'bold' }}>
                  {valesUltimoModal.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Total Retiro */}
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Total Retiro: ${totalUltimoRetiroModal.toFixed(2)}
              </Typography>
            </Box>

            {/* Observación */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ mb: 1, fontWeight: 'bold' }}>Observación:</Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={observacionUltimoModal}
                onChange={(e) => setObservacionUltimoModal(e.target.value)}
                placeholder="Ingrese observaciones..."
              />
            </Box>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={guardarUltimoRetiro}
                disabled={loading}
              >
                Guardar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={cerrarModalUltimoRetiro}
              >
                Salir
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
