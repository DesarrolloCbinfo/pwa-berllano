import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
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

import PWABadge from '../../../PWABadge';

interface CatSucursal {
  cve_sucursal: number;
  nombre: string;
  direccion: string | null;
  version: string | null;
  fecha_alta: string | null;
  fecha_act: string | null;
}

export default function CatSucursales() {
  const { consumoApi } = useConsumoApi();
  const [rows, setRows] = useState<CatSucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar sucursal
  const [openAdd, setOpenAdd] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [cve_sucursal, setCveSucursal] = useState('');
  const [es_ruta, setEsRuta] = useState(false);
  const [es_bodega, setEsBodega] = useState(false);
  const [dias_devolucion, setDiasDevolucion] = useState('0');
  const [en_linea, setEnLinea] = useState(true);
  const [supervisor, setSupervisor] = useState('1');
  const [version, setVersion] = useState('gt');
  const [saving, setSaving] = useState(false);
  const [validar_tx, setValidar_tx] = useState(true);
  const [validar_rm, setValidar_rm] = useState(true);
  const [min_records_val_tx, setMin_records_val_tx] = useState('1');
  const [min_records_val_rm, setMin_records_val_rm] = useState('1');
  const [clave_timbrador, setClave_timbrador] = useState('1');
  const [recibe_fv, setRecibe_fv] = useState('');
  const [recibe_prov_all, setRecibe_prov_all] = useState('00');
  const [edita_costos_rm, setEdita_costos_rm] = useState(false);
  const [nocturna, setNocturna] = useState(false);
  const [credito, setCredito] = useState(false);
  const [vencimiento_deposito, setVencimiento_deposito] = useState(true);
  const [tolerancia_existencia, setToleranoia_existencia] = useState(true);
  const [control_traspasos, setControl_traspasos] = useState(true);
  const [bancomer_online, setBancomer_online] = useState(false);
  const [afiliacion_bancomer, setAfiliacion_bancomer] = useState('');
  const [servicio_domicilio, setServicio_domicilio] = useState(false);
  const [aplica_cinepolis, setAplica_cinepolis] = useState(false);
  const [aplica_cinetix, setAplica_cinetix] = useState(false);
  const [area_deposito, setArea_deposito] = useState('');
  const [depto_deposito, setDepto_deposito] = useState('');
  const [limite_sobrante, setLimite_sobrante] = useState('0');
  const [limite_faltante, setLimite_faltante] = useState('0');
  const [importe_retiros, setImporte_retiros] = useState('3000');
  const [fondo, setFondo] = useState('2000');
  const [montoAviso, setMontoAviso] = useState('0');
  const [numeroAvisos, setNumeroAvisos] = useState('0');
  const [importeCajaDespuesRetiros, setImporteCajaDespuesRetiros] =
    useState('520');

  // Elementos para editar sucursal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Elementos para eliminar sucursal
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNombre, setDeleteNombre] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
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

  const handleEditOpen = (row: CatSucursal) => {
    setEditId(row.cve_sucursal);
    setEditNombre(row.nombre);
    setEditDireccion(row.direccion || '');
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
    if (!nombre) return;

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
      setImporte_retiros('3000');
      setFondo('2000');
      setMontoAviso('0');
      setNumeroAvisos('0');
      setImporteCajaDespuesRetiros('520');
      fetchSucursales(); // 🔁 refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editNombre) return;

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
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              mt: 0,
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            {/* Campos Básicos */}
            <TextField
              label='Nombre *'
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              size='small'
              sx={{ maxWidth: 300 }}
            />

            <TextField
              label='Dirección'
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              size='small'
              sx={{ maxWidth: 300 }}
            />

            <TextField
              label='Clave Sucursal'
              value={cve_sucursal}
              onChange={(e) => setCveSucursal(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Versión'
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Supervisor'
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Días Devolución'
              value={dias_devolucion}
              onChange={(e) => setDiasDevolucion(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            {/* Campos Numéricos */}
            <TextField
              label='Importe Retiros'
              value={importe_retiros}
              onChange={(e) => setImporte_retiros(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Fondo'
              value={fondo}
              onChange={(e) => setFondo(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Monto Aviso'
              value={montoAviso}
              onChange={(e) => setMontoAviso(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Número Avisos'
              value={numeroAvisos}
              onChange={(e) => setNumeroAvisos(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Importe Caja Después Retiros'
              value={importeCajaDespuesRetiros}
              onChange={(e) => setImporteCajaDespuesRetiros(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 300 }}
            />

            <TextField
              label='Límite Sobrante'
              value={limite_sobrante}
              onChange={(e) => setLimite_sobrante(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Límite Faltante'
              value={limite_faltante}
              onChange={(e) => setLimite_faltante(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Min Records Validar TX'
              value={min_records_val_tx}
              onChange={(e) => setMin_records_val_tx(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Min Records Validar RM'
              value={min_records_val_rm}
              onChange={(e) => setMin_records_val_rm(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Clave Timbrador'
              value={clave_timbrador}
              onChange={(e) => setClave_timbrador(e.target.value)}
              type='number'
              inputProps={{ min: 0 }}
              size='small'
              sx={{ maxWidth: 250 }}
            />

            <TextField
              label='Recibe Prov All'
              value={recibe_prov_all}
              onChange={(e) => setRecibe_prov_all(e.target.value)}
              fullWidth
              size='small'
            />

            {/* Checkboxes */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={es_ruta}
                  onChange={(e) => setEsRuta(e.target.checked)}
                />
                <label>Es Ruta</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={es_bodega}
                  onChange={(e) => setEsBodega(e.target.checked)}
                />
                <label>Es Bodega</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={en_linea}
                  onChange={(e) => setEnLinea(e.target.checked)}
                />
                <label>En Línea</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={validar_tx}
                  onChange={(e) => setValidar_tx(e.target.checked)}
                />
                <label>Validar TX</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={validar_rm}
                  onChange={(e) => setValidar_rm(e.target.checked)}
                />
                <label>Validar RM</label>
              </Box>

              <TextField
                label='Recibe FV'
                value={recibe_fv}
                onChange={(e) => setRecibe_fv(e.target.value)}
                size='small'
                sx={{ maxWidth: 250 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={edita_costos_rm}
                  onChange={(e) => setEdita_costos_rm(e.target.checked)}
                />
                <label>Edita Costos RM</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={nocturna}
                  onChange={(e) => setNocturna(e.target.checked)}
                />
                <label>Nocturna</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={credito}
                  onChange={(e) => setCredito(e.target.checked)}
                />
                <label>Crédito</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={vencimiento_deposito}
                  onChange={(e) => setVencimiento_deposito(e.target.checked)}
                />
                <label>Vencimiento Depósito</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={tolerancia_existencia}
                  onChange={(e) => setToleranoia_existencia(e.target.checked)}
                />
                <label>Tolerancia Existencia</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={control_traspasos}
                  onChange={(e) => setControl_traspasos(e.target.checked)}
                />
                <label>Control Traspasos</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={bancomer_online}
                  onChange={(e) => setBancomer_online(e.target.checked)}
                />
                <label>Bancomer Online</label>
              </Box>

              <TextField
                label='Afiliación Bancomer'
                value={afiliacion_bancomer}
                onChange={(e) => setAfiliacion_bancomer(e.target.value)}
                size='small'
                sx={{ maxWidth: 250 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={servicio_domicilio}
                  onChange={(e) => setServicio_domicilio(e.target.checked)}
                />
                <label>Servicio Domicilio</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={aplica_cinepolis}
                  onChange={(e) => setAplica_cinepolis(e.target.checked)}
                />
                <label>Aplica Cinépolis</label>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type='checkbox'
                  checked={aplica_cinetix}
                  onChange={(e) => setAplica_cinetix(e.target.checked)}
                />
                <label>Aplica Cinetix</label>
              </Box>

              <TextField
                label='Área Depósito'
                value={area_deposito}
                onChange={(e) => setArea_deposito(e.target.value)}
                size='small'
                sx={{ maxWidth: 250 }}
              />

              <TextField
                label='Depto Depósito'
                value={depto_deposito}
                onChange={(e) => setDepto_deposito(e.target.value)}
                size='small'
                sx={{ maxWidth: 250 }}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
            <Button variant='contained' onClick={handleAdd} disabled={saving}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>Editar Sucursal</DialogTitle>

          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField label='ID' value={editId || ''} disabled fullWidth />
            <TextField
              label='Nombre'
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              fullWidth
            />
            <TextField
              label='Dirección'
              value={editDireccion}
              onChange={(e) => setEditDireccion(e.target.value)}
              fullWidth
            />
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
      </Box>
      <PWABadge />
    </>
  );
}
