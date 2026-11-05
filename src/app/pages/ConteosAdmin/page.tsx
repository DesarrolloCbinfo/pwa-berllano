import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useConsumoApiConteos from "../../../hooks/useConsumoApiConteos";
import useSession from "../../../hooks/useSession";
import { routes } from "../../../utils/Routes";
import { ConteosApis } from "../Conteos/apis/ConteosApis";
import {
  IConteoActivo,
  IFamiliaConteo,
  IMarcaConteo,
  ISucursalConteo,
  IUsuarioConteo,
} from "../Conteos/interfaces/IConteo";
import {
  getSucursalConteo,
  setSucursalConteo,
  SucursalConteoSel,
} from "../Conteos/conteoSession";

export default function ConteosAdminPage() {
  const { consumoApi } = useConsumoApiConteos();
  const session = useSession();
  const navigate = useNavigate();

  const [sucursales, setSucursales] = useState<ISucursalConteo[]>([]);
  const [sucursalSel, setSucursalSel] = useState<SucursalConteoSel | null>(
    () => getSucursalConteo()
  );
  const [usuarios, setUsuarios] = useState<IUsuarioConteo[]>([]);
  const [usuarioSel, setUsuarioSel] = useState("");
  const [marcas, setMarcas] = useState<IMarcaConteo[]>([]);
  const [marcaSel, setMarcaSel] = useState<number | "">("");
  const [familias, setFamilias] = useState<IFamiliaConteo[]>([]);
  const [familiasSel, setFamiliasSel] = useState<Set<number>>(new Set());
  const [descripcion, setDescripcion] = useState("");
  const [descError, setDescError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingFamilias, setLoadingFamilias] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Ajustar inventario (cierre de conteo -> sp_cierraConteos2026)
  const [conteosActivos, setConteosActivos] = useState<IConteoActivo[]>([]);
  const [conteoCerrarSel, setConteoCerrarSel] = useState<number | "">("");
  const [abrirCierre, setAbrirCierre] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [cargandoActivos, setCargandoActivos] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resSuc, resUsr, resMar] = await Promise.all([
          consumoApi.get(ConteosApis.sucursales),
          consumoApi.get(ConteosApis.usuarios),
          consumoApi.get(ConteosApis.marcas),
        ]);

        const listaSuc: ISucursalConteo[] = resSuc.data ?? [];
        setSucursales(listaSuc);
        setUsuarios(resUsr.data ?? []);
        setMarcas(resMar.data ?? []);

        const guardada = getSucursalConteo();
        if (guardada && listaSuc.some((s) => s.cve_sucursal === guardada.id)) {
          setSucursalSel(guardada);
        } else {
          const inicial =
            listaSuc.find((s) => s.cve_sucursal === session?.sucursal) ??
            listaSuc[0];
          if (inicial) {
            const sel = { id: inicial.cve_sucursal, nombre: inicial.nombre };
            setSucursalSel(sel);
            setSucursalConteo(sel);
          }
        }
      } catch (error) {
        console.error("Error al cargar los datos de conteos:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos del modulo de conteos",
        });
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  // Al seleccionar la marca se despliegan sus familias (aux_marca_AfterUpdate)
  useEffect(() => {
    if (!marcaSel || !sucursalSel) {
      setFamilias([]);
      setFamiliasSel(new Set());
      return;
    }

    const cargarFamilias = async () => {
      setLoadingFamilias(true);
      try {
        const res = await consumoApi.get(
          ConteosApis.familias(marcaSel, sucursalSel.id)
        );
        const lista: IFamiliaConteo[] = res.data ?? [];
        setFamilias(lista);
        setFamiliasSel(
          new Set(lista.filter((f) => f.Seleccion).map((f) => f.clave))
        );
      } catch (error) {
        console.error("Error al cargar las familias:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las familias de la marca",
        });
      } finally {
        setLoadingFamilias(false);
      }
    };

    cargarFamilias();
  }, [marcaSel, sucursalSel?.id]);

  const handleSucursalChange = (value: number) => {
    const suc = sucursales.find((s) => s.cve_sucursal === value);
    if (!suc) return;

    const sel = { id: suc.cve_sucursal, nombre: suc.nombre };
    setSucursalSel(sel);
    setSucursalConteo(sel);
  };

  const todasSeleccionadas =
    familias.length > 0 && familiasSel.size === familias.length;

  const toggleTodas = () => {
    setFamiliasSel(
      todasSeleccionadas ? new Set() : new Set(familias.map((f) => f.clave))
    );
  };

  const toggleFamilia = (clave: number) => {
    setFamiliasSel((prev) => {
      const next = new Set(prev);
      if (next.has(clave)) {
        next.delete(clave);
      } else {
        next.add(clave);
      }
      return next;
    });
  };

  const marcaTexto = marcas.find((m) => m.id === marcaSel)?.marca ?? "";

  // La seleccion de familias vive solo en el cliente: se envia como
  // TVP a los SPs, sin escribir en aux_familias (uso concurrente)
  const familiasClaves = () => [...familiasSel];

  const validarBase = (requiereMarca: boolean) => {
    if (!sucursalSel) {
      Swal.fire({ icon: "warning", title: "Falta la sucursal" });
      return false;
    }
    if (requiereMarca && !marcaSel) {
      Swal.fire({ icon: "warning", title: "Seleccione una marca" });
      return false;
    }
    return true;
  };

  const inicializarProceso = async () => {
    if (procesando || !validarBase(true)) return;

    if (!usuarioSel) {
      Swal.fire({ icon: "warning", title: "Seleccione un usuario" });
      return;
    }

    setProcesando(true);
    try {
      if (!descripcion.trim()) {
        setDescError(true);
        Swal.fire({
          icon: "warning",
          title: "Falta la descripcion",
          text: "Escriba una breve descripcion del conteo.",
        });
        return;
      }

      // Misma validacion que el Access: traspasos en transito bloquean el proceso
      const resTx = await consumoApi.get(ConteosApis.transito(sucursalSel!.id));
      const tx = Number(resTx.data?.[0]?.tx ?? 0);
      if (tx > 1) {
        Swal.fire({
          icon: "error",
          title: "Conteos",
          text: "Existen traspasos en transito. Imposible iniciar el proceso.",
        });
        return;
      }

      const confirma = await Swal.fire({
        icon: "question",
        title: "Inicializar un Conteo...",
        text: "Desea iniciar un Conteo?",
        showCancelButton: true,
        confirmButtonText: "Si",
        cancelButtonText: "No",
      });
      if (!confirma.isConfirmed) return;

      await consumoApi.post(ConteosApis.inicializa, {
        sucursal: sucursalSel!.id,
        usuarioAsignado: usuarioSel,
        descripcion,
        marca: marcaTexto,
        usuario: session?.claveEmpleado || "admin",
        familias: familiasClaves(),
      });

      Swal.fire({
        icon: "success",
        title: "Conteos",
        text: "Se registro el Conteo!!",
      });
    } catch (error) {
      console.error("Error al inicializar el conteo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo inicializar el conteo",
      });
    } finally {
      setProcesando(false);
    }
  };

  // AJUSTAR INVENTARIO: cierra el conteo seleccionado (sp_cierraConteos2026)
  const ajustarInventario = async () => {
    if (!sucursalSel) {
      Swal.fire({ icon: "warning", title: "Falta la sucursal" });
      return;
    }

    setCargandoActivos(true);
    try {
      const res = await consumoApi.get(ConteosApis.activos(sucursalSel.id));
      const lista: IConteoActivo[] = res.data ?? [];
      if (lista.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Ajustar Inventario",
          text: "No hay conteos activos en la sucursal",
        });
        return;
      }
      setConteosActivos(lista);
      setConteoCerrarSel(lista.length === 1 ? lista[0].idConteo : "");
      setAbrirCierre(true);
    } catch (error) {
      console.error("Error al cargar los conteos activos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los conteos activos",
      });
    } finally {
      setCargandoActivos(false);
    }
  };

  const confirmarCierre = async () => {
    if (!conteoCerrarSel) {
      Swal.fire({ icon: "warning", title: "Seleccione un conteo" });
      return;
    }

    const confirma = await Swal.fire({
      icon: "question",
      title: "Ajustar Inventario",
      text: `Se cerrara el conteo #${conteoCerrarSel} y se aplicaran las diferencias al inventario. Desea continuar?`,
      showCancelButton: true,
      confirmButtonText: "Si",
      cancelButtonText: "No",
    });
    if (!confirma.isConfirmed) return;

    setCerrando(true);
    try {
      await consumoApi.post(ConteosApis.cierraConteo, {
        idConteo: conteoCerrarSel,
      });
      Swal.fire({
        icon: "success",
        title: "Ajustar Inventario",
        text: "Cierre exitoso",
      });
      setAbrirCierre(false);
      setConteosActivos((prev) =>
        prev.filter((c) => c.idConteo !== conteoCerrarSel)
      );
      setConteoCerrarSel("");
    } catch (error) {
      console.error("Error al cerrar el conteo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cerrar el conteo",
      });
    } finally {
      setCerrando(false);
    }
  };

  return (
    <Box sx={{ p: 4, minHeight: "calc(100vh - 64px)" }}>
      <Typography
        sx={{
          textAlign: "center",
          mb: 3,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 700,
          fontSize: "1.75rem",
          color: "#111",
        }}
      >
        CONTEO DE INVENTARIOS
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
            maxWidth: 1100,
            mx: "auto",
          }}
        >
          <Paper sx={{ flex: 1.4, p: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="admin-sucursal-label">Sucursal</InputLabel>
                <Select
                  labelId="admin-sucursal-label"
                  label="Sucursal"
                  value={sucursalSel?.id ?? ""}
                  onChange={(e) => handleSucursalChange(Number(e.target.value))}
                >
                  {sucursales.map((s) => (
                    <MenuItem key={s.cve_sucursal} value={s.cve_sucursal}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel id="admin-usuario-label">Usuario</InputLabel>
                <Select
                  labelId="admin-usuario-label"
                  label="Usuario"
                  value={usuarioSel}
                  onChange={(e) => setUsuarioSel(e.target.value)}
                >
                  {usuarios.map((u) => (
                    <MenuItem key={u.usuario} value={u.usuario}>
                      {u.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel id="admin-marca-label">Marca</InputLabel>
                <Select
                  labelId="admin-marca-label"
                  label="Marca"
                  value={marcaSel}
                  onChange={(e) => setMarcaSel(Number(e.target.value))}
                >
                  {marcas.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.marca}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 3,
                mb: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                SELECCIONE LAS FAMILIAS
              </Typography>
              <Checkbox
                size="small"
                checked={todasSeleccionadas}
                indeterminate={
                  familiasSel.size > 0 && familiasSel.size < familias.length
                }
                onChange={toggleTodas}
              />
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#212121" }}>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Familia
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ color: "#fff", fontWeight: "bold", width: 90 }}
                    >
                      Seleccion
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      clave
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingFamilias ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <CircularProgress size={20} />
                      </TableCell>
                    </TableRow>
                  ) : familias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="textSecondary">
                          {marcaSel
                            ? "Sin familias para mostrar"
                            : "Seleccione una marca"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    familias.map((f) => (
                      <TableRow key={f.clave} hover>
                        <TableCell>{f.descripcion}</TableCell>
                        <TableCell align="center">
                          <Checkbox
                            size="small"
                            checked={familiasSel.has(f.clave)}
                            onChange={() => toggleFamilia(f.clave)}
                          />
                        </TableCell>
                        <TableCell>{f.clave}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
            }}
          >
            <Paper
              sx={{
                flex: 1,
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <TextField
                label="Descripción"
                size="small"
                required
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  if (e.target.value.trim()) setDescError(false);
                }}
                error={descError}
                helperText={descError ? "La descripción es obligatoria" : ""}
                fullWidth
              />

              <Button
                variant="contained"
                fullWidth
                disabled={procesando}
                onClick={inicializarProceso}
              >
                Inicializar Proceso
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(routes.conteoActivos)}
              >
                Ver Conteos Activos
              </Button>
              <Button variant="outlined" fullWidth>
                Administracion de Usuarios
              </Button>
            </Paper>

            <Paper
              sx={{
                flex: 1,
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Button
                variant="outlined"
                fullWidth
                disabled={cargandoActivos}
                onClick={ajustarInventario}
              >
                Ajustar Inventario
              </Button>
              {/* Boton oculto por ahora: Ver Reportes de Conteos
              <Button variant="outlined" fullWidth>
                Ver Reportes de Conteos
              </Button>
              */}
            </Paper>
          </Box>
        </Box>
      )}

      <Dialog
        open={abrirCierre}
        onClose={() => setAbrirCierre(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Ajustar Inventario</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Seleccione el conteo a cerrar. Se aplicaran las diferencias al
            inventario.
          </Typography>
          <FormControl size="small" fullWidth>
            <InputLabel id="cierre-conteo-label">Conteo</InputLabel>
            <Select
              labelId="cierre-conteo-label"
              label="Conteo"
              value={conteoCerrarSel}
              onChange={(e) => setConteoCerrarSel(Number(e.target.value))}
            >
              {conteosActivos.map((c) => (
                <MenuItem key={c.idConteo} value={c.idConteo}>
                  #{c.idConteo} - {c.descripcion}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbrirCierre(false)} disabled={cerrando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={confirmarCierre}
            disabled={cerrando || !conteoCerrarSel}
          >
            {cerrando ? <CircularProgress size={20} /> : "Ajustar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
