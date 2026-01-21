import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, CircularProgress, Alert, Typography, Grid } from '@mui/material';
import useConsumoApi from '../../../hooks/useConsumoApi';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

import PWABadge from '../../../PWABadge';

interface CatSucursal {
  cve_sucursal: number;
  nombre: string;
  direccion: string | null;
  version: string | null;
  fecha_alta: string | null;
  fecha_act: string | null;
  es_ruta?: boolean | number;
  es_bodega?: boolean | number;
  dias_devolucion?: string | number;
  en_linea?: boolean | number;
  supervisor?: string | number;
  validar_tx?: boolean | number;
  validar_rm?: boolean | number;
  min_records_val_tx?: string | number;
  min_records_val_rm?: string | number;
  clave_timbrador?: string | number;
  recibe_fv?: string;
  recibe_prov_all?: string | number;
  edita_costos_rm?: boolean | number;
  nocturna?: boolean | number;
  credito?: boolean | number;
  vencimiento_deposito?: boolean | number;
  tolerancia_existencia?: boolean | number;
  control_traspasos?: boolean | number;
  bancomer_online?: boolean | number;
  afiliacion_bancomer?: string;
  servicio_domicilio?: boolean | number;
  aplica_cinepolis?: boolean | number;
  aplica_cinetix?: boolean | number;
  area_deposito?: string;
  depto_deposito?: string;
  limite_sobrante?: string | number;
  limite_faltante?: string | number;
  importe_retiros?: string | number;
  fondo?: string | number;
  montoAviso?: string | number;
  numeroAvisos?: string | number;
  importeCajaDespuesRetiros?: string | number;
}

export default function CatSucursales() {
  const { consumoApi } = useConsumoApi();
  const [rows, setRows] = useState<CatSucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar sucursal
  const [openAdd, setOpenAdd] = useState(false);
  const [cia, setCia] = useState('1');
  const [cve_sucursal, setCveSucursal] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [es_ruta, setEsRuta] = useState(false);
  const [es_bodega, setEsBodega] = useState(false);
  const [dias_devolucion, setDiasDevolucion] = useState('');
  const [en_linea, setEnLinea] = useState(false);
  const [supervisor, setSupervisor] = useState('');
  const [version, setVersion] = useState('');
  const [validar_tx, setValidar_tx] = useState(false);
  const [validar_rm, setValidar_rm] = useState(false);
  const [min_records_val_tx, setMin_records_val_tx] = useState('');
  const [min_records_val_rm, setMin_records_val_rm] = useState('');
  const [clave_timbrador, setClave_timbrador] = useState('');
  const [recibe_fv, setRecibe_fv] = useState('');
  const [recibe_prov_all, setRecibe_prov_all] = useState('');
  const [edita_costos_rm, setEdita_costos_rm] = useState(false);
  const [nocturna, setNocturna] = useState(false);
  const [credito, setCredito] = useState(false);
  const [vencimiento_deposito, setVencimiento_deposito] = useState(false);
  const [tolerancia_existencia, setToleranoia_existencia] = useState(false);
  const [control_traspasos, setControl_traspasos] = useState(false);
  const [bancomer_online, setBancomer_online] = useState(false);
  const [afiliacion_bancomer, setAfiliacion_bancomer] = useState('');
  const [servicio_domicilio, setServicio_domicilio] = useState(false);
  const [aplica_cinepolis, setAplica_cinepolis] = useState(false);
  const [aplica_cinetix, setAplica_cinetix] = useState(false);
  const [area_deposito, setArea_deposito] = useState('');
  const [depto_deposito, setDepto_deposito] = useState('');
  const [limite_sobrante, setLimite_sobrante] = useState('');
  const [limite_faltante, setLimite_faltante] = useState('');
  const [importe_retiros, setImporte_retiros] = useState('');
  const [fondo, setFondo] = useState('');
  const [montoAviso, setMontoAviso] = useState('');
  const [numeroAvisos, setNumeroAvisos] = useState('');
  const [importeCajaDespuesRetiros, setImporteCajaDespuesRetiros] =
    useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar sucursal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editCia, setEditCia] = useState('1');
  const [editCveSucursal, setEditCveSucursal] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editEsRuta, setEditEsRuta] = useState(false);
  const [editEsBodega, setEditEsBodega] = useState(false);
  const [editDiasDevolucion, setEditDiasDevolucion] = useState('');
  const [editEnLinea, setEditEnLinea] = useState(false);
  const [editSupervisor, setEditSupervisor] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editValidarTx, setEditValidarTx] = useState(false);
  const [editValidarRm, setEditValidarRm] = useState(false);
  const [editMinRecordsValTx, setEditMinRecordsValTx] = useState('');
  const [editMinRecordsValRm, setEditMinRecordsValRm] = useState('');
  const [editClaveTimbrador, setEditClaveTimbrador] = useState('');
  const [editRecibeFv, setEditRecibeFv] = useState('');
  const [editRecipeProvAll, setEditRecipeProvAll] = useState('');
  const [editEditaCostosRm, setEditEditaCostosRm] = useState(false);
  const [editNocturna, setEditNocturna] = useState(false);
  const [editCredito, setEditCredito] = useState(false);
  const [editVencimientoDeposito, setEditVencimientoDeposito] = useState(false);
  const [editToleranciaExistencia, setEditToleranciaExistencia] =
    useState(false);
  const [editControlTraspasos, setEditControlTraspasos] = useState(false);
  const [editBancomerOnline, setEditBancomerOnline] = useState(false);
  const [editAfiliacionBancomer, setEditAfiliacionBancomer] = useState('');
  const [editServicioDomicilio, setEditServicioDomicilio] = useState(false);
  const [editAplicaCinepolis, setEditAplicaCinepolis] = useState(false);
  const [editAplicaCinetix, setEditAplicaCinetix] = useState(false);
  const [editAreaDeposito, setEditAreaDeposito] = useState('');
  const [editDeptoDeposito, setEditDeptoDeposito] = useState('');
  const [editLimiteSobrante, setEditLimiteSobrante] = useState('');
  const [editLimiteFaltante, setEditLimiteFaltante] = useState('');
  const [editImporteRetiros, setEditImporteRetiros] = useState('');
  const [editFondo, setEditFondo] = useState('');
  const [editMontoAviso, setEditMontoAviso] = useState('');
  const [editNumeroAvisos, setEditNumeroAvisos] = useState('');
  const [editImporteCajaDespuesRetiros, setEditImporteCajaDespuesRetiros] =
    useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Elementos para ver detalles
  const [openView, setOpenView] = useState(false);
  const [viewData, setViewData] = useState<CatSucursal | null>(null);

  // Elementos para eliminar sucursal
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNombre, setDeleteNombre] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Elementos para validación
  const [openValidationError, setOpenValidationError] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');

  const columns: GridColDef[] = [
    { field: 'cve_sucursal', headerName: 'ID', width: 80, type: 'number' },
    { field: 'nombre', headerName: 'Nombre', width: 150, type: 'string' },
    { field: 'direccion', headerName: 'Dirección', width: 250 },
    { field: 'version', headerName: 'Versión', width: 100 },
    {
      field: 'fecha_alta',
      headerName: 'Fecha Alta',
      width: 180,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleString() : '-',
    },
    {
      field: 'fecha_act',
      headerName: 'Fecha Actualización',
      width: 180,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleString() : '-',
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleViewOpen(params.row)}>
            <VisibilityIcon />
          </IconButton>
          <IconButton onClick={() => handleEditOpen(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton
            color='error'
            onClick={() => handleDeleteOpen(params.row)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const handleViewOpen = (row: CatSucursal) => {
    setViewData(row);
    setOpenView(true);
  };

  const handleEditOpen = (row: CatSucursal) => {
    setEditId(row.cve_sucursal);
    setEditCveSucursal(row.cve_sucursal.toString());
    setEditNombre(row.nombre);
    setEditDireccion(row.direccion || '');
    setEditEsRuta((row.es_ruta as boolean) || false);
    setEditEsBodega((row.es_bodega as boolean) || false);
    setEditDiasDevolucion(row.dias_devolucion?.toString() || '0');
    setEditEnLinea((row.en_linea as boolean) || false);
    setEditSupervisor(row.supervisor?.toString() || '1');
    setEditVersion(row.version || 'gt');
    setEditValidarTx((row.validar_tx as boolean) || false);
    setEditValidarRm((row.validar_rm as boolean) || false);
    setEditMinRecordsValTx(row.min_records_val_tx?.toString() || '1');
    setEditMinRecordsValRm(row.min_records_val_rm?.toString() || '1');
    setEditClaveTimbrador(row.clave_timbrador?.toString() || '1');
    setEditRecibeFv(row.recibe_fv || '');
    setEditRecipeProvAll((row.recibe_prov_all?.toString() || '') as any);
    setEditEditaCostosRm((row.edita_costos_rm as boolean) || false);
    setEditNocturna((row.nocturna as boolean) || false);
    setEditCredito((row.credito as boolean) || false);
    setEditVencimientoDeposito((row.vencimiento_deposito as boolean) || false);
    setEditToleranciaExistencia(
      (row.tolerancia_existencia as boolean) || false,
    );
    setEditControlTraspasos((row.control_traspasos as boolean) || false);
    setEditBancomerOnline((row.bancomer_online as boolean) || false);
    setEditAfiliacionBancomer(row.afiliacion_bancomer || '');
    setEditServicioDomicilio((row.servicio_domicilio as boolean) || false);
    setEditAplicaCinepolis((row.aplica_cinepolis as boolean) || false);
    setEditAplicaCinetix((row.aplica_cinetix as boolean) || false);
    setEditAreaDeposito(row.area_deposito || '');
    setEditDeptoDeposito(row.depto_deposito || '');
    setEditLimiteSobrante(row.limite_sobrante?.toString() || '0');
    setEditLimiteFaltante(row.limite_faltante?.toString() || '0');
    setEditImporteRetiros(row.importe_retiros?.toString() || '3000');
    setEditFondo(row.fondo?.toString() || '2000');
    setEditMontoAviso(row.montoAviso?.toString() || '0');
    setEditNumeroAvisos(row.numeroAvisos?.toString() || '0');
    setEditImporteCajaDespuesRetiros(
      row.importeCajaDespuesRetiros?.toString() || '520',
    );
    setOpenEdit(true);
  };

  const handleDeleteOpen = (row: CatSucursal) => {
    setDeleteId(row.cve_sucursal);
    setDeleteNombre(row.nombre);
    setOpenDelete(true);
  };

  const fetchSucursales = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatSucursales/sp_bw_cat_sucursales_sel?cve_sucursal=0',
      );
      setRows(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSucursales();
  }, []);

  const handleAdd = async () => {
    if (!nombre || !direccion) {
      setValidationErrorMessage(
        'Por favor, rellena todos los campos requeridos (Nombre y Dirección)',
      );
      setOpenValidationError(true);
      return;
    }

    try {
      setSaving(true);

      const response = await consumoApi.post(
        `/api/CatSucursales/sp_bw_cat_sucursales_add`,
        null,
        {
          params: {
            cia: 1,
            cve_sucursal: cve_sucursal || 32,
            nombre,
            direccion,
            es_ruta: es_ruta ? 1 : 0,
            es_bodega: es_bodega ? 1 : 0,
            dias_devolucion: dias_devolucion || 0,
            en_linea: en_linea ? 1 : 0,
            supervisor: supervisor || 1,
            version: version || 'gt',
            VALIDAR_TX: validar_tx ? 1 : 0,
            VALIDAR_RM: validar_rm ? 1 : 0,
            MIN_RECORDS_VAL_TX: min_records_val_tx || 1,
            MIN_RECORDS_VAL_RM: min_records_val_rm || 1,
            clave_timbrador: clave_timbrador || 1,
            RECIBE_FV: recibe_fv,
            RECIBE_PROV_ALL: recibe_prov_all ? 1 : 0,
            EDITA_COSTOS_RM: edita_costos_rm ? 1 : 0,
            NOCTURNA: nocturna ? 1 : 0,
            CREDITO: credito ? 1 : 0,
            VENCIMIENTO_DEPOSITO: vencimiento_deposito ? 1 : 0,
            TOLERANCIA_EXISTENCIA: tolerancia_existencia ? 1 : 0,
            CONTROL_TRASPASOS: control_traspasos ? 1 : 0,
            BANCOMER_ONLINE: bancomer_online ? 1 : 0,
            AFILIACION_BANCOMER: afiliacion_bancomer,
            SERVICIO_DOMICILIO: servicio_domicilio ? 1 : 0,
            APLICA_CINEPOLIS: aplica_cinepolis ? 1 : 0,
            APLICA_CINETIX: aplica_cinetix ? 1 : 0,
            AREA_DEPOSITO: area_deposito,
            DEPTO_DEPOSITO: depto_deposito,
            LIMITE_SOBRANTE: limite_sobrante || 0,
            LIMITE_FALTANTE: limite_faltante || 0,
            importe_retiros: importe_retiros || 3000,
            fondo: fondo || 2000,
            montoAviso: montoAviso || 0,
            numeroAvisos: numeroAvisos || 0,
            importeCajaDespuesRetiros: importeCajaDespuesRetiros || 520,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar');
      }

      setOpenAdd(false);
      // Reset todos los campos
      setCia('1');
      setNombre('');
      setDireccion('');
      setCveSucursal('');
      setEsRuta(false);
      setEsBodega(false);
      setDiasDevolucion('0');
      setEnLinea(true);
      setSupervisor('1');
      setVersion('gt');
      setValidar_tx(true);
      setValidar_rm(true);
      setMin_records_val_tx('1');
      setMin_records_val_rm('1');
      setClave_timbrador('1');
      setRecibe_fv('');
      setRecibe_prov_all('00');
      setEdita_costos_rm(false);
      setNocturna(false);
      setCredito(false);
      setVencimiento_deposito(true);
      setToleranoia_existencia(true);
      setControl_traspasos(true);
      setBancomer_online(false);
      setAfiliacion_bancomer('');
      setServicio_domicilio(false);
      setAplica_cinepolis(false);
      setAplica_cinetix(false);
      setArea_deposito('');
      setDepto_deposito('');
      setLimite_sobrante('0');
      setLimite_faltante('0');
      setImporte_retiros('');
      setFondo('');
      setMontoAviso('0');
      setNumeroAvisos('0');
      setImporteCajaDespuesRetiros('');
      fetchSucursales(); // 🔁 refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editNombre || !editDireccion) {
      setValidationErrorMessage(
        'Por favor, rellena todos los campos requeridos (Nombre y Dirección)',
      );
      setOpenValidationError(true);
      return;
    }

    try {
      setSavingEdit(true);

      const response = await consumoApi.put(
        `/api/CatSucursales/sp_bw_cat_sucursales_upd`,
        null,
        {
          params: {
            cve_sucursal: editId,
            nombre: editNombre,
            direccion: editDireccion,
            es_ruta: editEsRuta ? 1 : 0,
            es_bodega: editEsBodega ? 1 : 0,
            dias_devolucion: editDiasDevolucion || 0,
            en_linea: editEnLinea ? 1 : 0,
            supervisor: editSupervisor || 1,
            version: editVersion || 'gt',
            VALIDAR_TX: editValidarTx ? 1 : 0,
            VALIDAR_RM: editValidarRm ? 1 : 0,
            MIN_RECORDS_VAL_TX: editMinRecordsValTx || 1,
            MIN_RECORDS_VAL_RM: editMinRecordsValRm || 1,
            clave_timbrador: editClaveTimbrador || 1,
            RECIBE_FV: editRecibeFv,
            RECIBE_PROV_ALL: editRecipeProvAll ? 1 : 0,
            EDITA_COSTOS_RM: editEditaCostosRm ? 1 : 0,
            NOCTURNA: editNocturna ? 1 : 0,
            CREDITO: editCredito ? 1 : 0,
            VENCIMIENTO_DEPOSITO: editVencimientoDeposito ? 1 : 0,
            TOLERANCIA_EXISTENCIA: editToleranciaExistencia ? 1 : 0,
            CONTROL_TRASPASOS: editControlTraspasos ? 1 : 0,
            BANCOMER_ONLINE: editBancomerOnline ? 1 : 0,
            AFILIACION_BANCOMER: editAfiliacionBancomer,
            SERVICIO_DOMICILIO: editServicioDomicilio ? 1 : 0,
            APLICA_CINEPOLIS: editAplicaCinepolis ? 1 : 0,
            APLICA_CINETIX: editAplicaCinetix ? 1 : 0,
            AREA_DEPOSITO: editAreaDeposito,
            DEPTO_DEPOSITO: editDeptoDeposito,
            LIMITE_SOBRANTE: editLimiteSobrante || 0,
            LIMITE_FALTANTE: editLimiteFaltante || 0,
            importe_retiros: editImporteRetiros || 3000,
            fondo: editFondo || 2000,
            montoAviso: editMontoAviso || 0,
            numeroAvisos: editNumeroAvisos || 0,
            importeCajaDespuesRetiros: editImporteCajaDespuesRetiros || 520,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al actualizar');
      }

      setOpenEdit(false);
      setEditId(null);
      fetchSucursales(); // 🔄 refrescar grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      const response = await consumoApi.delete(
        `/api/CatSucursales/sp_bw_cat_sucursales_del`,
        {
          params: {
            cve_sucursal: deleteId,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje || 'Error al eliminar');
      }

      setOpenDelete(false);
      setDeleteId(null);
      setDeleteNombre(null);
      fetchSucursales(); // 🔄 refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>Error al cargar los datos: {error}</Alert>;
  }

  return (
    <>
      <Box sx={{ p: 2 }}>
        <h1>Catálogo de Sucursales</h1>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button variant='contained' onClick={() => setOpenAdd(true)}>
            Agregar Sucursal
          </Button>
        </Box>

        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.cve_sucursal}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          sx={{ height: 600 }}
        />

        <Dialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>Agregar Sucursal</DialogTitle>

          <DialogContent
            sx={{
              mt: 0,
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            <Grid container spacing={2}>
              {/* Row 1 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Cia'
                  value={cia}
                  disabled
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Nombre *'
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 2 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Dirección'
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Clave Sucursal'
                  value={cve_sucursal}
                  onChange={(e) => setCveSucursal(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 3 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Versión'
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 3 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Supervisor'
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Días Devolución'
                  value={dias_devolucion}
                  onChange={(e) => setDiasDevolucion(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 4 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Importe Retiros'
                  value={importe_retiros}
                  onChange={(e) => setImporte_retiros(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Fondo'
                  value={fondo}
                  onChange={(e) => setFondo(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 5 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Monto Aviso'
                  value={montoAviso}
                  onChange={(e) => setMontoAviso(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Número Avisos'
                  value={numeroAvisos}
                  onChange={(e) => setNumeroAvisos(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 6 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Importe Caja Después Retiros'
                  value={importeCajaDespuesRetiros}
                  onChange={(e) => setImporteCajaDespuesRetiros(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Límite Sobrante'
                  value={limite_sobrante}
                  onChange={(e) => setLimite_sobrante(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 7 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Límite Faltante'
                  value={limite_faltante}
                  onChange={(e) => setLimite_faltante(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Min Records Validar TX'
                  value={min_records_val_tx}
                  onChange={(e) => setMin_records_val_tx(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 8 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Min Records Validar RM'
                  value={min_records_val_rm}
                  onChange={(e) => setMin_records_val_rm(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Clave Timbrador'
                  value={clave_timbrador}
                  onChange={(e) => setClave_timbrador(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 9 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Recibe FV'
                  value={recibe_fv}
                  onChange={(e) => setRecibe_fv(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Recibe Prov All'
                  value={recibe_prov_all}
                  onChange={(e) => setRecibe_prov_all(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 10 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Área Depósito'
                  value={area_deposito}
                  onChange={(e) => setArea_deposito(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Depto Depósito'
                  value={depto_deposito}
                  onChange={(e) => setDepto_deposito(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 11 - Afiliacion Bancomer */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Afiliación Bancomer'
                  value={afiliacion_bancomer}
                  onChange={(e) => setAfiliacion_bancomer(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>
            </Grid>

            {/* Checkboxes - Grid Layout */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={es_ruta}
                    onChange={(e) => setEsRuta(e.target.checked)}
                  />
                  <label>Es Ruta</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={es_bodega}
                    onChange={(e) => setEsBodega(e.target.checked)}
                  />
                  <label>Es Bodega</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={en_linea}
                    onChange={(e) => setEnLinea(e.target.checked)}
                  />
                  <label>En Línea</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={validar_tx}
                    onChange={(e) => setValidar_tx(e.target.checked)}
                  />
                  <label>Validar TX</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={validar_rm}
                    onChange={(e) => setValidar_rm(e.target.checked)}
                  />
                  <label>Validar RM</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={edita_costos_rm}
                    onChange={(e) => setEdita_costos_rm(e.target.checked)}
                  />
                  <label>Edita Costos RM</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={nocturna}
                    onChange={(e) => setNocturna(e.target.checked)}
                  />
                  <label>Nocturna</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={credito}
                    onChange={(e) => setCredito(e.target.checked)}
                  />
                  <label>Crédito</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={vencimiento_deposito}
                    onChange={(e) => setVencimiento_deposito(e.target.checked)}
                  />
                  <label>Vencimiento Depósito</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={tolerancia_existencia}
                    onChange={(e) => setToleranoia_existencia(e.target.checked)}
                  />
                  <label>Tolerancia Existencia</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={control_traspasos}
                    onChange={(e) => setControl_traspasos(e.target.checked)}
                  />
                  <label>Control Traspasos</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={bancomer_online}
                    onChange={(e) => setBancomer_online(e.target.checked)}
                  />
                  <label>Bancomer Online</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={servicio_domicilio}
                    onChange={(e) => setServicio_domicilio(e.target.checked)}
                  />
                  <label>Servicio Domicilio</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={aplica_cinepolis}
                    onChange={(e) => setAplica_cinepolis(e.target.checked)}
                  />
                  <label>Aplica Cinépolis</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={aplica_cinetix}
                    onChange={(e) => setAplica_cinetix(e.target.checked)}
                  />
                  <label>Aplica Cinetix</label>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
            <Button variant='contained' onClick={handleAdd} disabled={saving}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openView}
          onClose={() => setOpenView(false)}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>Detalles de Sucursal</DialogTitle>

          <DialogContent
            sx={{
              mt: 0,
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            {viewData && (
              <Box>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Información Básica
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Cia
                      </Typography>
                      <Typography>1</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Clave Sucursal
                      </Typography>
                      <Typography>{viewData.cve_sucursal}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Nombre
                      </Typography>
                      <Typography>{viewData.nombre}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Dirección
                      </Typography>
                      <Typography>{viewData.direccion || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Versión
                      </Typography>
                      <Typography>{viewData.version || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Fecha Alta
                      </Typography>
                      <Typography>
                        {viewData.fecha_alta
                          ? new Date(viewData.fecha_alta).toLocaleString()
                          : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Fecha Actualización
                      </Typography>
                      <Typography>
                        {viewData.fecha_act
                          ? new Date(viewData.fecha_act).toLocaleString()
                          : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant='h6' sx={{ mb: 2, mt: 3 }}>
                  Configuración General
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Es Ruta
                      </Typography>
                      <Typography>{viewData.es_ruta ? 'Sí' : 'No'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Es Bodega
                      </Typography>
                      <Typography>
                        {viewData.es_bodega ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Días Devolución
                      </Typography>
                      <Typography>{viewData.dias_devolucion || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        En Línea
                      </Typography>
                      <Typography>{viewData.en_linea ? 'Sí' : 'No'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Supervisor
                      </Typography>
                      <Typography>{viewData.supervisor || '-'}</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant='h6' sx={{ mb: 2, mt: 3 }}>
                  Validaciones
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Validar TX
                      </Typography>
                      <Typography>
                        {viewData.validar_tx ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Validar RM
                      </Typography>
                      <Typography>
                        {viewData.validar_rm ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Min Records Validar TX
                      </Typography>
                      <Typography>
                        {viewData.min_records_val_tx || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Min Records Validar RM
                      </Typography>
                      <Typography>
                        {viewData.min_records_val_rm || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant='h6' sx={{ mb: 2, mt: 3 }}>
                  Configuración de Timbrador y Recepción
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Clave Timbrador
                      </Typography>
                      <Typography>{viewData.clave_timbrador || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Recibe FV
                      </Typography>
                      <Typography>{viewData.recibe_fv || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Recibe Prov All
                      </Typography>
                      <Typography>
                        {viewData.recibe_prov_all ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Edita Costos RM
                      </Typography>
                      <Typography>
                        {viewData.edita_costos_rm ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant='h6' sx={{ mb: 2, mt: 3 }}>
                  Configuración Operativa
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Nocturna
                      </Typography>
                      <Typography>{viewData.nocturna ? 'Sí' : 'No'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Crédito
                      </Typography>
                      <Typography>{viewData.credito ? 'Sí' : 'No'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Vencimiento Depósito
                      </Typography>
                      <Typography>
                        {viewData.vencimiento_deposito ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Tolerancia Existencia
                      </Typography>
                      <Typography>
                        {viewData.tolerancia_existencia ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Control Traspasos
                      </Typography>
                      <Typography>
                        {viewData.control_traspasos ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant='h6' sx={{ mb: 2, mt: 3 }}>
                  Configuración Bancaria
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Bancomer Online
                      </Typography>
                      <Typography>
                        {viewData.bancomer_online ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Afiliación Bancomer
                      </Typography>
                      <Typography>
                        {viewData.afiliacion_bancomer || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Servicio Domicilio
                      </Typography>
                      <Typography>
                        {viewData.servicio_domicilio ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant='h6' sx={{ mb: 2, mt: 3 }}>
                  Integraciones
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Aplica Cinépolis
                      </Typography>
                      <Typography>
                        {viewData.aplica_cinepolis ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Aplica Cinetix
                      </Typography>
                      <Typography>
                        {viewData.aplica_cinetix ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Área Depósito
                      </Typography>
                      <Typography>{viewData.area_deposito || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Depto Depósito
                      </Typography>
                      <Typography>{viewData.depto_deposito || '-'}</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant='h6' sx={{ mb: 2, mt: 3 }}>
                  Límites y Montos
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Límite Sobrante
                      </Typography>
                      <Typography>{viewData.limite_sobrante || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Límite Faltante
                      </Typography>
                      <Typography>{viewData.limite_faltante || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Importe Retiros
                      </Typography>
                      <Typography>{viewData.importe_retiros || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Fondo
                      </Typography>
                      <Typography>{viewData.fondo || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Monto Aviso
                      </Typography>
                      <Typography>{viewData.montoAviso || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Número Avisos
                      </Typography>
                      <Typography>{viewData.numeroAvisos || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 'bold' }}
                      >
                        Importe Caja Después Retiros
                      </Typography>
                      <Typography>
                        {viewData.importeCajaDespuesRetiros || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenView(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>Editar Sucursal</DialogTitle>

          <DialogContent
            sx={{
              mt: 0,
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            <Grid container spacing={2}>
              {/* Row 1 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Cia'
                  value={editCia}
                  disabled
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Nombre *'
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 2 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Dirección'
                  value={editDireccion}
                  onChange={(e) => setEditDireccion(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Clave Sucursal'
                  value={editCveSucursal}
                  onChange={(e) => setEditCveSucursal(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                  disabled //No se edita la clave sucursal
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Versión'
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 3 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Supervisor'
                  value={editSupervisor}
                  onChange={(e) => setEditSupervisor(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Días Devolución'
                  value={editDiasDevolucion}
                  onChange={(e) => setEditDiasDevolucion(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 4 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Importe Retiros'
                  value={editImporteRetiros}
                  onChange={(e) => setEditImporteRetiros(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Fondo'
                  value={editFondo}
                  onChange={(e) => setEditFondo(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 5 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Monto Aviso'
                  value={editMontoAviso}
                  onChange={(e) => setEditMontoAviso(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Número Avisos'
                  value={editNumeroAvisos}
                  onChange={(e) => setEditNumeroAvisos(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 6 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Importe Caja Después Retiros'
                  value={editImporteCajaDespuesRetiros}
                  onChange={(e) =>
                    setEditImporteCajaDespuesRetiros(e.target.value)
                  }
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Límite Sobrante'
                  value={editLimiteSobrante}
                  onChange={(e) => setEditLimiteSobrante(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 7 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Límite Faltante'
                  value={editLimiteFaltante}
                  onChange={(e) => setEditLimiteFaltante(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Min Records Validar TX'
                  value={editMinRecordsValTx}
                  onChange={(e) => setEditMinRecordsValTx(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 8 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Min Records Validar RM'
                  value={editMinRecordsValRm}
                  onChange={(e) => setEditMinRecordsValRm(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Clave Timbrador'
                  value={editClaveTimbrador}
                  onChange={(e) => setEditClaveTimbrador(e.target.value)}
                  type='number'
                  inputProps={{ min: 0 }}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 9 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Recibe FV'
                  value={editRecibeFv}
                  onChange={(e) => setEditRecibeFv(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Recibe Prov All'
                  value={editRecipeProvAll}
                  onChange={(e) => setEditRecipeProvAll(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 10 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Área Depósito'
                  value={editAreaDeposito}
                  onChange={(e) => setEditAreaDeposito(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Depto Depósito'
                  value={editDeptoDeposito}
                  onChange={(e) => setEditDeptoDeposito(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>

              {/* Row 11 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Afiliación Bancomer'
                  value={editAfiliacionBancomer}
                  onChange={(e) => setEditAfiliacionBancomer(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Grid>
            </Grid>

            {/* Checkboxes - Grid Layout */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editEsRuta}
                    onChange={(e) => setEditEsRuta(e.target.checked)}
                  />
                  <label>Es Ruta</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editEsBodega}
                    onChange={(e) => setEditEsBodega(e.target.checked)}
                  />
                  <label>Es Bodega</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editEnLinea}
                    onChange={(e) => setEditEnLinea(e.target.checked)}
                  />
                  <label>En Línea</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editValidarTx}
                    onChange={(e) => setEditValidarTx(e.target.checked)}
                  />
                  <label>Validar TX</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editValidarRm}
                    onChange={(e) => setEditValidarRm(e.target.checked)}
                  />
                  <label>Validar RM</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editEditaCostosRm}
                    onChange={(e) => setEditEditaCostosRm(e.target.checked)}
                  />
                  <label>Edita Costos RM</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editNocturna}
                    onChange={(e) => setEditNocturna(e.target.checked)}
                  />
                  <label>Nocturna</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editCredito}
                    onChange={(e) => setEditCredito(e.target.checked)}
                  />
                  <label>Crédito</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editVencimientoDeposito}
                    onChange={(e) =>
                      setEditVencimientoDeposito(e.target.checked)
                    }
                  />
                  <label>Vencimiento Depósito</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editToleranciaExistencia}
                    onChange={(e) =>
                      setEditToleranciaExistencia(e.target.checked)
                    }
                  />
                  <label>Tolerancia Existencia</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editControlTraspasos}
                    onChange={(e) => setEditControlTraspasos(e.target.checked)}
                  />
                  <label>Control Traspasos</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editBancomerOnline}
                    onChange={(e) => setEditBancomerOnline(e.target.checked)}
                  />
                  <label>Bancomer Online</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editServicioDomicilio}
                    onChange={(e) => setEditServicioDomicilio(e.target.checked)}
                  />
                  <label>Servicio Domicilio</label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editAplicaCinepolis}
                    onChange={(e) => setEditAplicaCinepolis(e.target.checked)}
                  />
                  <label>Aplica Cinépolis</label>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type='checkbox'
                    checked={editAplicaCinetix}
                    onChange={(e) => setEditAplicaCinetix(e.target.checked)}
                  />
                  <label>Aplica Cinetix</label>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button
              variant='contained'
              onClick={handleUpdate}
              disabled={savingEdit}
            >
              Guardar cambios
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
          <DialogTitle>Eliminar Sucursal</DialogTitle>

          <DialogContent>
            <Typography>
              ¿Seguro que deseas eliminar la sucursal{' '}
              <strong>{deleteNombre}</strong>?
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>

            <Button
              color='error'
              variant='contained'
              onClick={handleDelete}
              disabled={deleting}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openValidationError}
          onClose={() => setOpenValidationError(false)}
        >
          <DialogTitle>Campos Requeridos</DialogTitle>
          <DialogContent sx={{ mt: 1 }}>
            <Typography color='error'>{validationErrorMessage}</Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenValidationError(false)}
              variant='contained'
            >
              Aceptar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <PWABadge />
    </>
  );
}
