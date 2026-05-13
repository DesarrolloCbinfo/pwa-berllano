import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Select, MenuItem, FormControl,
  InputLabel, IconButton, Card, CardContent, CircularProgress, Alert,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButtonGroup, ToggleButton, Divider
} from '@mui/material';
import {
  ArrowBack, Visibility, VisibilityOff, Edit, Delete,
  Image, Movie, CloudUpload, Close
} from '@mui/icons-material';
import useConsumoApi from '../../../hooks/useConsumoApi';
import useConsumoApiCartelera from '../../../hooks/useConsumoApiCartelera';
import { useSessionContext } from '../../../context/SessionProvider';
import { ICarteleraSucursal } from './interfaces/ICarteleraSucursal';
import { ICarteleraContenido } from './interfaces/ICarteleraContenido';
import { ApiResponse } from './interfaces/IApiResponse';
import Swal from 'sweetalert2';
import { routes } from '../../../utils/Routes';

interface SucursalMain {
  sucursalId: number;
  nombre: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CarteleraDigital() {
  const { consumoApi: apiMain } = useConsumoApi();
  const { consumoApi: apiCartelera } = useConsumoApiCartelera();
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- API Keys state ---
  const [sucursalesAll, setSucursalesAll] = useState<SucursalMain[]>([]);
  const [configuraciones, setConfiguraciones] = useState<ICarteleraSucursal[]>([]);
  const [selectedSucId, setSelectedSucId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const apiKeyConfigActual = configuraciones.find(
    c => c.nombre.toLowerCase() === nombre.trim().toLowerCase()
  );
  const isEditingKey = apiKeyConfigActual !== undefined;

  // --- Contenido state ---
  const [contenidos, setContenidos] = useState<ICarteleraContenido[]>([]);
  const [filtroTipo, setFiltroTipo] = useState(0);
  const [loadingContenido, setLoadingContenido] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadTipo, setUploadTipo] = useState(1);
  const [uploadNombre, setUploadNombre] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // --- API Keys logic ---
  const fetchSucursalesMain = async () => {
    const res = await apiMain.get<SucursalMain[]>('/api/sucursal/sucursal?sucursal=0');
    return res.data;
  };

  const fetchConfiguraciones = async () => {
    const res = await apiCartelera.get<ApiResponse<ICarteleraSucursal[]>>('/api/Sucursales/0');
    if (res.data.success) return res.data.data;
    throw new Error(res.data.message || 'Error al cargar configuraciones');
  };

  const selectSucursal = (
    sucId: number,
    all = sucursalesAll,
    configs = configuraciones
  ) => {
    const found = all.find(s => s.sucursalId === sucId);
    if (!found) return;
    setSelectedSucId(sucId);
    setNombre(found.nombre);
    const cfg = configs.find(
      c => c.nombre.toLowerCase() === found.nombre.toLowerCase()
    );
    setApiKey(cfg?.apiKey ?? '');
    setShowKey(false);
  };

  const resetApiKeyForm = () => {
    setSelectedSucId(null);
    setNombre('');
    setApiKey('');
    setShowKey(false);
  };

  const handleSelectChange = (sucId: number) => {
    if (sucId === 0) { resetApiKeyForm(); return; }
    selectSucursal(sucId);
  };

  const selectByNombre = (cfg: ICarteleraSucursal) => {
    const match = sucursalesAll.find(
      s => s.nombre.toLowerCase() === cfg.nombre.toLowerCase()
    );
    if (match) {
      selectSucursal(match.sucursalId);
    } else {
      setSelectedSucId(null);
      setNombre(cfg.nombre);
      setApiKey(cfg.apiKey);
      setShowKey(false);
    }
  };

  const validateApiKey = (): string | null => {
    if (!nombre.trim()) return 'El nombre es obligatorio';
    if (apiKey.length < 6) return 'La API Key debe tener al menos 6 caracteres';
    return null;
  };

  const handleSaveApiKey = async () => {
    const error = validateApiKey();
    if (error) {
      Swal.fire('Validación', error, 'warning');
      return;
    }
    setSaving(true);
    try {
      if (isEditingKey) {
        const res = await apiCartelera.put<ApiResponse<{ id: number }>>(
          `/api/Sucursales/${apiKeyConfigActual!.idSucursal}`,
          { idSucursal: apiKeyConfigActual!.idSucursal, nombre: nombre.trim(), apiKey }
        );
        if (!res.data.success) throw new Error(res.data.message || 'Error al actualizar');
      } else {
        const res = await apiCartelera.post<ApiResponse<ICarteleraSucursal>>(
          '/api/Sucursales',
          { idSucursal: 0, nombre: nombre.trim(), apiKey }
        );
        if (!res.data.success) throw new Error(res.data.message || 'Error al crear');
      }
      Swal.fire({ icon: 'success', title: isEditingKey ? 'Actualizada' : 'Creada', text: `API Key ${isEditingKey ? 'actualizada' : 'creada'} correctamente`, timer: 1500, showConfirmButton: false });
      const configs = await fetchConfiguraciones();
      setConfiguraciones(configs);
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApiKey = async (cfg: ICarteleraSucursal) => {
    const result = await Swal.fire({
      title: '¿Eliminar?',
      text: `Se eliminará la API Key de "${cfg.nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    setDeleting(true);
    try {
      const res = await apiCartelera.delete<ApiResponse<null>>(`/api/Sucursales/${cfg.idSucursal}`);
      if (!res.data.success) throw new Error(res.data.message || 'Error al eliminar');
      Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1500, showConfirmButton: false });
      const configs = await fetchConfiguraciones();
      setConfiguraciones(configs);
      if (selectedSucId && nombre.trim().toLowerCase() === cfg.nombre.toLowerCase()) {
        setApiKey('');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Error al eliminar', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // --- Contenido logic ---
  const fetchContenidos = useCallback(async (tipo = filtroTipo) => {
    try {
      setLoadingContenido(true);
      const res = await apiCartelera.get<ApiResponse<ICarteleraContenido[]>>(`/api/Contenido/0?tipo=${tipo}`);
      if (res.data.success) {
        setContenidos(res.data.data);
      }
    } catch {
      // silent
    } finally {
      setLoadingContenido(false);
    }
  }, [filtroTipo]);

  useEffect(() => {
    fetchContenidos();
  }, [filtroTipo, fetchContenidos]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      Swal.fire('Validación', 'Selecciona un archivo', 'warning');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('nombreArchivo', uploadNombre.trim() || uploadFile.name.replace(/\.[^.]+$/, ''));
      formData.append('tipo', String(uploadTipo));

      const res = await apiCartelera.post('/api/upload/contenido', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Subido', text: 'Contenido subido correctamente', timer: 1500, showConfirmButton: false });
        setModalOpen(false);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadNombre('');
        fetchContenidos(filtroTipo);
      } else {
        throw new Error(res.data.message || 'Error al subir');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Error al subir el archivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    if (uploading) return;
    setModalOpen(false);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadNombre('');
    setUploadTipo(1);
  };

  // --- Initial load ---
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [sucursales, configs] = await Promise.all([
        fetchSucursalesMain(),
        fetchConfiguraciones()
      ]);
      setSucursalesAll(sucursales);
      setConfiguraciones(configs);
      if (session?.dSucursal) {
        const match = sucursales.find(
          s => s.nombre.toLowerCase() === session.dSucursal.toLowerCase()
        );
        if (match) selectSucursal(match.sucursalId, sucursales, configs);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 3, minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(routes.mainMenu)} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a365d' }}>
          Cartelera Digital
        </Typography>
      </Box>

      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button size="small" onClick={loadAll}>Reintentar</Button>
        }>{fetchError}</Alert>
      )}

      {/* ══════ API KEYS SECTION ══════ */}
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1a365d', mb: 2 }}>
        Config. API Keys
      </Typography>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Sucursal</InputLabel>
        <Select
          value={selectedSucId ?? 0}
          label="Sucursal"
          onChange={(e) => handleSelectChange(Number(e.target.value))}
        >
          <MenuItem value={0}>-- Selecciona sucursal --</MenuItem>
          {sucursalesAll.map(s => (
            <MenuItem key={s.sucursalId} value={s.sucursalId}>{s.nombre}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <TextField
            fullWidth size="small" label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth size="small" label="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type={showKey ? 'text' : 'password'}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowKey(!showKey)} edge="end">
                      {showKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            sx={{ mb: 2.5 }}
          />
          <Button
            variant="contained" fullWidth size="large"
            onClick={handleSaveApiKey} disabled={saving || !nombre.trim()}
            sx={{ textTransform: 'none', fontWeight: 'bold', py: 1.2, borderRadius: 2 }}
          >
            {saving ? <CircularProgress size={22} sx={{ color: 'white' }} /> : (isEditingKey ? 'Actualizar API Key' : 'Guardar API Key')}
          </Button>
        </CardContent>
      </Card>

      <Typography variant="subtitle2" sx={{ color: '#666', mb: 1.5, fontWeight: 600 }}>
        API Keys configuradas ({configuraciones.length})
      </Typography>

      {configuraciones.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, mb: 2 }}>
          No hay API Keys configuradas.
        </Typography>
      ) : (
        configuraciones.map(s => (
          <Card key={s.idSucursal} variant="outlined" sx={{
            borderRadius: 2, mb: 1.5, cursor: 'pointer',
            borderColor: isEditingKey && apiKeyConfigActual!.idSucursal === s.idSucursal ? '#1976d2' : '#e0e0e0',
            bgcolor: isEditingKey && apiKeyConfigActual!.idSucursal === s.idSucursal ? '#e3f2fd' : 'white',
            transition: 'all 0.2s',
            '&:hover': { borderColor: '#1976d2' }
          }} onClick={() => selectByNombre(s)}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{s.nombre}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                  API Key: {'●'.repeat(Math.min(s.apiKey.length, 16))}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); selectByNombre(s); }}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteApiKey(s); }} disabled={deleting}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      <Divider sx={{ my: 3 }} />

      {/* ══════ CONTENIDO DIGITAL SECTION ══════ */}
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1a365d', mb: 2 }}>
        Contenido Digital
      </Typography>

      <ToggleButtonGroup
        value={filtroTipo}
        exclusive
        onChange={(_, val) => { if (val !== null) setFiltroTipo(val); }}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
      >
        <ToggleButton value={0}>Todos</ToggleButton>
        <ToggleButton value={1}>Imágenes</ToggleButton>
        <ToggleButton value={2}>Videos</ToggleButton>
      </ToggleButtonGroup>

      <Button
        variant="contained" fullWidth size="large"
        startIcon={<CloudUpload />}
        onClick={() => setModalOpen(true)}
        sx={{ textTransform: 'none', fontWeight: 'bold', py: 1.2, borderRadius: 2, mb: 2.5 }}
      >
        Cargar Contenido
      </Button>

      {loadingContenido ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : contenidos.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No hay contenido disponible.
        </Typography>
      ) : (
        contenidos.map(c => (
          <Card key={c.idContenido} variant="outlined" sx={{ borderRadius: 2, mb: 1.5 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: 1.5,
                bgcolor: c.tipo === 1 ? '#e3f2fd' : '#fce4ec',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {c.tipo === 1 ? <Image sx={{ color: '#1976d2' }} /> : <Movie sx={{ color: '#d32f2f' }} />}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, truncate: true }} noWrap>
                  {c.nombreOriginal}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.tipo === 1 ? 'Imagen' : 'Video'} · {formatBytes(c.pesobytes)} · {formatDate(c.fechaCarga)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* ══════ UPLOAD MODAL ══════ */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          Cargar Contenido
          <IconButton size="small" onClick={handleCloseModal} disabled={uploading}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={uploadTipo} label="Tipo" onChange={(e) => setUploadTipo(Number(e.target.value))}>
              <MenuItem value={1}>Imagen</MenuItem>
              <MenuItem value={2}>Video</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth size="small" label="Nombre del archivo (opcional)"
            value={uploadNombre}
            onChange={(e) => setUploadNombre(e.target.value)}
            placeholder={uploadFile ? uploadFile.name.replace(/\.[^.]+$/, '') : ''}
            sx={{ mb: 2 }}
          />

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept={uploadTipo === 1 ? 'image/*' : 'video/*'}
            onChange={handleFileSelect}
          />

          <Button
            variant="outlined" fullWidth
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ textTransform: 'none', py: 1.2, borderRadius: 2, mb: 2 }}
          >
            {uploadFile ? uploadFile.name : 'Seleccionar archivo'}
          </Button>

          {uploadPreview && (
            <Box sx={{ borderRadius: 2, overflow: 'hidden', mb: 1 }}>
              <img src={uploadPreview} alt="Preview" style={{ width: '100%', maxHeight: 250, objectFit: 'contain', display: 'block' }} />
            </Box>
          )}

          {uploadFile && !uploadPreview && uploadTipo === 2 && (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5', borderRadius: 2, mb: 1 }}>
              <Movie sx={{ fontSize: 48, color: '#d32f2f' }} />
              <Typography variant="body2" color="text.secondary">Video seleccionado</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseModal} color="inherit" disabled={uploading}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading || !uploadFile}>
            {uploading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Subir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
