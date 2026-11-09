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
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RefreshIcon from "@mui/icons-material/Refresh";
import Swal from "sweetalert2";
import axios from "axios";
import { useWorkerStore } from "../../context/useWorkerStore";
import useConsumoWorker from "../../hooks/useConsumoWorker";
import useConsumoApi from "../../hooks/useConsumoApi";
import type { IRecursoWorker, TipoRecursoWorker } from "../../interfaces/workerInterfaces";

const WORKER_KEY = import.meta.env.VITE_WORKER_KEY ?? "CAMBIAR_EN_INSTALACION";
const TIPOS_RECURSO: TipoRecursoWorker[] = ["Tickets", "Documentos"];

interface EstadoEquipo {
  enLinea: boolean | null; // null = verificando
  hostname?: string;
}

export default function SelectorRecursosWorkerModal() {
  // Selectores individuales: suscribirse al store completo re-renderizaba
  // este modal con cualquier cambio del store.
  const recursosSucursal = useWorkerStore((s) => s.recursosSucursal);
  const equipoActivo = useWorkerStore((s) => s.equipoActivo);
  const seleccionarEquipoManual = useWorkerStore((s) => s.seleccionarEquipoManual);
  const modalSeleccionAbierto = useWorkerStore((s) => s.modalSeleccionAbierto);
  const cerrarModal = useWorkerStore((s) => s.cerrarModal);
  const idEmpresaActiva = useWorkerStore((s) => s.idEmpresaActiva);
  const idSucursalActiva = useWorkerStore((s) => s.idSucursalActiva);
  const sincronizarContexto = useWorkerStore((s) => s.sincronizarContexto);

  const { verificarEstadoWorker } = useConsumoWorker();
  const { consumoApi } = useConsumoApi();

  const [estados, setEstados] = useState<Record<string, EstadoEquipo>>({});
  const [adminAbierto, setAdminAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formEquipo, setFormEquipo] = useState("");
  const [formRecurso, setFormRecurso] = useState<TipoRecursoWorker>("Tickets");
  const [formWorker, setFormWorker] = useState(""); // "ip:puerto" registrado o "__OTRO__"
  const [formWorkerManual, setFormWorkerManual] = useState(""); // "ip:puerto" de worker no registrado
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

  // Resuelve "ip:puerto" a partir del select o de la captura manual.
  const resolverWorkerForm = (): { ip: string; puerto: number } | null => {
    const raw = formWorker === "__OTRO__" ? formWorkerManual : formWorker;
    const [ip, puertoStr] = (raw ?? "").split(":");
    if (!ip || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return null;
    return { ip, puerto: Number(puertoStr) || 5000 };
  };

  // Consulta las impresoras instaladas en el worker por su IP:puerto.
  const cargarImpresorasDe = async (ip: string, puerto: number) => {
    setCargandoImpresoras(true);
    setImpresorasWorker([]);
    try {
      const { data } = await axios.get<string[]>(
        `http://${ip}:${puerto}/api/impresion/impresoras`,
        { headers: { "X-Worker-Key": WORKER_KEY }, timeout: 4000 }
      );
      setImpresorasWorker(Array.isArray(data) ? data : []);
    } catch {
      setImpresorasWorker([]);
    } finally {
      setCargandoImpresoras(false);
    }
  };

  // Al abrir el modal, limpia el formulario para no mostrar datos viejos.
  useEffect(() => {
    if (!modalSeleccionAbierto) return;
    setFormEquipo("");
    setFormRecurso("Tickets");
    setFormWorker("");
    setFormWorkerManual("");
    setFormImpresora("");
    setImpresorasWorker([]);
    setAdminAbierto(false);
  }, [modalSeleccionAbierto]);

  // Al desplegar "Configurar nuevo recurso", recarga las impresoras si ya
  // hay un worker elegido (evita la lista obsoleta de aperturas anteriores).
  useEffect(() => {
    if (!adminAbierto || !formWorker) return;
    const target = resolverWorkerForm();
    if (target) cargarImpresorasDe(target.ip, target.puerto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminAbierto]);

  const guardarRecurso = async () => {
    const target = resolverWorkerForm();
    if (!formEquipo.trim() || !target || !formImpresora.trim()) {
      Swal.fire({ icon: "warning", title: "Completa equipo, worker (IP:puerto) e impresora" });
      return;
    }

    const worker = workers.find((w) => w.ipWorker === target.ip && w.puerto === target.puerto);
    setGuardando(true);

    try {
      await consumoApi.post("/api/RecursosWorker/sp_cat_RecursosWorker_Guardar", {
        IdEmpresa: idEmpresaActiva,
        IdSucursal: idSucursalActiva,
        Equipo: formEquipo.trim(),
        Recurso: formRecurso,
        IpWorker: target.ip,
        HostWorker: worker?.hostWorker ?? null,
        Puerto: target.puerto,
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

  // Baja logica de un recurso (Activo=0 en cat_RecursosWorker).
  const eliminarRecurso = async (r: IRecursoWorker) => {
    const confirma = await Swal.fire({
      icon: "warning",
      title: `¿Quitar ${r.recurso} de ${r.equipo}?`,
      text: `Dispositivo: ${r.nombreDispositivoLocal ?? r.ipWorker}`,
      showCancelButton: true,
      confirmButtonText: "Quitar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!confirma.isConfirmed) return;

    try {
      await consumoApi.delete(
        `/api/RecursosWorker/sp_cat_RecursosWorker_Eliminar?idRecurso=${r.idRecurso}`
      );
      if (idEmpresaActiva && idSucursalActiva)
        await sincronizarContexto(idEmpresaActiva, idSucursalActiva);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "No se pudo quitar el recurso",
        text: axios.isAxiosError(e) ? String((e.response?.data as { mensaje?: string })?.mensaje ?? e.message) : "Error desconocido",
      });
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
              const recursosDelEquipo = recursosSucursal.filter(
                (r) => r.equipo === equipo
              );
              return (
                <Box key={equipo}>
                  <ListItemButton
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
                  {recursosDelEquipo.map((r) => (
                    <ListItem
                      key={r.idRecurso}
                      dense
                      sx={{ pl: 6, py: 0 }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          title={`Quitar ${r.recurso}`}
                          onClick={() => eliminarRecurso(r)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                        primary={r.recurso}
                        secondary={r.nombreDispositivoLocal ?? ""}
                      />
                    </ListItem>
                  ))}
                </Box>
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
                  const v = e.target.value;
                  setFormWorker(v);
                  if (v !== "__OTRO__") {
                    const [ip, p] = v.split(":");
                    cargarImpresorasDe(ip, Number(p) || 5000);
                  } else {
                    setImpresorasWorker([]);
                  }
                }}
              >
                {workers.map((w) => (
                  <MenuItem key={`${w.ipWorker}:${w.puerto}`} value={`${w.ipWorker}:${w.puerto}`}>
                    {w.ipWorker}:{w.puerto}{w.hostWorker ? ` (${w.hostWorker})` : ""}
                  </MenuItem>
                ))}
                <MenuItem value="__OTRO__">Otro worker (escribir IP:puerto)</MenuItem>
              </Select>
            </FormControl>
            {formWorker === "__OTRO__" && (
              <TextField
                size="small"
                label="IP:Puerto del worker"
                placeholder="Ej. 192.168.100.55:5000"
                value={formWorkerManual}
                onChange={(e) => {
                  setFormWorkerManual(e.target.value);
                  const [ip, p] = e.target.value.split(":");
                  if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip))
                    cargarImpresorasDe(ip, Number(p) || 5000);
                }}
              />
            )}
            {cargandoImpresoras ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="caption">Consultando impresoras del worker…</Typography>
              </Box>
            ) : impresorasWorker.length > 0 ? (
              <>
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
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    const target = resolverWorkerForm();
                    if (target) cargarImpresorasDe(target.ip, target.puerto);
                  }}
                >
                  Actualizar lista de impresoras
                </Button>
              </>
            ) : (
              <>
                <TextField
                  size="small"
                  label="Nombre de la impresora en el worker"
                  placeholder='Ej. "Miniprinter_Caja1"'
                  value={formImpresora}
                  onChange={(e) => setFormImpresora(e.target.value)}
                  helperText="Si el worker no respondió, escribe el nombre exacto de Windows"
                />
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  disabled={!resolverWorkerForm()}
                  onClick={() => {
                    const target = resolverWorkerForm();
                    if (target) cargarImpresorasDe(target.ip, target.puerto);
                  }}
                >
                  Consultar impresoras del worker
                </Button>
              </>
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

