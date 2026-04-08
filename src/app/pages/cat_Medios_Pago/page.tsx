import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Checkbox } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'

interface MedioPago {
  id: number
  sucursal: number
  tipo: number
  descripcion: string
  tarjeta: boolean
  grupo_operacion: number
  cuenta_bancaria_destino: string
  adicion: number
  adicion1: number
  adicion2: number
  adicion3: number
  adicion4: number
  adicion5: number
  adicion6: number
  adicion7: number
  cuenta_contable: string
}

export default function CatMediosPago() {
  const { consumoApi } = useConsumoApi()
  const { session } = useSessionContext() // <--- Agregamos esto
  const [rows, setRows] = useState<MedioPago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedRow, setSelectedRow] = useState<MedioPago | null>(null)

  const [formData, setFormData] = useState({
    sucursal: 0,
    tipo: 0,
    descripcion: '',
    tarjeta: false,
    grupo_operacion: 0,
    cuenta_bancaria_destino: '',
    adicion: 0,
    adicion1: 0,
    adicion2: 0,
    adicion3: 0,
    adicion4: 0,
    adicion5: 0,
    adicion6: 0,
    adicion7: 0,
    cuenta_contable: '',
  })

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton onClick={() => handleEditOpen(params.row)} size="small">
          <EditIcon />
        </IconButton>
      ),
    },
    { field: 'sucursal', headerName: 'Suc', width: 50, type: 'number' },
    { field: 'tipo', headerName: 'Tipo', width: 70, type: 'number' },
    { field: 'descripcion', headerName: 'Descripción', width: 110, type: 'string' },
    {
      field: 'tarjeta',
      headerName: 'TC ?',
      width: 70,
      type: 'boolean',
      renderCell: (params) => (
        <Checkbox checked={!!params.value} disabled />
      ),
    },
    { field: 'grupo_operacion', headerName: 'Grupo_operaciojn', width: 100, type: 'number' },
    { field: 'cuenta_bancaria_destino', headerName: 'Cuenta Bancaria', width: 150, type: 'string' },
    { field: 'adicion', headerName: 'Ad', width: 60, type: 'number' },
    { field: 'adicion1', headerName: 'Ad D', width: 70, type: 'number' },
    { field: 'adicion2', headerName: 'Ad L', width: 70, type: 'number' },
    { field: 'adicion3', headerName: 'Ad M', width: 70, type: 'number' },
    { field: 'adicion4', headerName: 'Ad Mi', width: 70, type: 'number' },
    { field: 'adicion5', headerName: 'Ad J', width: 70, type: 'number' },
    { field: 'adicion6', headerName: 'Ad V', width: 70, type: 'number' },
    { field: 'adicion7', headerName: 'Ad S', width: 70, type: 'number' },
    { field: 'cuenta_contable', headerName: 'Cta Contable', width: 110, type: 'string' },
  ]

  const fetchMediosPago = async () => {
    try {
      setLoading(true)
      const res = await consumoApi.get('/api/CatFormasPagos/sp_bw_cat_tipos_formas_pagos_sel', {
        params: { sucursal: 0 }
      })
      
      const data = res.data.map((item: any, index: number) => ({
        id: index,
        sucursal: item.sucursal,
        tipo: item.tipo,
        descripcion: item.descripcion,
        tarjeta: item.tarjeta,
        grupo_operacion: item.grupo_operacion,
        cuenta_bancaria_destino: item.cuenta_bancaria_destino,
        adicion: item.adicion,
        adicion1: item.adicion1,
        adicion2: item.adicion2,
        adicion3: item.adicion3,
        adicion4: item.adicion4,
        adicion5: item.adicion5,
        adicion6: item.adicion6,
        adicion7: item.adicion7,
        cuenta_contable: item.cuenta_contable,
      }))

      setRows(data)
      setError(null)
    } catch (err) {
      console.error('Error al cargar medios de pago:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMediosPago()
  }, [])

  const handleAddOpen = () => {
    setFormData({
      sucursal: 0,
      tipo: 0,
      descripcion: '',
      tarjeta: false,
      grupo_operacion: 0,
      cuenta_bancaria_destino: '',
      adicion: 0,
      adicion1: 0,
      adicion2: 0,
      adicion3: 0,
      adicion4: 0,
      adicion5: 0,
      adicion6: 0,
      adicion7: 0,
      cuenta_contable: '',
    })
    setOpenAdd(true)
  }

  const handleAddClose = () => {
    setOpenAdd(false)
  }

  const handleEditOpen = (row: MedioPago) => {
    setSelectedRow(row)
    setFormData({
      sucursal: row.sucursal,
      tipo: row.tipo,
      descripcion: row.descripcion,
      tarjeta: row.tarjeta,
      grupo_operacion: row.grupo_operacion,
      cuenta_bancaria_destino: row.cuenta_bancaria_destino,
      adicion: row.adicion,
      adicion1: row.adicion1,
      adicion2: row.adicion2,
      adicion3: row.adicion3,
      adicion4: row.adicion4,
      adicion5: row.adicion5,
      adicion6: row.adicion6,
      adicion7: row.adicion7,
      cuenta_contable: row.cuenta_contable,
    })
    setOpenEdit(true)
  }

  const handleEditClose = () => {
    setOpenEdit(false)
    setSelectedRow(null)
  }

  const handleAdd = async () => {
    console.log('handleAdd llamado', formData);
    try {
      // Validar campos requeridos antes de enviar
      if (!formData.descripcion || formData.descripcion === '0') {
        console.log('Error: descripción vacía');
        setError('La descripción es requerida')
        return
      }
      
      if (formData.cuenta_bancaria_destino.trim() === '') {
        console.log('Error: cuenta bancaria destino vacía');
        setError('La cuenta bancaria destino es requerida')
        return
      }
      
      if (formData.cuenta_contable.trim() === '') {
        console.log('Error: cuenta contable vacía');
        setError('La cuenta contable es requerida')
        return
      }

      console.log('Enviando petición POST con params:', formData);
      const response = await consumoApi.post(
        '/api/CatFormasPagos/sp_bw_cat_tipos_formas_pagos_add',
        {},
        {
          params: formData
        }
      )
      console.log('Respuesta recibida:', response);

      if (response.data?.[0]?.codigo === 0) {
        await fetchMediosPago()
        handleAddClose()
      } else {
        setError(response.data?.[0]?.mensaje1 || 'Error al agregar')
      }
    } catch (err) {
      console.error('Error al agregar medio de pago:', err)
      setError('Error al agregar el medio de pago')
    }
  }

  const handleEdit = async () => {
    try {
      const response = await consumoApi.put(
        '/api/CatFormasPagos/sp_bw_cat_tipos_formas_pagos_upd',
        {},
        {
          params: formData
        }
      )

      if (response.data?.[0]?.codigo === 0) {
        await fetchMediosPago()
        handleEditClose()
      } else {
        setError(response.data?.[0]?.mensaje1 || 'Error al actualizar')
      }
    } catch (err) {
      console.error('Error al actualizar medio de pago:', err)
      setError('Error al actualizar el medio de pago')
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

return (
    <>
      <Box sx={{ width: '100%', p: 3, backgroundColor: '#ececec', minHeight: '100vh' }}>
        
        {/* MAGIA CSS */}
        <style>{`
          .swal2-container {
            z-index: 9999 !important;
          }
        `}</style>

        {/* CONTENEDOR BLANCO PRINCIPAL (ENCABEZADO Y BOTÓN) */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', mb: 3 }}>
          
          {/* RECUADRO INTERIOR ELEGANTE */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                      CATÁLOGO DE MEDIOS DE PAGO
                  </Typography>
                
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                      {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replaceAll('/', '-')}
                  </Typography>
                  
              </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* BOTÓN FUERA DEL RECUADRO PERO DENTRO DEL CONTENEDOR BLANCO */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              variant="contained" 
              onClick={handleAddOpen}
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
              + AGREGAR MEDIO DE PAGO
            </Button>
          </Box>
        </Box>

        {/* CONTENEDOR DE LA TABLA ESTILO ELEGANTE */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
          <Box sx={{ height: 600, width: '100%', minWidth: 800 }}>
          <DataGrid
              rows={rows}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 100 },
                },
              }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                height: '100%',
                fontSize: '0.95rem', /* <--- Tamaño de letra general más legible */
                '& .MuiDataGrid-columnHeaders': { 
                  borderBottom: '2px solid #000', 
                  fontSize: '1rem', /* <--- Encabezados un poco más grandes */
                  fontWeight: 'bold', 
                  backgroundColor: '#f5f5f5' 
                },
                '& .MuiDataGrid-cell': { 
                  borderBottom: '1px solid #e0e0e000' 
                },
                '& .MuiDataGrid-row': { 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease' 
                },
                '& .MuiDataGrid-row:hover': { 
                  bgcolor: '#fafafa' 
                }
              }}
            />
          </Box>
        </Box>

        {/* PIE DE PÁGINA ESTILO ELEGANTE */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            CAT_MEDIOS_PAGO, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '-')}, USR: {session?.nombre || 'ADMIN'}
          </Typography>
        </Box>
        
      </Box>

      <Dialog open={openAdd} onClose={handleAddClose} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Medio de Pago</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Sucursal **"
              type="number"
              value={formData.sucursal}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, sucursal: numValue < 0 ? 0 : numValue });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Tipo **"
              type="number"
              value={formData.tipo}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, tipo: numValue < 0 ? 0 : numValue });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Descripción **"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Box sx={{ mb: 2 }}>
              <Checkbox
                checked={formData.tarjeta}
                onChange={(e) => setFormData({ ...formData, tarjeta: e.target.checked })}
              />
              <label>¿Tarjeta de crédito?</label>
            </Box>
            <TextField
              fullWidth
              label="Grupo Operación **"
              type="number"
              value={formData.grupo_operacion}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, grupo_operacion: numValue < 0 ? 0 : numValue });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Cuenta Bancaria Destino"
              value={formData.cuenta_bancaria_destino}
              onChange={(e) => setFormData({ ...formData, cuenta_bancaria_destino: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición"
              type="number"
              value={formData.adicion}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición1"
              type="number"
              value={formData.adicion1}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion1: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición2"
              type="number"
              value={formData.adicion2}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion2: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición3"
              type="number"
              value={formData.adicion3}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion3: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición4"
              type="number"
              value={formData.adicion4}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion4: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición5"
              type="number"
              value={formData.adicion5}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion5: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición6"
              type="number"
              value={formData.adicion6}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion6: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición7"
              type="number"
              value={formData.adicion7}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion7: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
             <TextField
              fullWidth
              label="Cuenta Contable"
              value={formData.cuenta_contable}
              onChange={(e) => setFormData({ ...formData, cuenta_contable: e.target.value })}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddClose}>Cancelar</Button>
          <Button onClick={handleAdd} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEdit} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Editar Medio de Pago</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Sucursal **"
              type="number"
              value={formData.sucursal}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, sucursal: numValue < 0 ? 0 : numValue });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Tipo **"
              type="number"
              value={formData.tipo}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, tipo: numValue < 0 ? 0 : numValue });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Descripción **"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Box sx={{ mb: 2 }}>
              <Checkbox
                checked={formData.tarjeta}
                onChange={(e) => setFormData({ ...formData, tarjeta: e.target.checked })}
              />
              <label>¿Tarjeta de crédito **?</label>
            </Box>
            <TextField
              fullWidth
              label="Grupo Operación"
              type="number"
              value={formData.grupo_operacion}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, grupo_operacion: numValue < 0 ? 0 : numValue });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Cuenta Bancaria Destino"
              value={formData.cuenta_bancaria_destino}
              onChange={(e) => setFormData({ ...formData, cuenta_bancaria_destino: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Cuenta Contable"
              value={formData.cuenta_contable}
              onChange={(e) => setFormData({ ...formData, cuenta_contable: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición"
              type="number"
              value={formData.adicion}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición1"
              type="number"
              value={formData.adicion1}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion1: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición2"
              type="number"
              value={formData.adicion2}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion2: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición3"
              type="number"
              value={formData.adicion3}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion3: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición4"
              type="number"
              value={formData.adicion4}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion4: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición5"
              type="number"
              value={formData.adicion5}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion5: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición6"
              type="number"
              value={formData.adicion6}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion6: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Adición7"
              type="number"
              value={formData.adicion7}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value) || 0;
                setFormData({ ...formData, adicion7: Math.min(numValue, 1) });
              }}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancelar</Button>
          <Button onClick={handleEdit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </>
  );
}
