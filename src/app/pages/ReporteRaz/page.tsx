import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Assessment from '@mui/icons-material/Assessment';
import Download from '@mui/icons-material/Download';
import Search from '@mui/icons-material/Search';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { routes } from '../../../utils/Routes';
import { ReporteRazApis } from './apis/ReporteRazApis';
import RazSection from './components/RazSection';
import { exportarExcelRaz } from './exportarExcel';
import { mesesRaz, normalizarRaz, parametrosRaz, seccionesRaz } from './reporte';
import type { PeriodoRaz } from './reporte';

function mensajeError(error: Error) {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === 'object' && data !== null) {
      for (const propiedad of ['detail', 'mensaje', 'title']) {
        const detalle = (data as Record<string, unknown>)[propiedad];
        if (typeof detalle === 'string' && detalle.trim()) return detalle;
      }
    }
  }
  return error.message;
}

export default function ReporteRazPage() {
  const navigate = useNavigate();
  const { consumoApi } = useConsumoApi();
  const queryClient = useQueryClient();
  const [anio, setAnio] = useState(() => String(new Date().getFullYear()));
  const [mes, setMes] = useState(() => new Date().getMonth() + 1);
  const [consulta, setConsulta] = useState<PeriodoRaz | null>(null);
  const [mensaje, setMensaje] = useState('');

  const reporte = useQuery({
    queryKey: ['reporte-raz', consulta],
    enabled: consulta !== null,
    queryFn: async ({ signal }) => {
      if (!consulta) throw new Error('Selecciona el año y el mes.');
      const { data } = await consumoApi.get<unknown>(ReporteRazApis.consumo, {
        params: parametrosRaz(consulta), signal, timeout: 120_000,
      });
      return normalizarRaz(data);
    },
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const consultando = consulta !== null && reporte.isFetching;
  const filas = reporte.isError ? [] : reporte.data ?? [];

  const consultar = () => {
    const periodo = { anio: Number(anio), mes };
    try {
      parametrosRaz(periodo);
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'Revisa el año y el mes.');
      return;
    }
    setMensaje('');
    void queryClient.invalidateQueries({ queryKey: ['reporte-raz', periodo], exact: true });
    setConsulta(periodo);
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton aria-label="Regresar al menú principal" onClick={() => navigate(routes.mainMenu)}>
          <ArrowBack />
        </IconButton>
        <Assessment sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h4">Reporte Raz</Typography>
          <Typography variant="body2" sx={{ color: 'grey.700' }}>Ventas por día y sucursal</Typography>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Periodo del reporte</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            label="Año" type="number" size="small" required value={anio} disabled={consultando}
            inputProps={{ min: 1900, max: 9999, step: 1 }} sx={{ width: { xs: '100%', sm: 160 } }}
            onChange={(event) => { setAnio(event.target.value); setConsulta(null); setMensaje(''); }}
          />
          <TextField
            label="Mes" select size="small" required value={mes} disabled={consultando}
            sx={{ width: { xs: '100%', sm: 200 } }}
            onChange={(event) => { setMes(Number(event.target.value)); setConsulta(null); setMensaje(''); }}
          >
            {mesesRaz.map((nombre, indice) => <MenuItem key={nombre} value={indice + 1}>{nombre}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={consultar} disabled={consultando} startIcon={consultando ? <CircularProgress size={16} color="inherit" /> : <Search />}>
            {consultando ? 'Consultando...' : 'Consultar'}
          </Button>
          <Button variant="outlined" startIcon={<Download />} disabled={filas.length === 0 || consultando} onClick={() => {
            if (consulta) exportarExcelRaz(filas, consulta);
          }}>Excel</Button>
        </Stack>
      </Paper>

      {mensaje && <Alert severity="warning" sx={{ mb: 2 }}>{mensaje}</Alert>}
      {consulta && reporte.isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => void reporte.refetch()}>Reintentar</Button>}>
          No fue posible consultar el Reporte Raz: {mensajeError(reporte.error)}
        </Alert>
      )}
      {consultando && (
        <Stack role="status" direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ py: 3 }}>
          <CircularProgress size={22} /><Typography>Consultando Reporte Raz...</Typography>
        </Stack>
      )}

      {consulta && filas.length > 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">{mesesRaz[consulta.mes - 1]} de {consulta.anio}</Typography>
            <Typography variant="body2" sx={{ color: 'grey.700' }}>
              {filas.length} día(s) con información. Cada sección muestra los totales del periodo consultado.
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.700' }}>— indica un dato no informado.</Typography>
          </Box>
          <Stack spacing={3} aria-busy={consultando}>
            {seccionesRaz.map((seccion) => <RazSection key={seccion.id} seccion={seccion} filas={filas} />)}
            <Paper component="section" variant="outlined" aria-labelledby="raz-depositos" sx={{ p: 2 }}>
              <Typography id="raz-depositos" variant="h6">Depósitos</Typography>
              <Typography variant="body2" sx={{ color: 'grey.700' }}>Esta sección estará disponible próximamente.</Typography>
            </Paper>
          </Stack>
        </>
      )}

      {!consultando && filas.length === 0 && !reporte.isError && (
        <Paper variant="outlined" sx={{ py: 7, px: 2, textAlign: 'center' }}>
          <Assessment color="disabled" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h6">{consulta ? 'Sin datos para el periodo seleccionado' : 'Selecciona un año y un mes para comenzar'}</Typography>
          <Typography variant="body2" sx={{ color: 'grey.700' }}>Consulta el reporte para ver Venta real, Puntos, Raz, Fiscal y Tarjeta.</Typography>
        </Paper>
      )}
    </Box>
  );
}
