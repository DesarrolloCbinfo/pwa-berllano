import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, CircularProgress, Alert, Typography, Grid, Paper } from '@mui/material';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { useSessionContext } from '../../../context/SessionProvider';
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
  cia: number;
  cve_sucursal: number;
  nombre: string;
  direccion: string | null;
  dias_devolucion: number;
  en_linea?: boolean | number;
  version: string;
  fecha_alta: string | null;
  fecha_act: string | null;
  validar_tx?: boolean | number;
  validar_rm?: boolean | number;
  clave_timbrador: number;
  min_records_val_tx: number;
  recibe_prov_all?: boolean | number;
  edita_costos_rm?: boolean | number;
  credito?: boolean | number;
  fondo?: string | number;
  montoAviso?: string | number;
  numeroAvisos?: string | number;
  importeCajaDespuesRetiros?: string | number;
}

export default function CatSucursales() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();
  const [rows, setRows] = useState<CatSucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar sucursal
  const [openAdd, setOpenAdd] = useState(false);
  const [cia, setCia] = useState('1');
  const [cve_sucursal, setCveSucursal] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [dias_devolucion, setDiasDevolucion] = useState('');
  const [en_linea, setEnLinea] = useState(false);
  const [version, setVersion] = useState('');
  const [validar_tx, setValidar_tx] = useState(false);
  const [clave_timbrador, setClave_timbrador] = useState('');
  const [recibe_prov_all, setRecibe_prov_all] = useState(false);
  const [edita_costos_rm, setEdita_costos_rm] = useState(false);
  const [credito, setCredito] = useState(false);
  const [fondo, setFondo] = useState('');
  const [montoAviso, setMontoAviso] = useState('');
  const [numeroAvisos, setNumeroAvisos] = useState('');
  const [importeCajaDespuesRetiros, setImporteCajaDespuesRetiros] =
    useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar sucursal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editCia, setEditCia] = useState('1'); //Cia no se edita
  const [editCveSucursal, setEditCveSucursal] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editDiasDevolucion, setEditDiasDevolucion] = useState('');
  const [editEnLinea, setEditEnLinea] = useState(false);
  const [editVersion, setEditVersion] = useState('');
  const [editValidarTx, setEditValidarTx] = useState(false);
  const [editClaveTimbrador, setEditClaveTimbrador] = useState('');
  const [editRecipeProvAll, setEditRecipeProvAll] = useState(false);
  const [editEditaCostosRm, setEditEditaCostosRm] = useState(false);
  const [editCredito, setEditCredito] = useState(false);
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

  
  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton onClick={(e) => { e.stopPropagation(); handleEditOpen(params.row); }} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            color='error'
            onClick={(e) => { e.stopPropagation(); handleDeleteOpen(params.row); }}
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
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
  ];

  const handleViewOpen = (row: CatSucursal) => {
    setViewData(row);
    setOpenView(true);
  };

  const handleEditOpen = (row: CatSucursal) => {
    console.log('Opening edit for row:', row);
    setEditId(row.cve_sucursal);
    setEditCveSucursal(row.cve_sucursal.toString());
    setEditNombre(row.nombre);
    setEditDireccion(row.direccion || '');
    setEditDiasDevolucion(row.dias_devolucion?.toString() || '0');
    setEditEnLinea((row.en_linea as boolean) || false);
    setEditVersion(row.version || '');
    setEditValidarTx((row.validar_tx as boolean) || false);
    setEditClaveTimbrador(row.clave_timbrador?.toString() || '1');
    setEditRecipeProvAll((row.recibe_prov_all as boolean) || false);
    setEditEditaCostosRm((row.edita_costos_rm as boolean) || false);
    setEditCredito((row.credito as boolean) || false);
    setEditFondo(row.fondo?.toString() || '');
    setEditMontoAviso(row.montoAviso?.toString() || '');
    setEditNumeroAvisos(row.numeroAvisos?.toString() || '');
    setEditImporteCajaDespuesRetiros(
      row.importeCajaDespuesRetiros?.toString() || '',
    );
    setTimeout(() => setOpenEdit(true), 0);
  };

  const handleDeleteOpen = (row: CatSucursal) => {
    setDeleteId(row.cve_sucursal);
    setDeleteNombre(row.nombre);
    setOpenDelete(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setSaving(true);
      
      const response = await consumoApi.delete(
        '/api/CatSucursales/sp_bw_cat_sucursales_del',
        {
          params: {
            cve_sucursal: deleteId
          }
        }
      );
      
      if (response.data?.[0]?.codigo === 0) {
        setOpenDelete(false);
        fetchSucursales();
        alert('Sucursal eliminada exitosamente');
      } else {
        alert(response.data?.[0]?.mensaje1 || 'Error al eliminar');
      }
    } catch (err) {
      console.error('Error al eliminar sucursal:', err);
      alert('Error al eliminar la sucursal');
    } finally {
      setSaving(false);
    }
  };

  const fetchSucursales = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatSucursales/sp_bw_cat_sucursales_sel',
        {
          params: {
            cve_sucursal: 0
          }
        }
      );
      
      const data = response.data.map((item: any) => ({
        ...item,
        validar_tx: item.VALIDAR_TX,
        recibe_prov_all: item.RECIBE_PROV_ALL,
        edita_costos_rm: item.EDITA_COSTOS_RM,
        credito: item.CREDITO,
      }));
      
      setRows(data);
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
    if (!nombre) {
      setValidationErrorMessage(
        'Por favor, ingresa el nombre de la sucursal',
      );
      setOpenValidationError(true);
      return;
    }

    try {
      setSaving(true);

      const response = await consumoApi.post(
        '/api/CatSucursales/sp_bw_cat_sucursales_add',
        {},
        {
          params: {
            cia: 1,
            cve_sucursal: parseInt(cve_sucursal) || 0,
            nombre,
            direccion: direccion || '',
            dias_devolucion: parseInt(dias_devolucion) || 0,
            en_linea: en_linea ? 1 : 0,
            version: version || '',
            VALIDAR_TX: validar_tx ? 1 : 0,
            clave_timbrador: parseInt(clave_timbrador) || 1,
            RECIBE_PROV_ALL: recibe_prov_all ? 1 : 0,
            EDITA_COSTOS_RM: edita_costos_rm ? 1 : 0,
            CREDITO: credito ? 1 : 0,
            fondo: parseFloat(fondo) || 0,
            montoAviso: parseFloat(montoAviso) || 0,
            numeroAvisos: parseInt(numeroAvisos) || 0,
            importeCajaDespuesRetiros: parseFloat(importeCajaDespuesRetiros) || 0,
          },
        },
      );

      if (response.data?.[0]?.codigo === 0) {
        await fetchSucursales();
        setOpenAdd(false);
        
        // Reset campos
        setNombre('');
        setDireccion('');
        setCveSucursal('');
        setDiasDevolucion('0');
        setEnLinea(true);
        setVersion('');
        setValidar_tx(false);
        setClave_timbrador('1');
        setRecibe_prov_all(false);
        setEdita_costos_rm(false);
        setCredito(false);
        setFondo('');
        setMontoAviso('');
        setNumeroAvisos('');
        setImporteCajaDespuesRetiros('');
      } else {
        setError(response.data?.[0]?.mensaje1 || 'Error al agregar');
      }
    } catch (err: any) {
      console.error('Error al agregar sucursal:', err);
      console.error('Detalles del error:', err.response?.data);
      const errorMsg = err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(', ')
        : err.response?.data?.title || 'Error al agregar la sucursal';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  const handleUpdate = async () => {
    // Validación de campos obligatorios
    if (!editId || !editNombre) {
      alert('Por favor, ingresa la clave y el nombre de la sucursal');
      return;
    }

    try {
      setSavingEdit(true);

      const response = await consumoApi.put(
        '/api/CatSucursales/sp_bw_cat_sucursales_upd',
        {}, // Cuerpo de la petición vacío
        {
          params: {
            cia: 1,
            cve_sucursal: editId,
            nombre: editNombre,
            direccion: editDireccion || '',
            dias_devolucion: parseInt(editDiasDevolucion) || 0,
            en_linea: editEnLinea ? 1 : 0,
            version: editVersion || '',
            VALIDAR_TX: editValidarTx ? 1 : 0,
            clave_timbrador: parseInt(editClaveTimbrador) || 0,
            RECIBE_PROV_ALL: editRecipeProvAll ? 1 : 0,
            EDITA_COSTOS_RM: editEditaCostosRm ? 1 : 0,
            CREDITO: editCredito ? 1 : 0,
            fondo: parseFloat(editFondo) || 0,
            montoAviso: parseFloat(editMontoAviso) || 0,
            numeroAvisos: parseInt(editNumeroAvisos) || 0,
            importeCajaDespuesRetiros: parseFloat(editImporteCajaDespuesRetiros) || 0,
          },
        },
      );

      // Validación de la respuesta del Store Procedure
      if (response.data?.[0]?.codigo === 0) {
        await fetchSucursales(); // Recarga la lista de sucursales
        setOpenEdit(false);        // Cierra el modal de edición
        setEditId(null); // Limpia el ID de edición
        alert('Sucursal actualizada exitosamente');
      } else {
        // mensaje1 es el nombre que definiste en tu SELECT del SP
        alert(response.data?.[0]?.mensaje1 || 'Error al actualizar');
      }
    } catch (err) {
      console.error('Error al actualizar sucursal:', err);
      alert('Error al actualizar la información de la sucursal');
    } finally {
      setSavingEdit(false);
    }
  };

  if (error) {
    return <Alert severity='error'>Error al cargar los datos: {error}</Alert>;
  }

  return (
    <>
<Box sx={{ p: 3, bgcolor: '#ececec', minHeight: '100vh' }}>
        
{/* ENCABEZADO ESTILO ELEGANTE */}
        <Box sx={{ p: 3, borderRadius: '8px', mb: 3, boxShadow: '0 4px 8px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
          
          {/* RECUADRO INTERIOR */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                      CATÁLOGO DE SUCURSALES
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                      Sucursal: {session?.dSucursal || 'Cargando...'}
                  </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                      {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                      Usuario Activo: {session?.nombre || 'Cargando...'}
                  </Typography>
              </Box>
          </Box>

          {/* BOTÓN DENTRO DEL CONTENEDOR, PERO FUERA DEL RECUADRO */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              variant='contained' 
              onClick={() => setOpenAdd(true)}
              sx={{
                backgroundColor: '#333333',
                color: '#fff',
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#555555',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)'
                }
              }}
            >
              + AGREGAR SUCURSAL
            </Button>
          </Box>
        </Box>
        

{/* CONTENEDOR DE LA TABLA ESTILO ELEGANTE */}
        <Box sx={{ p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)', bgcolor: 'white' }}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.cve_sucursal}
              pageSizeOptions={[5, 10, 25, 100]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 100,
                  },
                },
              }}
              onRowClick={(params) => handleViewOpen(params.row)}
              density="compact"
              disableRowSelectionOnClick
              sx={{ 
                border: 'none',
                height: '100%',
                '& .MuiDataGrid-columnHeaders': { borderBottom: '2px solid #000', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: '#f5f5f5' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                '& .MuiDataGrid-row': { cursor: 'pointer', transition: 'all 0.2s ease' },
                '& .MuiDataGrid-row:hover': { bgcolor: '#fafafa' }
              }}
            />
          </Box>
        </Box>
      </Box>

      <Dialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          maxWidth='md'
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: '#424242', 
            color: 'white',
            py: 2.5,
            px: 3
          }}>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Agregar Nueva Sucursal
            </Typography>
            <Typography variant='body2' sx={{ color: '#e0e0e0', mt: 0.5 }}>
              Complete la información de la sucursal en los campos correspondientes
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Identificación de la Sucursal */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Identificación de la Sucursal
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Clave Sucursal'
                      value={cve_sucursal}
                      onChange={(e) => setCveSucursal(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Nombre *'
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label='Dirección'
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Versión'
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Días Devolución'
                      value={dias_devolucion}
                      onChange={(e) => setDiasDevolucion(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Configuración y Operación */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Configuración y Operación
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Clave Timbrador'
                      value={clave_timbrador}
                      onChange={(e) => setClave_timbrador(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Fondo'
                      value={fondo}
                      onChange={(e) => setFondo(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Monto Aviso'
                      value={montoAviso}
                      onChange={(e) => setMontoAviso(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Número Avisos'
                      value={numeroAvisos}
                      onChange={(e) => setNumeroAvisos(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Importe Caja Después Retiros'
                      value={importeCajaDespuesRetiros}
                      onChange={(e) => setImporteCajaDespuesRetiros(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Opciones de Configuración */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Opciones de Configuración
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: 'white', 
                  p: 2.5, 
                  borderRadius: 1,
                  border: '1px solid #e0e0e0'
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={en_linea}
                          onChange={(e) => setEnLinea(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            En Línea
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Habilitar operación en línea
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={validar_tx}
                          onChange={(e) => setValidar_tx(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Validar TX
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Validar transacciones
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={recibe_prov_all}
                          onChange={(e) => setRecibe_prov_all(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Recibe Proveedor All
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Recibir de todos los proveedores
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={edita_costos_rm}
                          onChange={(e) => setEdita_costos_rm(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Edita Costos RM
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Permitir edición de costos
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={credito}
                          onChange={(e) => setCredito(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Crédito
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Habilitar ventas a crédito
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setOpenAdd(false)}
              sx={{ textTransform: 'uppercase', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              variant='contained'
              onClick={handleAdd}
              disabled={saving}
              sx={{ 
                bgcolor: '#212121',
                textTransform: 'uppercase',
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  bgcolor: '#424242'
                }
              }}
            >
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

          <DialogContent sx={{ mt: 2 }}>
            {viewData && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Clave Sucursal
                  </Typography>
                  <Typography variant='body1'>{viewData.cve_sucursal}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Nombre
                  </Typography>
                  <Typography variant='body1'>{viewData.nombre}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Dirección
                  </Typography>
                  <Typography variant='body1'>{viewData.direccion || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Versión
                  </Typography>
                  <Typography variant='body1'>{viewData.version || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Días Devolución
                  </Typography>
                  <Typography variant='body1'>{viewData.dias_devolucion || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Clave Timbrador
                  </Typography>
                  <Typography variant='body1'>{viewData.clave_timbrador || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Fondo
                  </Typography>
                  <Typography variant='body1'>{viewData.fondo || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Monto Aviso
                  </Typography>
                  <Typography variant='body1'>{viewData.montoAviso || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Número Avisos
                  </Typography>
                  <Typography variant='body1'>{viewData.numeroAvisos || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Importe Caja Después Retiros
                  </Typography>
                  <Typography variant='body1'>{viewData.importeCajaDespuesRetiros || '-'}</Typography>
                </Box>
                
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                    Configuración
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant='caption' sx={{ color: '#999' }}>En Línea:</Typography>
                      <Typography variant='body2'>{viewData.en_linea ? 'Sí' : 'No'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' sx={{ color: '#999' }}>Validar TX:</Typography>
                      <Typography variant='body2'>{viewData.validar_tx ? 'Sí' : 'No'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' sx={{ color: '#999' }}>Recibe Prov All:</Typography>
                      <Typography variant='body2'>{viewData.recibe_prov_all ? 'Sí' : 'No'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' sx={{ color: '#999' }}>Edita Costos RM:</Typography>
                      <Typography variant='body2'>{viewData.edita_costos_rm ? 'Sí' : 'No'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' sx={{ color: '#999' }}>Crédito:</Typography>
                      <Typography variant='body2'>{viewData.credito ? 'Sí' : 'No'}</Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 1, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                  <Typography variant='caption' sx={{ color: '#999' }}>Fecha Alta:</Typography>
                  <Typography variant='body2'>
                    {viewData.fecha_alta ? new Date(viewData.fecha_alta).toLocaleString() : '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='caption' sx={{ color: '#999' }}>Fecha Actualización:</Typography>
                  <Typography variant='body2'>
                    {viewData.fecha_act ? new Date(viewData.fecha_act).toLocaleString() : '-'}
                  </Typography>
                </Box>
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
          PaperProps={{
            sx: {
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: '#424242', 
            color: 'white',
            py: 2.5,
            px: 3
          }}>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Editar Sucursal: {editCveSucursal}
            </Typography>
            <Typography variant='body2' sx={{ color: '#e0e0e0', mt: 0.5 }}>
              Complete la información de la sucursal en los campos correspondientes
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Identificación de la Sucursal */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Identificación de la Sucursal
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Clave Sucursal'
                      value={editCveSucursal}
                      disabled
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Nombre *'
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      required
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label='Dirección'
                      value={editDireccion}
                      onChange={(e) => setEditDireccion(e.target.value)}
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Versión'
                      value={editVersion}
                      onChange={(e) => setEditVersion(e.target.value)}
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Días Devolución'
                      value={editDiasDevolucion}
                      onChange={(e) => setEditDiasDevolucion(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Configuración y Operación */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Configuración y Operación
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Clave Timbrador'
                      value={editClaveTimbrador}
                      onChange={(e) => setEditClaveTimbrador(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Fondo'
                      value={editFondo}
                      onChange={(e) => setEditFondo(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Monto Aviso'
                      value={editMontoAviso}
                      onChange={(e) => setEditMontoAviso(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Número Avisos'
                      value={editNumeroAvisos}
                      onChange={(e) => setEditNumeroAvisos(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Importe Caja Después Retiros'
                      value={editImporteCajaDespuesRetiros}
                      onChange={(e) => setEditImporteCajaDespuesRetiros(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Opciones de Configuración */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Opciones de Configuración
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: 'white', 
                  p: 2.5, 
                  borderRadius: 1,
                  border: '1px solid #e0e0e0'
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={editEnLinea}
                          onChange={(e) => setEditEnLinea(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            En Línea
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Habilitar operación en línea
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={editValidarTx}
                          onChange={(e) => setEditValidarTx(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Validar TX
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Validar transacciones
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={editRecipeProvAll}
                          onChange={(e) => setEditRecipeProvAll(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Recibe Proveedor All
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Recibir de todos los proveedores
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={editEditaCostosRm}
                          onChange={(e) => setEditEditaCostosRm(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Edita Costos RM
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Permitir edición de costos
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={editCredito}
                          onChange={(e) => setEditCredito(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Crédito
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Habilitar ventas a crédito
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setOpenEdit(false)}
              sx={{ textTransform: 'uppercase', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              variant='contained'
              onClick={handleUpdate}
              disabled={savingEdit}
              sx={{ 
                bgcolor: '#212121',
                textTransform: 'uppercase',
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  bgcolor: '#424242'
                }
              }}
            >
              {savingEdit ? 'Guardando...' : 'Guardar'}
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
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              disabled={saving}
            >
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>

        
      <PWABadge />
    </>
  );
}
