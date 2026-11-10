import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import { useQuery } from "@tanstack/react-query";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useAuth } from "../../../context/AuthContext";
import useSession from "../../../hooks/useSession";
import SucursalSelector from "../../../components/selectores/SucursalSelector";
import type { SucursalOption } from "../../../components/selectores/SucursalSelector";
import AdministracionTable from "../../../features/RecepcionMercanciaAdministracion/components/AdministracionTable";
import { RecepcionMercanciaAdministracionApis } from "../../../features/RecepcionMercanciaAdministracion/apis/RecepcionMercanciaAdministracionApis";
import type { RecepcionAdministracionRow } from "../../../features/RecepcionMercanciaAdministracion/types/RecepcionMercanciaAdministracionTypes";
import { obtenerMensajeError } from "../../../features/RecepcionMercanciaAdministracion/utils/errores";

interface Notificacion {
  open: boolean;
  severity: "success" | "error";
  message: string;
}

function normalizarRespuesta(data: unknown): RecepcionAdministracionRow[] {
  if (!Array.isArray(data)) return [];
  if (data.length > 0 && Array.isArray(data[0])) {
    return data[0] as RecepcionAdministracionRow[];
  }
  return data as RecepcionAdministracionRow[];
}

export default function RecepcionMercanciaAdministracionPage() {
  const { consumoApi } = useConsumoApi();
  const { token } = useAuth();
  const session = useSession();

  const [sucursalSeleccionada, setSucursalSeleccionada] =
    useState<SucursalOption | null>(null);
  const [folioFiltro, setFolioFiltro] = useState("");
  const [sucursalAplicada, setSucursalAplicada] = useState(0);
  const [folioAplicado, setFolioAplicado] = useState(0);
  const [notif, setNotif] = useState<Notificacion>({
    open: false,
    severity: "success",
    message: "",
  });

  const sucursalSesionId =
    Number(session?.sucursal) || Number(token?.claveDepartamento) || 0;

  const administracionQuery = useQuery<RecepcionAdministracionRow[]>({
    queryKey: ["recepcion-administracion", sucursalAplicada, folioAplicado],
    queryFn: async () => {
      const { data } = await consumoApi.get<unknown>(
        RecepcionMercanciaAdministracionApis.administracion(
          sucursalAplicada,
          folioAplicado
        )
      );
      return normalizarRespuesta(data);
    },
    enabled: sucursalAplicada > 0 && folioAplicado > 0,
  });

  const rows = useMemo(
    () => administracionQuery.data ?? [],
    [administracionQuery.data]
  );

  const totales = useMemo(() => {
    return rows.reduce(
      (acumulado, row) => ({
        piezas: acumulado.piezas + Number(row.cantidad || 0),
        administracion:
          acumulado.administracion + Number(row.cantidad_administracion || 0),
        diferencia: acumulado.diferencia + Number(row.diferencia || 0),
        costo: acumulado.costo + Number(row.costo_total || 0),
        factura: acumulado.factura + Number(row.costoFactura1 || 0),
      }),
      {
        piezas: 0,
        administracion: 0,
        diferencia: 0,
        costo: 0,
        factura: 0,
      }
    );
  }, [rows]);

  const handleBuscar = () => {
    const sucursal = sucursalSeleccionada?.cve_sucursal ?? 0;
    const folio = Number(folioFiltro);

    if (sucursal <= 0) {
      setNotif({
        open: true,
        severity: "error",
        message: "Selecciona una sucursal válida.",
      });
      return;
    }

    if (!Number.isInteger(folio) || folio <= 0) {
      setNotif({
        open: true,
        severity: "error",
        message: "El folio debe ser un número mayor a 0.",
      });
      return;
    }

    setSucursalAplicada(sucursal);
    setFolioAplicado(folio);
  };

  const handleLimpiar = () => {
    setFolioFiltro("");
    setSucursalAplicada(0);
    setFolioAplicado(0);
  };

  const handleCloseNotif = () => {
    setNotif((prev) => ({ ...prev, open: false }));
  };

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FactCheckIcon sx={{ fontSize: 28, color: "primary.main" }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, letterSpacing: "0.02em" }}
              >
                Administración de recepción de mercancía
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Consulta los detalles administrativos de una recepción por sucursal
              y folio.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <SucursalSelector
                value={sucursalSeleccionada}
                onChange={setSucursalSeleccionada}
                defaultSucursalId={sucursalSesionId}
                sx={{ width: { xs: "100%", sm: 260 } }}
              />
              <TextField
                label="Folio"
                type="number"
                size="small"
                value={folioFiltro}
                onChange={(event) => setFolioFiltro(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleBuscar();
                }}
                inputProps={{ min: 0, step: 1 }}
                sx={{ width: { xs: "100%", sm: 160 } }}
              />
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleBuscar}
                disabled={administracionQuery.isFetching}
                sx={{ textTransform: "none" }}
              >
                Buscar
              </Button>
              <Button
                variant="text"
                onClick={handleLimpiar}
                disabled={administracionQuery.isFetching}
                sx={{ textTransform: "none" }}
              >
                Limpiar
              </Button>
            </Stack>

            {administracionQuery.isError && (
              <Alert severity="error">
                {obtenerMensajeError(
                  administracionQuery.error,
                  "No se pudo consultar la administración de la recepción"
                )}
              </Alert>
            )}

            <AdministracionTable
              rows={rows}
              cargando={administracionQuery.isLoading}
            />
          </Stack>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Totales
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Piezas recibidas
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {totales.piezas}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Cantidad administración
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {totales.administracion}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Diferencia
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {totales.diferencia}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Costo total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
                    {totales.costo.toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Costo factura
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
                    {totales.factura.toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={notif.open}
        autoHideDuration={4000}
        onClose={handleCloseNotif}
      >
        <Alert
          onClose={handleCloseNotif}
          severity={notif.severity}
          variant="outlined"
          sx={{ width: "100%" }}
        >
          {notif.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
