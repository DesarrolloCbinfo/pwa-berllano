import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  ArrowBack, Download, Delete,
  Image, Movie, CloudUpload, Close,
  PhotoLibrary, Schedule, PlaylistPlay
} from '@mui/icons-material';
import {
  Box, Typography, TextField, Button, Select, MenuItem, FormControl,
  InputLabel, IconButton, Card, CardContent, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButtonGroup, ToggleButton, Tabs, Tab, LinearProgress
} from '@mui/material';
import useConsumoApiCartelera from '../../../hooks/useConsumoApiCartelera';
import { ICarteleraSucursal } from './interfaces/ICarteleraSucursal';
import { ICarteleraContenido } from './interfaces/ICarteleraContenido';
import { ApiResponse } from './interfaces/IApiResponse';
import Swal from 'sweetalert2';
import { routes } from '../../../utils/Routes';
import carteleraTheme from './carteleraTheme';
import ProgramacionTab from './ProgramacionTab';
import PlaylistPreview from './PlaylistPreview';
import './cartelera-digital.css';

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
  const { consumoApi: apiCartelera } = useConsumoApiCartelera();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [configuraciones, setConfiguraciones] = useState<ICarteleraSucursal[]>([]);
  const [contenidos, setContenidos] = useState<ICarteleraContenido[]>([]);
  const [filtroTipo, setFiltroTipo] = useState(0);
  const [loadingContenido, setLoadingContenido] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadTipo, setUploadTipo] = useState(1);
  const [uploadNombre, setUploadNombre] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  // --- Fetch configuraciones (for Programacion/VistaPrevia) ---
  const fetchConfiguraciones = useCallback(async () => {
    try {
      const res = await apiCartelera.get<ApiResponse<ICarteleraSucursal[]>>('/api/Sucursales/0');
      if (res.data.success) setConfiguraciones(res.data.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchConfiguraciones();
  }, [fetchConfiguraciones]);

  // --- Fetch contenido ---
  const fetchContenidos = useCallback(async (tipo = filtroTipo) => {
    try {
      setLoadingContenido(true);
      const res = await apiCartelera.get<ApiResponse<ICarteleraContenido[]>>(`/api/Contenido/0?tipo=${tipo}`);
      if (res.data.success) setContenidos(res.data.data);
    } catch {
      // silent
    } finally {
      setLoadingContenido(false);
    }
  }, [filtroTipo]);

  useEffect(() => {
    fetchContenidos();
  }, [filtroTipo, fetchContenidos]);

  const handleDownload = async (id: number, nombre: string) => {
    try {
      const res = await apiCartelera.get(`/api/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombre);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      Swal.fire('Error', 'No se pudo descargar el archivo', 'error');
    }
  };

  const handleDeleteContenido = async (id: number, nombre: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar?',
      text: `Se eliminará "${nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await apiCartelera.delete<ApiResponse<null>>(`/api/Contenido/${id}`);
      if (!res.data.success) throw new Error(res.data.message || 'Error al eliminar');
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
      fetchContenidos(filtroTipo);
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Error al eliminar', 'error');
    }
  };

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
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('nombreArchivo', uploadNombre.trim() || uploadFile.name.replace(/\.[^.]+$/, ''));
      formData.append('tipo', String(uploadTipo));

      const res = await apiCartelera.post('/api/upload/contenido', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
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
    setUploadProgress(0);
  };

  return (
    <ThemeProvider theme={carteleraTheme}>
      <CssBaseline />
      <Box className="cartelera-root" sx={{ position: 'relative' }}>
        <Box className="cartelera-header" sx={{ position: 'sticky', top: 0, zIndex: 10, px: 2, py: 1.5 }}>
          <Box sx={{ maxWidth: 900, mx: 'auto', display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate(routes.mainMenu)} sx={{ mr: 1, color: '#90caf9' }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
              Cartelera Digital
            </Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{
              mb: 3,
              '& .MuiTab-root': { color: '#90caf9', fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' },
              '& .Mui-selected': { color: '#ffffff' },
              '& .MuiTabs-indicator': { backgroundColor: '#1976d2' },
            }}
          >
            <Tab icon={<PhotoLibrary />} iconPosition="start" label="Contenido" />
            <Tab icon={<Schedule />} iconPosition="start" label="Programación" />
            <Tab icon={<PlaylistPlay />} iconPosition="start" label="Vista Previa" />
          </Tabs>

          {/* ══════ TAB 0: CONTENIDO DIGITAL ══════ */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#90caf9', mb: 2 }}>
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
                sx={{ fontWeight: 'bold', py: 1.2, mb: 2.5 }}
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
                  <Card key={c.idContenido} variant="outlined" sx={{ mb: 1.5 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: 1.5,
                        bgcolor: c.tipo === 1 ? 'rgba(25,118,210,0.15)' : 'rgba(244,67,54,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {c.tipo === 1 ? <Image sx={{ color: '#42a5f5' }} /> : <Movie sx={{ color: '#ef5350' }} />}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }} noWrap>
                          {c.nombreOriginal}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.tipo === 1 ? 'Imagen' : 'Video'} · {formatBytes(c.pesobytes)} · {formatDate(c.fechaCarga)}
                        </Typography>
                      </Box>
                      <IconButton size="small" color="primary" onClick={() => handleDownload(c.idContenido, c.nombreOriginal)}>
                        <Download fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteContenido(c.idContenido, c.nombreOriginal)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          )}

          {/* ══════ TAB 1: PROGRAMACIÓN ══════ */}
          {tabValue === 1 && (
            <ProgramacionTab configuraciones={configuraciones} contenidos={contenidos} />
          )}

          {/* ══════ TAB 2: VISTA PREVIA ══════ */}
          {tabValue === 2 && (
            <PlaylistPreview configuraciones={configuraciones} />
          )}

          {/* ══════ UPLOAD MODAL ══════ */}
          <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Cargar Contenido
              <IconButton size="small" onClick={handleCloseModal} disabled={uploading} sx={{ color: '#90caf9' }}>
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
                sx={{ py: 1.2, mb: 2 }}
              >
                {uploadFile ? uploadFile.name : 'Seleccionar archivo'}
              </Button>

              {uploadPreview && (
                <Box sx={{ borderRadius: 2, overflow: 'hidden', mb: 1 }}>
                  <img src={uploadPreview} alt="Preview" style={{ width: '100%', maxHeight: 250, objectFit: 'contain', display: 'block' }} />
                </Box>
              )}

              {uploadFile && !uploadPreview && uploadTipo === 2 && (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#0a1929', borderRadius: 2, mb: 1 }}>
                  <Movie sx={{ fontSize: 48, color: '#ef5350' }} />
                  <Typography variant="body2" color="text.secondary">Video seleccionado</Typography>
                </Box>
              )}

              {uploading && (
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {uploadProgress < 100 ? 'Subiendo...' : 'Procesando...'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {uploadProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant={uploadProgress < 100 ? 'determinate' : 'indeterminate'}
                    value={uploadProgress}
                    sx={{ borderRadius: 1, height: 6 }}
                  />
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
      </Box>
    </ThemeProvider>
  );
}
