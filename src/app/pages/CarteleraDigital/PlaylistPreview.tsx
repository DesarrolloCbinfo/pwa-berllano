import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, Card, CardContent,
  Chip, IconButton
} from '@mui/material';
import {
  BrokenImage,
  ChevronLeft, ChevronRight
} from '@mui/icons-material';
import useConsumoApiCartelera from '../../../hooks/useConsumoApiCartelera';
import { ICarteleraSucursal } from './interfaces/ICarteleraSucursal';
import { ApiResponse } from './interfaces/IApiResponse';

interface Props {
  configuraciones: ICarteleraSucursal[];
}

interface IPlaylistItem {
  idContenido: number;
  nombreArchivo: string;
  tipo: number;
  extencion: string;
  duracionSegundos: number;
  orden: number;
  downloadUrl: string;
  base64?: string;
}

const API_BASE = 'https://api.cbinformatica.net:9080';

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export default function PlaylistPreview({ configuraciones }: Props) {
  const { consumoApi: apiCartelera } = useConsumoApiCartelera();

  const [sucursalId, setSucursalId] = useState<number>(0);
  const [items, setItems] = useState<IPlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(0);

  const [filtroDia, setFiltroDia] = useState(0);

  const selectedCfg = configuraciones.find(c => c.idSucursal === sucursalId);
  const apiKey = selectedCfg?.apiKey ?? '';

  const current = items[currentIndex] ?? items[0];

  const fetchPlaylist = useCallback(async () => {
    if (!apiKey || filtroDia <= 0) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiCartelera.get<ApiResponse<IPlaylistItem[]>>(
        `/api/sync/playlist-por-dia?apiKey=${apiKey}&dia=${filtroDia}`
      );
      if (res.data.success) {
        const sorted = [...res.data.data].sort((a, b) => a.orden - b.orden);
        setItems(sorted);
        setCurrentIndex(0);
      } else {
        throw new Error(res.data.message || 'Error al cargar playlist');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [apiKey, filtroDia]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  // Reset image state when current item changes
  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [current?.idContenido]);

  const imgSrc = current?.tipo === 1
    ? current.base64
      ? `data:image/${current.extencion};base64,${current.base64}`
      : `${API_BASE}${current.downloadUrl}?apiKey=${apiKey}`
    : null;

  const videoSrc = current?.tipo === 2
    ? current.base64
      ? `data:video/${current.extencion};base64,${current.base64}`
      : `${API_BASE}${current.downloadUrl}?apiKey=${apiKey}`
    : null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);

  const goPrev = () => setCurrentIndex(i => (i <= 0 ? items.length - 1 : i - 1));
  const goNext = () => setCurrentIndex(i => (i >= items.length - 1 ? 0 : i + 1));

  // Auto-advance timer (images only; videos advance via onEnded)
  useEffect(() => {
    if (!current || items.length === 0) return;
    if (current.tipo === 2) {
      setCountdown(current.duracionSegundos);
      return;
    }

    countdownRef.current = current.duracionSegundos;
    setCountdown(current.duracionSegundos);

    const id = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        goNext();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [current?.idContenido, items.length]);

  // Reset carousel when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [filtroDia]);

  return (
    <Box>
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
            Selecciona una sucursal para ver la vista previa de su playlist.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#90caf9' }}>
              {selectedCfg?.nombre}
            </Typography>
            {items.length > 0 && current && (
              <Typography variant="caption" color="text.secondary">
                {currentIndex + 1} / {items.length}
              </Typography>
            )}
          </Box>

          {/* Day filter */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {DIAS_SEMANA.map(d => (
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

          {filtroDia > 0 && items.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {items.length} contenidos
            </Typography>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} action={
              <Button size="small" onClick={() => fetchPlaylist()}>Reintentar</Button>
            }>{error}</Alert>
          )}

          {loading && items.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : filtroDia === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Selecciona un día para ver la playlist.
            </Typography>
          ) : items.length === 0 || !current ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No hay contenido para este día.
            </Typography>
          ) : (
            <>
              <Card variant="outlined" sx={{
                borderRadius: 3, overflow: 'hidden', mb: 1.5,
                borderColor: '#1e4976', position: 'relative'
              }}>
                <Box sx={{
                  position: 'relative', width: '100%',
                  aspectRatio: '16 / 9',
                  bgcolor: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {current.tipo === 1 && imgSrc ? (
                    !imgLoaded && !imgError ? (
                      <CircularProgress size={32} sx={{ color: '#1976d2' }} />
                    ) : imgError ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <BrokenImage sx={{ fontSize: 48, color: '#546e7a' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          No se pudo cargar
                        </Typography>
                      </Box>
                    ) : null
                  ) : current.tipo === 2 && videoSrc ? (
                    videoError ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <BrokenImage sx={{ fontSize: 48, color: '#546e7a' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          No se pudo cargar el video
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        component="video"
                        ref={videoRef}
                        src={videoSrc}
                        autoPlay
                        muted
                        playsInline
                        onEnded={goNext}
                        onError={() => setVideoError(true)}
                        onTimeUpdate={() => {
                          const v = videoRef.current;
                          if (v?.duration) setVideoProgress(v.currentTime / v.duration);
                        }}
                        onLoadedMetadata={() => {
                          const v = videoRef.current;
                          if (v?.duration) setVideoProgress(0);
                        }}
                        sx={{
                          position: 'absolute', inset: 0,
                          width: '100%', height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    )
                  ) : null}
                  {imgSrc && (
                    <Box
                      component="img"
                      src={imgSrc}
                      alt=""
                      onLoad={() => { setImgLoaded(true); setImgError(false); }}
                      onError={() => { setImgError(true); setImgLoaded(false); }}
                      sx={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'contain',
                        opacity: imgLoaded ? 1 : 0,
                        transition: 'opacity 0.2s',
                      }}
                    />
                  )}

                  {/* Countdown progress bar */}
                  <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                    bgcolor: 'rgba(255,255,255,0.15)',
                  }}>
                    <Box sx={{
                      height: '100%',
                      width: current.tipo === 1
                        ? `${(countdown / (current.duracionSegundos || 1)) * 100}%`
                        : `${videoProgress * 100}%`,
                      bgcolor: current.tipo === 1 ? '#1976d2' : '#ef5350',
                      transition: current.tipo === 1 ? 'width 1s linear' : 'none',
                    }} />
                  </Box>

                  {items.length > 1 && (
                    <>
                      <IconButton
                        onClick={goPrev}
                        sx={{
                          position: 'absolute', left: 8, top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: 'rgba(0,0,0,0.5)', color: '#fff',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                          zIndex: 2
                        }}
                      >
                        <ChevronLeft />
                      </IconButton>
                      <IconButton
                        onClick={goNext}
                        sx={{
                          position: 'absolute', right: 8, top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: 'rgba(0,0,0,0.5)', color: '#fff',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                          zIndex: 2
                        }}
                      >
                        <ChevronRight />
                      </IconButton>
                    </>
                  )}
                </Box>

                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Chip label={current.extencion.toUpperCase()} size="small"
                        color={current.tipo === 1 ? 'primary' : 'error'} variant="outlined"
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }} noWrap>
                        {current.nombreArchivo || `Contenido #${current.idContenido}`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <Chip label={`#${current.orden}`} size="small" variant="outlined"
                        sx={{ color: '#90caf9', borderColor: '#1e4976' }}
                      />
                      <Chip label={`${countdown}s`} size="small"
                        color={countdown <= 3 ? 'error' : 'secondary'} variant="outlined"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {items.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  {items.map((_, i) => (
                    <Box
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      sx={{
                        width: i === currentIndex ? 20 : 10,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: i === currentIndex ? '#1976d2' : '#1e4976',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
