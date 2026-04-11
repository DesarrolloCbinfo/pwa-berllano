import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField, Paper, Grid, Checkbox, FormControlLabel, InputAdornment } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'
import { Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material'
import Swal from 'sweetalert2'

interface Plastico {
  id: number
  plastico: string
}
// --- ESTILOS BERLLANO ELEGANTE ---
const commonProps = {
  fullWidth: true,
  size: "small" as const,
  variant: "outlined" as const,
  sx: {
      '& .MuiInputBase-root': { 
          height: '50px', 
          alignItems: 'center',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            borderColor: '#999'
          }
      },
      '& .MuiInputLabel-root': { 
          transform: 'translate(14px, 14px) scale(1)',
          color: '#666',
          fontWeight: 500
      },
      '& .MuiInputLabel-shrink': { 
          transform: 'translate(14px, -9px) scale(0.75)',
          color: '#333',
          fontWeight: 600
      },
      '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#e0e0e0',
          borderWidth: '1.5px'
      }
  }
};



export default function CatPlasticosAutorizados() {
  const { consumoApi } = useConsumoApi()
  const { session } = useSessionContext() // <--- Agregamos la sesión
  const [rows, setRows] = useState<Plastico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openReasignacion, setOpenReasignacion] = useState(false)
  const [openBuscarCliente, setOpenBuscarCliente] = useState(false)
  const [openReporte, setOpenReporte] = useState(false)
  const [openAgregar, setOpenAgregar] = useState(false)
  const [openEditar, setOpenEditar] = useState(false)
  const [plasticoEditando, setPlasticoEditando] = useState<Plastico | null>(null)
  const [nuevoPlastico, setNuevoPlastico] = useState('')
  const [nuevoPlasticoAgregar, setNuevoPlasticoAgregar] = useState('')
  const [busqueda, setBusqueda] = useState('')
  
  // Estados para el formulario de reasignación
  const [reasignacionData, setReasignacionData] = useState({
    cliente: '',
    plasticoActual: '',
    usuarioAsig: '',
    fechaAsignacion: '',
    activo: false,
    nuevoPlastico: '',
    activoNuevo: false,
    identificacion: '',
    motivo: ''
  })

  // Estados para búsqueda de clientes
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null)
  const [clientesData, setClientesData] = useState<any[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)

  // Funciones de manejo antes de las columnas
  const handleEditar = (plastico: Plastico) => {
    setPlasticoEditando(plastico);
    setNuevoPlastico(plastico.plastico);
    setOpenEditar(true);
  }

  const handleEliminar = async (plastico: Plastico) => {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar Plástico?',
      text: `¿Está seguro de eliminar el plástico ${plastico.plastico}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#333333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!confirmacion.isConfirmed) return

    try {
      await consumoApi.delete(`/api/CatPlasticos_Autorizados/sp_bw_cat_config_plasticos_autorizados_del?id=${plastico.id}`)
      Swal.fire({ 
        title: '¡Éxito!', 
        text: 'Plástico eliminado correctamente', 
        icon: 'success',
        confirmButtonColor: '#333333'
      })
      fetchPlasticos()
    } catch (error) {
      Swal.fire({ 
        title: 'Error', 
        text: 'Error al eliminar el plástico', 
        icon: 'error',
        confirmButtonColor: '#333333'
      })
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEditar(params.row)}
            sx={{ '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleEliminar(params.row)}
            sx={{ '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.08)' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
    { 
      field: 'plastico', 
      headerName: 'Plástico', 
      flex: 1,
      minWidth: 200,
      headerAlign: 'center',
      align: 'center',
    },
  ]

  const fetchPlasticos = async () => {
    try {
      setLoading(true)
      const res = await consumoApi.get('/api/CatPlasticos_Autorizados/sp_bw_cat_config_plasticos_autorizados_sel')
      
      const data = res.data.map((item: any) => ({
        id: item.id,
        plastico: item.num_plastico,
      }))

      setRows(data)
      setError(null)
    } catch (err) {
      console.error('Error al cargar plásticos:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlasticos()
  }, [])

  const handleReasignacion = () => {
    setOpenReasignacion(true)
  }

  const handleReporte = () => {
    setOpenReporte(true)
  }

  const handleSalir = () => {
    window.history.back()
  }

  // Filtrar plásticos según la búsqueda
  const plasticosFiltrados = rows.filter(plastico => 
    plastico.plastico.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleActualizarPlastico = async () => {
    if (!nuevoPlastico.trim()) {
      Swal.fire({
        title: 'Atención',
        text: 'El número de plástico es obligatorio',
        icon: 'warning',
        confirmButtonColor: '#333333'
      });
      return;
    }

    try {
      await consumoApi.put(`/api/CatPlasticos_Autorizados/sp_bw_cat_config_plasticos_autorizados_upd?id=${plasticoEditando?.id}&num_plastico=${nuevoPlastico.trim()}`);
      Swal.fire({
        title: '¡Éxito!',
        text: 'Plástico actualizado correctamente',
        icon: 'success',
        confirmButtonColor: '#333333'
      });
      setOpenEditar(false);
      fetchPlasticos();
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar el plástico',
        icon: 'error',
        confirmButtonColor: '#333333'
      });
    }
  }

  const handleBuscarClientes = async () => {
    if (!busquedaCliente.trim()) {
      Swal.fire({
        title: 'Atención',
        text: 'Ingrese un nombre para buscar',
        icon: 'warning',
        confirmButtonColor: '#333333'
      });
      return;
    }

    setLoadingClientes(true);
    try {
      const res = await consumoApi.get(`/api/CatPlasticos_Autorizados/sp_bw_cat_clientes_suc_sel?No_cliente=${busquedaCliente.trim()}`);
      
      if (res.data && Array.isArray(res.data)) {
        const clientesFormateados = res.data.map((cliente: any) => ({
          clave: cliente.No_cliente,
          rfc: cliente.rfc || '',
          nombre: `${cliente.nombre} ${cliente.ap_paterno || ''} ${cliente.ap_materno || ''}`.trim(),
          direccion: cliente.domicilio || '',
          // Datos completos del cliente
          telefono: cliente.telefono,
          calle: cliente.Calle,
          num_exterior: cliente.Num_Exterior,
          num_interior: cliente.Num_Interior,
          cp: cliente.cp,
          colonia: cliente.colonia,
          ciudad: cliente.ciudad,
          estado: cliente.estado,
          contacto: cliente.contacto,
          email: cliente.email,
          limite_credito: cliente.limite_credito,
          dias_credito: cliente.dias_credito,
          persona_fisica: cliente.persona_fisica,
          suspendido: cliente.suspendido,
          fecha_alta: cliente.fecha_alta,
          num_plastico: cliente.num_plastico,
          usr_asig_plast: cliente.usr_asig_plast,
          fecha_asig_plast: cliente.fecha_asig_plast,
          plastico_activo: cliente.plastico_activo,
          clave_lista_credito: cliente.clave_lista_credito,
          clave_lista_mayoreo: cliente.clave_lista_mayoreo,
          sucursal_origen: cliente.sucursal_origen
        }));
        setClientesData(clientesFormateados);
        
        if (clientesFormateados.length === 0) {
          Swal.fire({
            title: 'Sin resultados',
            text: 'No se encontraron clientes con ese criterio',
            icon: 'info',
            confirmButtonColor: '#333333'
          });
        }
      }
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al buscar clientes',
        icon: 'error',
        confirmButtonColor: '#333333'
      });
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleAgregarPlastico = async () => {
    if (!nuevoPlasticoAgregar.trim()) {
      Swal.fire({
        title: 'Atención',
        text: 'El número de plástico es obligatorio',
        icon: 'warning',
        confirmButtonColor: '#333333'
      });
      return;
    }

    try {
      // Endpoint correcto para agregar plásticos
      await consumoApi.post(`/api/CatPlasticos_Autorizados/sp_bw_cat_config_plasticos_autorizados_add?num_plastico=${nuevoPlasticoAgregar.trim()}`);
      Swal.fire({
        title: '¡Éxito!',
        text: 'Plástico agregado correctamente',
        icon: 'success',
        confirmButtonColor: '#333333'
      });
      setOpenAgregar(false);
      setNuevoPlasticoAgregar('');
      fetchPlasticos();
    } catch (error: any) {
      console.error('Error al agregar plástico:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.mensaje || 'Error al agregar el plástico',
        icon: 'error',
        confirmButtonColor: '#333333'
      });
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ width: '100%', p: 3, backgroundColor: '#ececec', minHeight: '100vh' }}>
        
        <style>{`
          .swal2-container {
            z-index: 9999 !important;
          }
        `}</style>

       {/* CONTENEDOR BLANCO SUPERIOR (ENCABEZADO + FILTROS) */}
        <Paper sx={{ p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', mb: 3 }}>
          
          {/* RECUADRO INTERIOR ELEGANTE */}
          <Box sx={{ border: '1px solid #000000ff', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem', textTransform: 'uppercase' }}>
                      ALTA DE PLÁSTICOS AUTORIZADOS
                  </Typography>
                  
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                      {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replaceAll('/', '-')}
                  </Typography>
                 
              </Box>
          </Box>

          {/* BARRA DE BOTÓN AGREGAR Y BÚSQUEDA INTEGRADA LIMPIAMENTE */}
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm={4} md={3}>
              <Button
                variant="contained"
                onClick={() => setOpenAgregar(true)}
                fullWidth
                sx={{ 
                  height: '40px', 
                  bgcolor: '#333333', 
                  fontWeight: 'bold', 
                  borderRadius: '8px',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(51,51,51,0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': { bgcolor: '#555555', transform: 'translateY(-1px)' }
                }}
              >
                + AGREGAR PLÁSTICO
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar plástico"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#555',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#333',
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* CONTENEDOR DE LA TABLA */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
          <Box sx={{ height: 500, width: '100%', mb: 3 }}>
            <DataGrid
              rows={plasticosFiltrados}
              columns={columns}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 50 },
                },
              }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                height: '100%',
                fontSize: '0.95rem', /* Tamaño de letra general */
                '& .MuiDataGrid-columnHeaders': { 
                  borderBottom: '2px solid #000', 
                  fontSize: '1rem', /* Encabezados un poco más grandes */
                  fontWeight: 'bold', 
                  backgroundColor: '#f5f5f5' 
                },
                '& .MuiDataGrid-cell': { 
                  borderBottom: '1px solid #e0e0e000' /* Quita líneas divisorias de las celdas */
                },
                '& .MuiDataGrid-row': { 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease' 
                },
                '& .MuiDataGrid-row:hover': { 
                  bgcolor: '#fafafa' /* Efecto sutil al pasar el mouse */
                }
              }}
            />
          </Box>

          {/* BOTONERA INFERIOR */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleReasignacion}
              sx={{ 
                minWidth: 200, 
                bgcolor: '#333333', 
                fontWeight: 600, 
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(51,51,51,0.3)',
                '&:hover': { bgcolor: '#555555' }
              }}
            >
              Reasignación de Plásticos
            </Button>
          
          </Box>
        </Box>
        </Box>

      {/* Dialog de Reasignación */}
      <Dialog 
        open={openReasignacion} 
        onClose={() => setOpenReasignacion(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e0e0e0',
            overflow: 'hidden'
          }
        }}
      >
        {/* ENCABEZADO */}
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Reasignación de Plástico
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Tarjetas de Lealtad
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={() => setOpenReasignacion(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* CONTENIDO */}
        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            {/* Cliente con botón de búsqueda */}
            <Grid item xs={12}>
              <TextField
                {...commonProps}
                label="Cliente:"
                value={reasignacionData.cliente}
                onChange={(e) => setReasignacionData({ ...reasignacionData, cliente: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        edge="end" 
                        size="small" 
                        onClick={() => setOpenBuscarCliente(true)}
                        sx={{ color: '#666', '&:hover': { color: '#333', bgcolor: 'rgba(0,0,0,0.05)' } }}
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Plástico Actual y Usuario Asig */}
            <Grid item xs={12} md={6}>
              <TextField
                {...commonProps}
                label="Plástico Actual:"
                value={reasignacionData.plasticoActual}
                onChange={(e) => setReasignacionData({ ...reasignacionData, plasticoActual: e.target.value })}
                disabled
                sx={{
                  ...commonProps.sx,
                  '& .MuiInputBase-root.Mui-disabled': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                {...commonProps}
                label="Usuario Asig:"
                value={reasignacionData.usuarioAsig}
                onChange={(e) => setReasignacionData({ ...reasignacionData, usuarioAsig: e.target.value })}
                disabled
                sx={{
                  ...commonProps.sx,
                  '& .MuiInputBase-root.Mui-disabled': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              />
            </Grid>

            {/* Fecha Asignación y Activo */}
            <Grid item xs={12} md={6}>
              <TextField
                {...commonProps}
                label="Fecha Asignación:"
                value={reasignacionData.fechaAsignacion}
                onChange={(e) => setReasignacionData({ ...reasignacionData, fechaAsignacion: e.target.value })}
                disabled
                sx={{
                  ...commonProps.sx,
                  '& .MuiInputBase-root.Mui-disabled': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '50px', px: 2, borderRadius: '8px', border: '1.5px solid #e0e0e0', bgcolor: '#fafafa' }}>
                <Typography variant='body2' sx={{ fontWeight: 600, color: '#666', mr: 2 }}>Activo:</Typography>
                <Checkbox 
                  checked={reasignacionData.activo}
                  onChange={(e) => setReasignacionData({ ...reasignacionData, activo: e.target.checked })}
                  disabled
                  sx={{ color: '#999', '&.Mui-checked': { color: '#999' } }}
                />
              </Box>
            </Grid>

            {/* Nuevo Plástico y Activo (nuevo) */}
            <Grid item xs={12} md={6}>
              <TextField
                {...commonProps}
                label="Nuevo Plástico:"
                value={reasignacionData.nuevoPlastico}
                onChange={(e) => setReasignacionData({ ...reasignacionData, nuevoPlastico: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '50px', px: 2, borderRadius: '8px', border: '1.5px solid #e0e0e0', bgcolor: '#fafafa', transition: 'all 0.3s ease', '&:hover': { borderColor: '#999', bgcolor: '#f5f5f5' } }}>
                <Typography variant='body2' sx={{ fontWeight: 600, color: '#333', mr: 2 }}>Activo:</Typography>
                <Checkbox 
                  checked={reasignacionData.activoNuevo}
                  onChange={(e) => setReasignacionData({ ...reasignacionData, activoNuevo: e.target.checked })}
                  sx={{ color: '#333', '&.Mui-checked': { color: '#1a365d' } }}
                />
              </Box>
            </Grid>

            {/* Identificación */}
            <Grid item xs={12}>
              <TextField
                {...commonProps}
                label="Identificación:"
                value={reasignacionData.identificacion}
                onChange={(e) => setReasignacionData({ ...reasignacionData, identificacion: e.target.value })}
              />
            </Grid>

            {/* Motivo */}
            <Grid item xs={12}>
              <TextField
                {...commonProps}
                label="Motivo:"
                value={reasignacionData.motivo}
                onChange={(e) => setReasignacionData({ ...reasignacionData, motivo: e.target.value })}
                multiline
                rows={3}
                sx={{
                  ...commonProps.sx,
                  '& .MuiInputBase-root': {
                    height: 'auto',
                    alignItems: 'flex-start',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    '&:hover': {
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      borderColor: '#999'
                    }
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        {/* FOOTER Y BOTONES */}
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained"
            sx={{ 
              bgcolor: '#000000ff', 
              color: 'white', 
              borderRadius: '8px', 
              fontWeight: 600, 
              textTransform: 'none',
              minWidth: 120,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', 
              transition: 'all 0.3s ease',
              '&:hover': { 
                bgcolor: '#333333', 
                transform: 'translateY(-1px)', 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
              }
            }}
          >
            Aceptar
          </Button>
          <Button 
            onClick={() => setOpenReasignacion(false)}
            variant="outlined"
            sx={{ 
              borderRadius: '8px', 
              fontWeight: 600, 
              textTransform: 'none',
              minWidth: 120,
              borderColor: '#999',
              color: '#333',
              transition: 'all 0.3s ease', 
              '&:hover': { 
                backgroundColor: '#e0e0e0', 
                borderColor: '#666',
                color: '#000' 
              } 
            }}
          >
            Salir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Búsqueda de Clientes */}
      <Dialog 
        open={openBuscarCliente} 
        onClose={() => setOpenBuscarCliente(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            minHeight: '600px'
          }
        }}
      >
        {/* ENCABEZADO */}
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 2.5, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Buscador de Clientes
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={() => setOpenBuscarCliente(false)}
            sx={{ position: 'absolute', top: 12, right: 12, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* CONTENIDO */}
        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          {/* Campo de búsqueda */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                  Nombre:
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  placeholder="Buscar cliente..."
                  sx={{
                    '& .MuiInputBase-root': {
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      '&:hover fieldset': { borderColor: '#555' },
                      '&.Mui-focused fieldset': { borderColor: '#333' }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleBuscarClientes}
                  disabled={loadingClientes}
                  sx={{
                    bgcolor: '#333333',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '8px',
                    height: '40px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    '&:hover': { bgcolor: '#555555', transform: 'translateY(-1px)' },
                    '&:disabled': { bgcolor: '#999', color: '#ccc' }
                  }}
                >
                  {loadingClientes ? 'Buscando...' : 'Buscar'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Tabla de clientes */}
          <Box sx={{ 
            border: '2px solid #000', 
            borderRadius: '8px', 
            overflow: 'hidden',
            mb: 3,
            maxHeight: '250px',
            overflowY: 'auto'
          }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 2fr 2fr',
              bgcolor: '#000',
              color: 'white',
              fontWeight: 'bold',
              p: 1.5,
              fontSize: '0.9rem'
            }}>
              <Box sx={{ px: 1 }}>-CLAVE-</Box>
              <Box sx={{ px: 1 }}>-RFC-</Box>
              <Box sx={{ px: 1 }}>-NOMBRE COMPLETO-</Box>
              <Box sx={{ px: 1 }}>-DIRECCIÓN-</Box>
            </Box>
            
            {clientesData.map((cliente, index) => (
                <Box
                  key={index}
                  onClick={() => setClienteSeleccionado(cliente)}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 2fr 2fr',
                    p: 1.5,
                    cursor: 'pointer',
                    bgcolor: clienteSeleccionado?.clave === cliente.clave ? '#000' : (index % 2 === 0 ? '#fff' : '#f5f5f5'),
                    color: clienteSeleccionado?.clave === cliente.clave ? '#fff' : '#000',
                    transition: 'all 0.2s ease',
                    borderBottom: '1px solid #e0e0e0',
                    fontSize: '0.85rem',
                    '&:hover': {
                      bgcolor: clienteSeleccionado?.clave === cliente.clave ? '#000' : '#e8e8e8'
                    }
                  }}
                >
                  <Box sx={{ px: 1 }}>{cliente.clave}</Box>
                  <Box sx={{ px: 1 }}>{cliente.rfc}</Box>
                  <Box sx={{ px: 1 }}>{cliente.nombre}</Box>
                  <Box sx={{ px: 1 }}>{cliente.direccion}</Box>
                </Box>
              ))}
          </Box>

          {/* Detalles del cliente seleccionado */}
          {clienteSeleccionado && (
            <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 3, bgcolor: '#fafafa' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '150px' }}>
                      Clave del Cliente:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.clave || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={<Checkbox size="small" checked={clienteSeleccionado.persona_fisica || false} disabled />}
                    label="Persona física"
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 600 } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={<Checkbox size="small" checked={clienteSeleccionado.suspendido || false} disabled />}
                    label="Suspendido"
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 600 } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '150px' }}>
                      Nombre del Cliente:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.nombre || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '80px' }}>
                      R.F.C.:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.rfc || ''}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '50px' }}>
                      Tel1:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.telefono || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '80px' }}>
                      Calle:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.calle || ''}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                      Número Exterior:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.num_exterior || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                      Número Interior:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.num_interior || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '50px' }}>
                      C.P.:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.cp || ''}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '80px' }}>
                      Colonia:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.colonia || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '80px' }}>
                      Ciudad:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.ciudad || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '80px' }}>
                      Estado:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.estado || ''}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '80px' }}>
                      Contacto:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.contacto || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '80px' }}>
                      E-mail:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.email || ''}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '130px' }}>
                      Límite de crédito:
                    </Typography>
                    <Typography variant="body2">${clienteSeleccionado.limite_credito?.toFixed(2) || '0.00'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '100px' }}>
                      Días crédito:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.dias_credito || 0}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '150px' }}>
                      L. Precios Contado:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.clave_lista_mayoreo || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '150px' }}>
                      Lista de Precios Crédito:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.clave_lista_credito || ''}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '80px' }}>
                      Sucursal:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.sucursal_origen || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '50px' }}>
                      Alta:
                    </Typography>
                    <Typography variant="body2">{clienteSeleccionado.fecha_alta ? new Date(clienteSeleccionado.fecha_alta).toLocaleString('es-MX') : ''}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        {/* FOOTER Y BOTONES */}
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa', justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => {
              if (clienteSeleccionado) {
                setReasignacionData({ ...reasignacionData, cliente: clienteSeleccionado.nombre });
                setOpenBuscarCliente(false);
              }
            }}
            variant="contained"
            disabled={!clienteSeleccionado}
            sx={{ 
              bgcolor: '#000000ff', 
              color: 'white', 
              borderRadius: '8px', 
              fontWeight: 600, 
              textTransform: 'none',
              minWidth: 120,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', 
              transition: 'all 0.3s ease',
              '&:hover': { 
                bgcolor: '#333333', 
                transform: 'translateY(-1px)', 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
              },
              '&:disabled': {
                bgcolor: '#999',
                color: '#ccc'
              }
            }}
          >
            Aceptar
          </Button>
          <Button 
            onClick={() => setOpenBuscarCliente(false)}
            variant="outlined"
            sx={{ 
              borderRadius: '8px', 
              fontWeight: 600, 
              textTransform: 'none',
              minWidth: 120,
              borderColor: '#999',
              color: '#333',
              transition: 'all 0.3s ease', 
              '&:hover': { 
                backgroundColor: '#e0e0e0', 
                borderColor: '#666',
                color: '#000' 
              } 
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Agregar Plástico */}
      <Dialog 
        open={openAgregar} 
        onClose={() => setOpenAgregar(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }
        }}
      >
        {/* ENCABEZADO ELEGANTE */}
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Agregar Plástico Autorizado
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Ingrese el número de plástico a agregar en el sistema
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={() => setOpenAgregar(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* CONTENIDO MODAL */}
        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                {...commonProps}
                label="Número de Plástico *"
                value={nuevoPlasticoAgregar}
                onChange={(e) => setNuevoPlasticoAgregar(e.target.value)}
                placeholder="Ej: 1234567890123"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        {/* FOOTER Y BOTONES */}
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={() => setOpenAgregar(false)} 
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAgregarPlastico}
            variant="contained"
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            Agregar Plástico
          </Button>
        </DialogActions>
      </Dialog>

   {/* Dialog de Editar Plástico */}
      <Dialog 
        open={openEditar} 
        onClose={() => setOpenEditar(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }
        }}
      >
        {/* ENCABEZADO ELEGANTE */}
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Editar Plástico Autorizado
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Modifique el número de plástico correspondiente al ID: {plasticoEditando?.id}
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={() => setOpenEditar(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* CONTENIDO MODAL */}
        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                {...commonProps}
                label="Número de Plástico *"
                value={nuevoPlastico}
                onChange={(e) => setNuevoPlastico(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        {/* FOOTER Y BOTONES */}
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={() => setOpenEditar(false)} 
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleActualizarPlastico}
            variant="contained"
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            Actualizar Plástico
          </Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </>
  )
}