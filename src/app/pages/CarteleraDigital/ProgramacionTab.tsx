import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, CircularProgress, Alert,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Card, CardContent
} from '@mui/material';
import { Add, Edit, Delete, Schedule, DragIndicator } from '@mui/icons-material';
import useConsumoApiCartelera from '../../../hooks/useConsumoApiCartelera';
import { ICarteleraContenido } from './interfaces/ICarteleraContenido';
import { ICarteleraSucursal } from './interfaces/ICarteleraSucursal';
import { ApiResponse } from './interfaces/IApiResponse';
import { IProgramacion, IProgramacionPayload } from './interfaces/IProgramacion';
import Swal from 'sweetalert2';

interface Props {
  configuraciones: ICarteleraSucursal[];
  contenidos: ICarteleraContenido[];
}

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  return `${parts[0]}:${parts[1]}`;
}

export default function ProgramacionTab({ configuraciones, contenidos }: Props) {
  const { consumoApi: apiCartelera } = useConsumoApiCartelera();

  const [sucursalId, setSucursalId] = useState<number>(0);
  const [programaciones, setProgramaciones] = useState<IProgramacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IProgramacion | null>(null);
  const [form, setForm] = useState<IProgramacionPayload>({
    idSucursal: 0,
    idContenido: 0,
    diaSemana: 1,
    horainicio: '08:00:00',
    horafin: '18:00:00',
    orden: 1,
    duracionSegundos: 10,
  });
  const [saving, setSaving] = useState(false);

  const [filtroDia, setFiltroDia] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const programacionesFiltradas = useMemo(
    () => programaciones
      .filter(p => filtroDia === 0 || p.diaSemana === filtroDia)
      .sort((a, b) => a.orden - b.orden),
    [programaciones, filtroDia]
  );

  const selectedCfg = configuraciones.find(c => c.idSucursal === sucursalId);
  const apiKey = selectedCfg?.apiKey ?? '';

  const fetchProgramaciones = useCallback(async (showLoading: boolean) => {
    if (!apiKey) return;
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await apiCartelera.get<ApiResponse<IProgramacion[]>>(`/api/Programacion?apiKey=${apiKey}`);
      if (res.data.success) {
        setProgramaciones(res.data.data);
      } else {
        throw new Error(res.data.message || 'Error al cargar programación');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [apiKey, apiCartelera]);

  useEffect(() => {
    if (!apiKey) return;
    fetchProgramaciones(programaciones.length === 0);
  }, [apiKey, sucursalId, programaciones.length, fetchProgramaciones]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({
      idSucursal: sucursalId,
      idContenido: 0,
      diaSemana: 1,
      horainicio: '08:00:00',
      horafin: '18:00:00',
      orden: 1,
      duracionSegundos: 10,
    });
    setModalOpen(true);
  };

  const openEditModal = (prog: IProgramacion) => {
    setEditing(prog);
    setForm({
      idSucursal: prog.idSucursal,
      idContenido: prog.idContenido,
      diaSemana: prog.diaSemana,
      horainicio: prog.horainicio,
      horafin: prog.horafin,
      orden: prog.orden,
      duracionSegundos: prog.duracionSegundos,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.idContenido) {
      Swal.fire('Validación', 'Selecciona un contenido', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await apiCartelera.put<ApiResponse<{ id: number }>>(
          `/api/Programacion/${editing.idProgramacion}`,
          form
        );
        if (!res.data.success) throw new Error(res.data.message || 'Error al actualizar');
        Swal.fire({ icon: 'success', title: 'Actualizada', timer: 1500, showConfirmButton: false });
      } else {
        const res = await apiCartelera.post<ApiResponse<{ idProgramacion: number }>>(
          '/api/Programacion',
          form
        );
        if (!res.data.success) throw new Error(res.data.message || 'Error al crear');
        Swal.fire({ icon: 'success', title: 'Creada', timer: 1500, showConfirmButton: false });
      }
      setModalOpen(false);
      fetchProgramaciones(true);
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prog: IProgramacion) => {
    const result = await Swal.fire({
      title: '¿Eliminar?',
      text: `Se eliminará la programación de "${prog.nombreContenido}" (${prog.nombreSucursal})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await apiCartelera.delete<ApiResponse<null>>(`/api/Programacion/${prog.idProgramacion}`);
      if (!res.data.success) throw new Error(res.data.message || 'Error al eliminar');
      Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1500, showConfirmButton: false });
      fetchProgramaciones(true);
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Error al eliminar', 'error');
    }
  };

  const handleReorder = async (fromIdx: number, toIdx: number) => {
    const items = [...programacionesFiltradas];
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);

    const updated = items.map((item, i) => ({ ...item, orden: i + 1 }));
    const changed = updated.filter(u => {
      const original = programacionesFiltradas.find(p => p.idProgramacion === u.idProgramacion);
      return original && u.orden !== original.orden;
    });
    if (changed.length === 0) return;

    const updatedIds = new Set(updated.map(u => u.idProgramacion));
    setProgramaciones(programaciones.map(
      p => updatedIds.has(p.idProgramacion) ? updated.find(u => u.idProgramacion === p.idProgramacion)! : p
    ));
    setDragIndex(null);
    setDragOverIndex(null);
    setReordering(true);

    try {
      await Promise.all(changed.map(item =>
        apiCartelera.put(`/api/Programacion/${item.idProgramacion}`, {
          idSucursal: item.idSucursal,
          idContenido: item.idContenido,
          diaSemana: item.diaSemana,
          horainicio: item.horainicio,
          horafin: item.horafin,
          orden: item.orden,
          duracionSegundos: item.duracionSegundos,
        } as IProgramacionPayload)
      ));
    } catch {
      Swal.fire('Error', 'No se pudo guardar el nuevo orden. Revirtiendo...', 'error');
      fetchProgramaciones(false);
    } finally {
      setReordering(false);
    }
  };

  return (
    <Box>
      {/* Selector de sucursal */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Sucursal (API Key)</InputLabel>
        <Select
          value={sucursalId}
          label="Sucursal (API Key)"
          onChange={(e) => setSucursalId(Number(e.target.value))}
        >
          <MenuItem value={0}>-- Selecciona sucursal --</MenuItem>
          {configuraciones.map(c => (
            <MenuItem key={c.idSucursal} value={c.idSucursal}>
              {c.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!sucursalId ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            Selecciona una sucursal para gestionar su programación.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#90caf9' }}>
              Programación de Reproducción — {selectedCfg?.nombre}
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateModal}>
              Nueva Programación
            </Button>
          </Box>

          {/* Day filter */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {[{ value: 0, label: 'Todos' }, ...DIAS_SEMANA].map(d => (
              <Chip
                key={d.value}
                label={d.label}
                size="small"
                onClick={() => setFiltroDia(d.value)}
                color={filtroDia === d.value ? 'primary' : 'default'}
                variant={filtroDia === d.value ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: filtroDia === d.value ? 700 : 400,
                  color: filtroDia === d.value ? '#fff' : '#b2bac2',
                  borderColor: '#1e4976',
                }}
              />
            ))}
          </Box>

          {filtroDia !== 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Mostrando {programacionesFiltradas.length} de {programaciones.length} programaciones
            </Typography>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} action={
              <Button size="small" onClick={() => fetchProgramaciones(true)}>Reintentar</Button>
            }>{error}</Alert>
          )}

          {reordering && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }} icon={<CircularProgress size={16} />}>
              Guardando orden...
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : programacionesFiltradas.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {programaciones.length === 0
                ? 'No hay programaciones configuradas para esta sucursal.'
                : 'No hay programaciones para este día.'}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {programacionesFiltradas.map((p, idx) => (
                <Card
                  key={p.idProgramacion}
                  variant="outlined"
                  draggable={!reordering && programacionesFiltradas.length > 1}
                  onDragStart={(e) => {
                    setDragIndex(idx);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragIndex !== idx) setDragOverIndex(idx);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    if (dragIndex === null || dragIndex === idx || reordering) return;
                    handleReorder(dragIndex, idx);
                  }}
                  sx={{
                    borderRadius: 2,
                    borderColor: dragOverIndex === idx ? '#1976d2' : '#1e4976',
                    borderWidth: dragOverIndex === idx ? 2 : 1,
                    opacity: dragIndex === idx ? 0.4 : 1,
                    cursor: reordering || programacionesFiltradas.length <= 1 ? 'default' : 'grab',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: dragOverIndex === idx ? '#1976d2' : '#1976d2' },
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        {programacionesFiltradas.length > 1 && (
                          <DragIndicator sx={{ color: '#546e7a', cursor: 'grab', flexShrink: 0 }} fontSize="small" />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip label={p.extencion?.toUpperCase()} size="small" color={p.tipo === 1 ? 'primary' : 'error'} variant="outlined" />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }} noWrap>
                              {p.nombreContenido}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {p.nombreSucursal}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            <Chip
                              label={DIAS_SEMANA.find(d => d.value === p.diaSemana)?.label}
                              size="small"
                              variant="outlined"
                              sx={{ color: '#90caf9', borderColor: '#1e4976', fontSize: 11 }}
                            />
                            <Chip
                              icon={<Schedule fontSize="small" />}
                              label={`${formatTime(p.horainicio)} - ${formatTime(p.horafin)}`}
                              size="small"
                              variant="outlined"
                              sx={{ color: '#90caf9', borderColor: '#1e4976', fontSize: 11 }}
                            />
                            <Chip
                              label={`#${p.orden}`}
                              size="small"
                              variant="outlined"
                              sx={{ color: '#90caf9', borderColor: '#1e4976', fontSize: 11 }}
                            />
                            <Chip
                              label={`${p.duracionSegundos}s`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ fontSize: 11 }}
                            />
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        <IconButton size="small" color="primary" onClick={() => openEditModal(p)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(p)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Modal Crear/Editar */}
          <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 600 }}>
              {editing ? 'Editar Programación' : 'Nueva Programación'}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Contenido</InputLabel>
                <Select
                  value={form.idContenido}
                  label="Contenido"
                  onChange={(e) => setForm(f => ({ ...f, idContenido: Number(e.target.value) }))}
                >
                  <MenuItem value={0}>-- Selecciona contenido --</MenuItem>
                  {contenidos.map(c => (
                    <MenuItem key={c.idContenido} value={c.idContenido}>
                      {c.nombreOriginal} ({c.tipo === 1 ? 'Imagen' : 'Video'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Día de la semana</InputLabel>
                <Select
                  value={form.diaSemana}
                  label="Día de la semana"
                  onChange={(e) => setForm(f => ({ ...f, diaSemana: Number(e.target.value) }))}
                >
                  {DIAS_SEMANA.map(d => (
                    <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth size="small" label="Hora inicio"
                  type="time"
                  value={form.horainicio.substring(0, 5)}
                  onChange={(e) => setForm(f => ({ ...f, horainicio: e.target.value + ':00' }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  fullWidth size="small" label="Hora fin"
                  type="time"
                  value={form.horafin.substring(0, 5)}
                  onChange={(e) => setForm(f => ({ ...f, horafin: e.target.value + ':00' }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth size="small" label="Orden"
                  type="number"
                  value={form.orden}
                  onChange={(e) => setForm(f => ({ ...f, orden: Number(e.target.value) }))}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
                <TextField
                  fullWidth size="small" label="Duración (segundos)"
                  type="number"
                  value={form.duracionSegundos}
                  onChange={(e) => setForm(f => ({ ...f, duracionSegundos: Number(e.target.value) }))}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button onClick={() => setModalOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (editing ? 'Actualizar' : 'Crear')}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}
