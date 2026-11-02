import { useState } from 'react';
import {
  Alert, Box, Breadcrumbs, Button, Checkbox, CircularProgress, FormControlLabel,
  IconButton, Link, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableFooter, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import { ArrowBack, Assessment, ChevronRight, Download, PictureAsPdf, Search } from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import SucursalSelector from '../../../components/selectores/SucursalSelector';
import ProveedorSelector from '../../../components/selectores/ProveedorSelector';
import type { SucursalOption } from '../../../components/selectores/SucursalSelector';
import type { ProveedorOption } from '../../../components/selectores/ProveedorSelector';
import useConsumoApi from '../../../hooks/useConsumoApi';
import useSession from '../../../hooks/useSession';
import { routes } from '../../../utils/Routes';
import {
  contextoReporte, crearPeticionRecepcion, filasParaExportar,
  formatoFecha, formatoMoneda, normalizarRecepciones, sumarRecepciones, titulosReporte,
} from './reporte';
import type { ConsultaRecepcion, FilaRecepcion } from './reporte';

function fechasIniciales() {
  const fecha = new Date();
  const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  return {
    fechaInicial: `${mes}-01`,
    fechaFinal: `${mes}-${String(fecha.getDate()).padStart(2, '0')}`,
  };
}

export default function ReporteRecepcionMercanciasPage() {
  const navigate = useNavigate();
  const { consumoApi } = useConsumoApi();
  const session = useSession();
  const queryClient = useQueryClient();
  const [periodo, setPeriodo] = useState(fechasIniciales);
  const [todasSucursales, setTodasSucursales] = useState(true);
  const [sucursal, setSucursal] = useState<SucursalOption | null>(null);
  const [proveedor, setProveedor] = useState<ProveedorOption | null>(null);
  const [consulta, setConsulta] = useState<ConsultaRecepcion | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [pagina, setPagina] = useState(0);
  const [tamanoPagina, setTamanoPagina] = useState(20);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const reporte = useQuery({
    queryKey: ['reporte-recepcion-mercancias', consulta],
    enabled: consulta !== null,
    queryFn: async ({ signal }) => {
      if (!consulta) throw new Error('Selecciona un periodo para consultar.');
      const { endpoint, params } = crearPeticionRecepcion(consulta);
      const { data } = await consumoApi.get<unknown>(endpoint, {
        params, signal, timeout: 120_000,
      });
      return normalizarRecepciones(data, consulta.nivel);
    },
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const filas = reporte.isError ? [] : reporte.data ?? [];
  const totales = sumarRecepciones(filas);
  const nivel = consulta?.nivel ?? 'sucursales';
  const consultando = consulta !== null && reporte.isFetching;
  const tieneDetalle = nivel !== 'folios';

  const limpiarResultados = () => {
    setConsulta(null);
    setMensaje('');
    setPagina(0);
  };

  const mostrarConsulta = (nueva: ConsultaRecepcion) => {
    setPeriodo({ fechaInicial: nueva.fechaInicial, fechaFinal: nueva.fechaFinal });
    setTodasSucursales(nueva.nivel === 'sucursales');
    if (nueva.nivel !== 'sucursales') setSucursal(nueva.sucursal);
    setProveedor(nueva.nivel === 'folios' ? nueva.proveedor : null);
    setPagina(0);
    setMensaje('');
    setConsulta(nueva);
  };

  const consultar = () => {
    if (!periodo.fechaInicial || !periodo.fechaFinal) {
      setMensaje('Selecciona la fecha inicial y la fecha final.');
      return;
    }
    if (periodo.fechaInicial > periodo.fechaFinal) {
      setMensaje('La fecha inicial debe ser anterior o igual a la fecha final.');
      return;
    }
    if (!todasSucursales && (!sucursal || sucursal.cve_sucursal <= 0)) {
      setMensaje('Selecciona una sucursal.');
      return;
    }
    const nueva: ConsultaRecepcion = todasSucursales || !sucursal
      ? { ...periodo, nivel: 'sucursales' }
      : proveedor
        ? { ...periodo, nivel: 'folios', sucursal, proveedor }
        : { ...periodo, nivel: 'proveedores', sucursal };
    // Una consulta explícita actualiza los datos; volver de nivel reutiliza su resultado.
    void queryClient.invalidateQueries({ queryKey: ['reporte-recepcion-mercancias', nueva], exact: true });
    mostrarConsulta(nueva);
  };

  const volverSucursales = () => {
    if (!consulta) return;
    mostrarConsulta({
      fechaInicial: consulta.fechaInicial, fechaFinal: consulta.fechaFinal, nivel: 'sucursales',
    });
  };

  const volverProveedores = () => {
    if (!consulta || consulta.nivel === 'sucursales') return;
    mostrarConsulta({
      fechaInicial: consulta.fechaInicial, fechaFinal: consulta.fechaFinal,
      nivel: 'proveedores', sucursal: consulta.sucursal,
    });
  };

  const abrirDetalle = (fila: FilaRecepcion) => {
    if (!consulta) return;
    if (consulta.nivel === 'sucursales') {
      const claveSucursal = Number(fila.clave);
      if (!Number.isInteger(claveSucursal) || claveSucursal <= 0) {
        setMensaje('El registro no contiene una clave de sucursal válida.');
        return;
      }
      mostrarConsulta({
        ...consulta, nivel: 'proveedores',
        sucursal: { cve_sucursal: claveSucursal, nombre: fila.nombre || fila.clave },
      });
    } else if (consulta.nivel === 'proveedores') {
      mostrarConsulta({
        ...consulta, nivel: 'folios', proveedor: { id: fila.clave, nombre: fila.nombre },
      });
    }
  };

  const exportar = () => {
    if (!consulta || filas.length === 0) return;
    const registros = filasParaExportar(filas, consulta.nivel);
    const columnas = Object.keys(registros[0]);
    const hoja = XLSX.utils.aoa_to_sheet([
      [titulosReporte[consulta.nivel]],
      [contextoReporte(consulta)],
      [],
      columnas,
      ...registros.map((fila) => Object.values(fila)),
      ['Totales', '', totales.subtotal, totales.iva, totales.total],
    ]);
    // Las claves y folios permanecen como texto, incluidos los ceros iniciales.
    for (let renglon = 4; renglon <= registros.length + 4; renglon += 1) {
      for (let columna = 2; columna <= 4; columna += 1) {
        const celda = hoja[XLSX.utils.encode_cell({ r: renglon, c: columna })];
        if (celda) celda.z = '"$"#,##0.00';
      }
    }
    hoja['!cols'] = [{ wch: 16 }, { wch: nivel === 'folios' ? 16 : 42 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Recepciones');
    XLSX.writeFile(libro, `Recepcion_mercancias_${consulta.nivel}_${consulta.fechaInicial}_${consulta.fechaFinal}.xlsx`);
  };

  const exportarPdf = async () => {
    if (!consulta || filas.length === 0) return;
    setGenerandoPdf(true);
    setMensaje('');
    try {
      const { exportarPdfRecepciones } = await import('./exportarPdf');
      await exportarPdfRecepciones(consulta, filas);
    } catch (error) {
      setMensaje(error instanceof Error ? `No fue posible generar el PDF: ${error.message}` : 'No fue posible generar el PDF.');
    } finally {
      setGenerandoPdf(false);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton aria-label="Regresar al menú principal" onClick={() => navigate(routes.mainMenu)}>
          <ArrowBack />
        </IconButton>
        <Assessment sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h4">Recepción de mercancías por sucursales</Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta sucursales, abre sus proveedores y revisa los folios de recepción.
          </Typography>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Filtros del reporte</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {(['fechaInicial', 'fechaFinal'] as const).map((campo) => (
            <TextField
              key={campo} type="date" size="small" fullWidth required
              label={campo === 'fechaInicial' ? 'Fecha inicial' : 'Fecha final'}
              value={periodo[campo]} disabled={consultando}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => {
                setPeriodo((actual) => ({ ...actual, [campo]: event.target.value }));
                limpiarResultados();
              }}
            />
          ))}
          <SucursalSelector
            value={todasSucursales ? null : sucursal} label="Sucursal" defaultSucursalId={session?.sucursal}
            autoSelect={!todasSucursales}
            disabled={consultando}
            onChange={(nueva) => {
              setSucursal(nueva);
              setTodasSucursales(false);
              setProveedor(null);
              limpiarResultados();
            }}
          />
          <Box>
            <ProveedorSelector
              value={proveedor} disabled={todasSucursales || !sucursal || consultando}
              onChange={(nuevo) => { setProveedor(nuevo); limpiarResultados(); }}
            />
            {(todasSucursales || !sucursal) && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'grey.700' }}>
                Selecciona una sucursal para habilitar el proveedor.
              </Typography>
            )}
          </Box>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mt: 2 }}>
          <Box>
            <FormControlLabel
              label="Todas las sucursales"
              control={<Checkbox checked={todasSucursales} disabled={consultando} onChange={(_, checked) => {
                setTodasSucursales(checked); setProveedor(null); limpiarResultados();
              }} />}
            />
            <Typography variant="caption" display="block" color="text.secondary">
              {todasSucursales ? 'Consulta todas las sucursales o selecciona una para ver sus proveedores.'
                : proveedor ? 'Consulta los folios de la sucursal y el proveedor seleccionados.'
                  : 'Consulta los proveedores de la sucursal seleccionada.'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={consultando ? <CircularProgress size={16} color="inherit" /> : <Search />} onClick={consultar} disabled={consultando}>
            {consultando ? 'Consultando...' : 'Consultar'}
          </Button>
        </Stack>
      </Paper>

      {mensaje && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setMensaje('')}>{mensaje}</Alert>}
      {reporte.isError && consulta && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => void reporte.refetch()}>Reintentar</Button>}>
          No fue posible consultar el reporte: {reporte.error.message}
        </Alert>
      )}

      <Paper variant="outlined" aria-busy={consultando}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ p: 2 }}>
          <Box>
            {consulta && (
              <Breadcrumbs aria-label="Niveles del reporte" sx={{ mb: 1 }}>
                {nivel === 'sucursales' ? <Typography>Sucursales</Typography>
                  : <Link component="button" onClick={volverSucursales}>Sucursales</Link>}
                {consulta.nivel !== 'sucursales' && (nivel === 'proveedores'
                  ? <Typography>{consulta.sucursal.nombre}</Typography>
                  : <Link component="button" onClick={volverProveedores}>{consulta.sucursal.nombre}</Link>)}
                {consulta.nivel === 'folios' && <Typography>{consulta.proveedor.nombre || consulta.proveedor.id}</Typography>}
              </Breadcrumbs>
            )}
            <Typography variant="h6">{titulosReporte[nivel]}</Typography>
            {consulta && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{contextoReporte(consulta)}</Typography>}
            {consulta && reporte.isSuccess && <Typography variant="caption" color="text.secondary">{filas.length} registro(s)</Typography>}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {consulta && nivel !== 'sucursales' && (
              <Button startIcon={<ArrowBack />} onClick={nivel === 'folios' ? volverProveedores : volverSucursales}>Volver</Button>
            )}
            <Button variant="outlined" startIcon={<Download />} onClick={exportar} disabled={filas.length === 0 || consultando}>Excel</Button>
            <Button variant="outlined" startIcon={generandoPdf ? <CircularProgress size={16} /> : <PictureAsPdf />} onClick={exportarPdf} disabled={filas.length === 0 || consultando || generandoPdf}>
              {generandoPdf ? 'Generando PDF...' : 'Exportar PDF'}
            </Button>
          </Stack>
        </Stack>

        {consultando && <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" role="status" sx={{ py: 3 }}><CircularProgress size={22} /><Typography>Consultando reporte...</Typography></Stack>}
        {filas.length > 0 && (
          <>
            {tieneDetalle && <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>Selecciona «{nivel === 'sucursales' ? 'Ver proveedores' : 'Ver folios'}» para abrir el siguiente nivel.</Typography>}
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table size="small" stickyHeader aria-label={titulosReporte[nivel]}>
                <TableHead>
                  <TableRow>
                    <TableCell>{nivel === 'folios' ? 'Fecha' : 'Clave'}</TableCell>
                    <TableCell>{nivel === 'sucursales' ? 'Sucursal' : nivel === 'proveedores' ? 'Proveedor' : 'Folio'}</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="right">IVA</TableCell>
                    <TableCell align="right">Total</TableCell>
                    {tieneDetalle && <TableCell align="right">Detalle</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filas.slice(pagina * tamanoPagina, (pagina + 1) * tamanoPagina).map((fila, index) => (
                    <TableRow hover key={`${fila.clave}-${fila.fecha}-${index}`}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{nivel === 'folios' ? formatoFecha(fila.fecha) : fila.clave}</TableCell>
                      <TableCell>{nivel === 'folios' ? fila.clave : fila.nombre}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatoMoneda(fila.subtotal)}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatoMoneda(fila.iva)}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatoMoneda(fila.total)}</TableCell>
                      {tieneDetalle && (
                        <TableCell align="right">
                          <Button variant="contained" size="small" endIcon={<ChevronRight />} onClick={() => abrirDetalle(fila)} disabled={consultando}
                            aria-label={`${nivel === 'sucursales' ? 'Ver proveedores de' : 'Ver folios de'} ${fila.nombre || fila.clave}`} sx={{
                              whiteSpace: 'nowrap', minWidth: 150, px: 2, py: 0.75, fontWeight: 600,
                              border: '1px solid', borderColor: 'primary.main', borderRadius: 1,
                              '&.Mui-disabled': { borderColor: 'action.disabledBackground' },
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                            }}>
                            {nivel === 'sucursales' ? 'Ver proveedores' : 'Ver folios'}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter sx={{ '& .MuiTableCell-root': { fontWeight: 700, fontSize: '0.875rem', color: 'text.primary', whiteSpace: 'nowrap' } }}>
                  <TableRow>
                    <TableCell colSpan={2}>Totales del reporte</TableCell>
                    <TableCell align="right">{formatoMoneda(totales.subtotal)}</TableCell>
                    <TableCell align="right">{formatoMoneda(totales.iva)}</TableCell>
                    <TableCell align="right">{formatoMoneda(totales.total)}</TableCell>
                    {tieneDetalle && <TableCell />}
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
            <TablePagination
              component="div" count={filas.length} page={pagina} rowsPerPage={tamanoPagina}
              rowsPerPageOptions={[10, 20, 50, 100]} labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
              onPageChange={(_, nueva) => setPagina(nueva)}
              onRowsPerPageChange={(event) => { setTamanoPagina(Number(event.target.value)); setPagina(0); }}
            />
          </>
        )}
        {!consultando && filas.length === 0 && !reporte.isError && (
          <Box sx={{ py: 7, px: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
            <Assessment color="disabled" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">{consulta ? 'Sin recepciones para esta consulta' : 'Selecciona un periodo para comenzar'}</Typography>
            <Typography variant="body2" color="text.secondary">{consulta ? 'Prueba con otro periodo, sucursal o proveedor.' : 'El reporte inicial muestra los importes agrupados por sucursal.'}</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
