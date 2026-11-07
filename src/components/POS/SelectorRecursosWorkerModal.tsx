import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Swal from "sweetalert2";
import axios from "axios";
import { useWorkerStore } from "../../context/useWorkerStore";
import useConsumoWorker from "../../hooks/useConsumoWorker";
import useConsumoApi from "../../hooks/useConsumoApi";
import type { TipoRecursoWorker } from "../../interfaces/workerInterfaces";

const WORKER_KEY = import.meta.env.VITE_WORKER_KEY ?? "CAMBIAR_EN_INSTALACION";
const TIPOS_RECURSO: TipoRecursoWorker[] = ["Tickets", "Documentos"];

interface EstadoEquipo {
  enLinea: boolean | null; // null = verificando
  hostname?: string;
}

export default function SelectorRecursosWorkerModal() {
  const {
    recursosSucursal,
    equipoActivo,
    seleccionarEquipoManual,
    modalSeleccionAbierto,
    cerrarModal,
    idEmpresaActiva,
    idSucursalActiva,
    sincronizarContexto,
  } = useWorkerStore();

  const { verificarEstadoWorker } = useConsumoWorker();
  const { consumoApi } = useConsumoApi();

  const [estados, setEstados] = useState<Record<string, EstadoEquipo>>({});
  const [adminAbierto, setAdminAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formEquipo, setFormEquipo] = useState("");
  const [formRecurso, setFormRecurso] = useState<TipoRecursoWorker>("Tickets");
  const [formWorker, setFormWorker] = useState("");
  const [formImpresora, setFormImpresora] = useState("");
  const [impresorasWorker, setImpresorasWorker] = useState<string[]>([]);
  const [cargandoImpresoras, setCargandoImpresoras] = useState(false);

  const equipos = useMemo(
    () => [...new Set(recursosSucursal.map((r) => r.equipo))],
    [recursosSucursal]
  );

  const workers = useMemo(() => {
    const mapa = new Map<string, { ipWorker: string; puerto: number; hostWorker: string | null }>();
    for (const r of recursosSucursal) {
      if (!mapa.has(`${r.ipWorker}:${r.puerto}`)) {
        mapa.set(`${r.ipWorker}:${r.puerto}`, {
          ipWorker: r.ipWorker,
          puerto: r.puerto,
          hostWorker: r.hostWorker,
        });
      }
    }
    return [...mapa.values()];
  }, [recursosSucursal]);

  // Al abrir, verifica en paralelo que workers responden en la LAN.
  useEffect(() => {
    if (!modalSeleccionAbierto) return;

    const verificar = async () => {
      const iniciales: Record<string, EstadoEquipo> = {};
      for (const equipo of equipos) iniciales[equipo] = { enLinea: null };
      setEstados(iniciales);

      await Promise.all(
        equipos.map(async (equipo) => {
          const fila = recursosSucursal.find((r) => r.equipo === equipo);
          if (!fila) return;
          const identidad = await verificarEstadoWorker(fila.ipWorker, fila.puerto);
          setEstados((prev) => ({
            ...prev,
            [equipo]: identidad
              ? { enLinea: true, hostname: identidad.hostname }
              : { enLinea: false },
          }));
        })
      );
    };

    verificar();
  }, [modalSeleccionAbierto, equipos, recursosSucursal, verificarEstadoWorker]);

  // Carga las impresoras del worker elegido para dar de alta un recurso.
  const cargarImpresoras = async (workerKey: string) => {
    const worker = workers.find((w) => `${w.ipWorker}:${w.puerto}` === workerKey);
    if (!worker) return;

    setCargandoImpresoras(true);
    setImpresorasWorker([]);
    try {
      const { data } = await axios.get<string[]>(
        `http://${worker.ipWorker}:${worker.puerto}/api/impresion/impresoras`,
        { headers: { "X-Worker-Key": WORKER_KEY }, timeout: 4000 }
      );
      setImpresorasWorker(Array.isArray(data) ? data : []);
    } catch {
      setImpresorasWorker([]);
    } finally {
      setCargandoImpresoras(false);
    }
  };

  const guardarRecurso = async () => {
    if (!formEquipo.trim() || !formWorker || !formImpresora.trim()) {
      Swal.fire({ icon: "warning", title: "Completa equipo, worker e impresora" });
      return;
    }

    const [ip, puertoStr] = formWorker.split(":");
    const worker = workers.find((w) => w.ipWorker === ip);
    setGuardando(true);

    try {
      await consumoApi.post("/api/RecursosWorker/sp_cat_RecursosWorker_Guardar", {
        IdEmpresa: idEmpresaActiva,
        IdSucursal: idSucursalActiva,
        Equipo: formEquipo.trim(),
        Recurso: formRecurso,
        IpWorker: ip,
        HostWorker: worker?.hostWorker ?? null,
        Puerto: Number(puertoStr) || 5000,
        NombreDispositivoLocal: formImpresora.trim(),
        Activo: true,
      });

      Swal.fire({ icon: "success", title: "Recurso guardado", timer: 1500, showConfirmButton: false });
      setFormImpresora("");

      if (idEmpresaActiva && idSucursalActiva)
        await sincronizarContexto(idEmpresaActiva, idSucursalActiva);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: axios.isAxiosError(e) ? String((e.response?.data as { mensaje?: string })?.mensaje ?? e.message) : "Error desconocido",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog
      open={modalSeleccionAbierto}
      onClose={cerrarModal}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Caja / equipo a utilizar</DialogTitle>
      <DialogContent dividers>
        {equipos.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No hay recursos worker registrados para esta empresa/sucursal.
            Registra el primero en la sección de configuración o en la tabla
            cat_RecursosWorker.
          </Alert>
        ) : (
          <List dense disablePadding>
            {equipos.map((equipo) => {
              const estado = estados[equipo];
              const seleccionado = equipo === equipoActivo;
              return (
                <ListItemButton
                  key={equipo}
                  selected={seleccionado}
                  onClick={() => seleccionarEquipoManual(equipo)}
                  sx={{ borderRadius: 1, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PrintIcon color={seleccionado ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <ListItemText
                    primary={equipo}
                    secondary={estado?.hostname ?? undefined}
                  />
                  {estado?.enLinea === null ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Chip
                      size="small"
                      color={estado?.enLinea ? "success" : "default"}
                      label={estado?.enLinea ? "En línea" : "Sin respuesta"}
                      variant={estado?.enLinea ? "filled" : "outlined"}
                    />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Button
          size="small"
          onClick={() => setAdminAbierto((v) => !v)}
          endIcon={adminAbierto ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          Configurar nuevo recurso
        </Button>

        <Collapse in={adminAbierto}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
            <TextField
              size="small"
              label="Equipo"
              placeholder='Ej. "Caja1", "Caja3"'
              value={formEquipo}
              onChange={(e) => setFormEquipo(e.target.value)}
            />
            <FormControl size="small">
              <InputLabel>Recurso</InputLabel>
              <Select
                label="Recurso"
                value={formRecurso}
                onChange={(e) => setFormRecurso(e.target.value as TipoRecursoWorker)}
              >
                {TIPOS_RECURSO.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Worker</InputLabel>
              <Select
                label="Worker"
                value={formWorker}
                onChange={(e) => {
                  setFormWorker(e.target.value);
                  cargarImpresoras(e.target.value);
                }}
              >
                {workers.map((w) => (
                  <MenuItem key={`${w.ipWorker}:${w.puerto}`} value={`${w.ipWorker}:${w.puerto}`}>
                    {w.ipWorker}:{w.puerto}{w.hostWorker ? ` (${w.hostWorker})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {cargandoImpresoras ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="caption">Consultando impresoras del worker…</Typography>
              </Box>
            ) : impresorasWorker.length > 0 ? (
              <FormControl size="small">
                <InputLabel>Impresora en el worker</InputLabel>
                <Select
                  label="Impresora en el worker"
                  value={formImpresora}
                  onChange={(e) => setFormImpresora(e.target.value)}
                >
                  {impresorasWorker.map((nombre) => (
                    <MenuItem key={nombre} value={nombre}>{nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                size="small"
                label="Nombre de la impresora en el worker"
                placeholder='Ej. "Miniprinter_Caja1"'
                value={formImpresora}
                onChange={(e) => setFormImpresora(e.target.value)}
                helperText="Si el worker no respondió, escribe el nombre exacto de Windows"
              />
            )}
            <Button
              variant="contained"
              size="small"
              disabled={guardando}
              onClick={guardarRecurso}
            >
              {guardando ? "Guardando…" : "Guardar recurso"}
            </Button>
          </Box>
        </Collapse>
      </DialogContent>
      <DialogActions>
        <Button onClick={cerrarModal}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

