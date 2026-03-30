import { useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid, Paper, Snackbar } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'

// --- ESTILOS BERLLANO ELEGANTE 2 ---
const commonProps = {
  fullWidth: true,
  size: 'small' as const,
  variant: 'outlined' as const,
  sx: {
    '& .MuiInputBase-root': {
      height: '50px',
      alignItems: 'center',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      '&:hover': {
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderColor: '#999',
      },
    },
    '& .MuiInputLabel-root': {
      transform: 'translate(14px, 14px) scale(1)',
      color: '#666',
      fontWeight: 500,
    },
    '& .MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
      color: '#333',
      fontWeight: 600,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e0e0e0',
      borderWidth: '1.5px',
    },
  },
};

interface FactorSucursal {
  id: number
  fecha: string
  reventa_ara: number
  reventa_p1: number
  reventa_p2: number
  reventa_ver: number
  reventa_dor: number
  reventa_and: number
  reventa_leju: number
  servicio_ara: number
  servicio_p1: number
  servicio_p2: number
  servicio_ver: number
  servicio_dor: number
  servicio_and: number
  servicio_leju: number
}

export default function FactoresSucursal() {
  const { consumoApi } = useConsumoApi()
  const { session } = useSessionContext() // <--- Extraemos la sesión
  const [rows, setRows] = useState<FactorSucursal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  const [anio, setAnio] = useState(currentYear.toString())
  const [mes, setMes] = useState(currentMonth.toString())
  
  const [openEdit, setOpenEdit] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [editingRow, setEditingRow] = useState<FactorSucursal | null>(null)
  const [viewData, setViewData] = useState<FactorSucursal | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null)

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const [day, month, year] = params.row.fecha.split('/')
        const rowDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        rowDate.setHours(0, 0, 0, 0)
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const isEditable = rowDate >= today
        
        return (
          <IconButton 
            onClick={(e) => { e.stopPropagation(); handleEditOpen(params.row); }} 
            size="small"
            disabled={!isEditable}
            title={!isEditable ? 'Solo se pueden editar fechas actuales o futuras' : 'Editar'}
          >
            <EditIcon />
          </IconButton>
        )
      },
    },
    { 
      field: 'fecha', 
      headerName: 'fecha', 
      width: 110,
      headerAlign: 'center',
      align: 'center',
    },
    { 
      field: 'reventa_ara', 
      headerName: 'Reventa_Ara', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_p1', 
      headerName: 'Reventa_P1', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_p2', 
      headerName: 'Reventa_P2', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_ver', 
      headerName: 'Reventa_Ver', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_dor', 
      headerName: 'Reventa_Dor', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_and', 
      headerName: 'Reventa_And', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_leju', 
      headerName: 'Reventa_Leju', 
      width: 110,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_ara', 
      headerName: 'Servicio_Ara', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_p1', 
      headerName: 'Servicio_P1', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_p2', 
      headerName: 'Servicio_P2', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_ver', 
      headerName: 'Servicio_Ver', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_dor', 
      headerName: 'Servicio_Dor', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_and', 
      headerName: 'Servicio_And', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_leju', 
      headerName: 'Servicio_Leju', 
      width: 110,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
  ]

  const handleConsultar = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await consumoApi.get('/api/CatFactoresSucursal/sp_bw_porcentajesCross_sel', {
        params: {
          a: parseInt(anio),
          m: parseInt(mes),
        }
      })
      
      const data = res.data.map((item: any, index: number) => ({
        id: index,
        fecha: new Date(item.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        reventa_ara: item.Reventa_Ara ?? 0,
        reventa_p1: item.Reventa_P1 ?? 0,
        reventa_p2: item.Reventa_P2 ?? 0,
        reventa_ver: item.Reventa_Ver ?? 0,
        reventa_dor: item.Reventa_Dor ?? 0,
        reventa_and: item.Reventa_And ?? 0,
        reventa_leju: item.Reventa_Leju ?? 0,
        servicio_ara: item.Servicio_Ara ?? 0,
        servicio_p1: item.Servicio_P1 ?? 0,
        servicio_p2: item.Servicio_P2 ?? 0,
        servicio_ver: item.Servicio_Ver ?? 0,
        servicio_dor: item.Servicio_Dor ?? 0,
        servicio_and: item.Servicio_And ?? 0,
        servicio_leju: item.Servicio_Leju ?? 0,
      }))

      setRows(data)
      setMessage({ text: 'Datos consultados exitosamente', type: 'success' })
    } catch (err) {
      console.error('Error al consultar factores:', err)
      setMessage({ text: 'Error al cargar los datos', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleViewOpen = (row: FactorSucursal) => {
    setViewData({ ...row })
    setOpenView(true)
  }

  const handleViewClose = () => {
    setOpenView(false)
    setViewData(null)
  }

  const handleEditOpen = (row: FactorSucursal) => {
    setEditingRow({ ...row })
    setOpenEdit(true)
  }

  const handleEditClose = () => {
    setOpenEdit(false)
    setEditingRow(null)
  }

  const handleFieldChange = (field: keyof FactorSucursal, value: string) => {
    if (editingRow) {
      setEditingRow({
        ...editingRow,
        [field]: parseFloat(value) || 0,
      })
    }
  }

  const handleSave = async () => {
    if (!editingRow) return

    try {
      setSaving(true)
      
      const response = await consumoApi.put(
        '/api/CatFactoresSucursal/sp_bw_porcentajesCross_upd',
        {
          fecha: editingRow.fecha,
          reventa_ara: editingRow.reventa_ara,
          reventa_p1: editingRow.reventa_p1,
          reventa_p2: editingRow.reventa_p2,
          reventa_ver: editingRow.reventa_ver,
          reventa_dor: editingRow.reventa_dor,
          reventa_and: editingRow.reventa_and,
          reventa_leju: editingRow.reventa_leju,
          servicio_ara: editingRow.servicio_ara,
          servicio_p1: editingRow.servicio_p1,
          servicio_p2: editingRow.servicio_p2,
          servicio_ver: editingRow.servicio_ver,
          servicio_dor: editingRow.servicio_dor,
          servicio_and: editingRow.servicio_and,
          servicio_leju: editingRow.servicio_leju,
        }
      )

      const result = response.data?.[0]
      
      if (result?.codigo === 0) {
        setRows(rows.map(row => 
          row.id === editingRow.id ? editingRow : row
        ))
        handleEditClose()
        setMessage({ text: 'Factores actualizados exitosamente', type: 'success' })
      } else {
        setMessage({ text: result?.mensaje1 || 'Error al actualizar', type: 'error' })
      }
    } catch (err) {
      console.error('Error al actualizar:', err)
      setMessage({ text: 'Error al actualizar los datos', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

return (
    <>
      <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
        
        <style>{`
          .swal2-container {
            z-index: 9999 !important;
          }
        `}</style>

        {/* CONTENEDOR BLANCO SUPERIOR (ENCABEZADO + FILTROS) */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', mb: 3 }}>
          
          {/* RECUADRO INTERIOR ELEGANTE (SOLO TÍTULO Y DATOS) */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem', textTransform: 'uppercase' }}>
                FACTORES POR SUCURSAL
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                Sucursal: {session?.dSucursal || 'Cargando...'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replaceAll('/', '-')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                Usuario Activo: {session?.nombre || 'Cargando...'}
              </Typography>
            </Box>
          </Box>

          {/* SECCIÓN DE FILTROS (FUERA DEL RECUADRO PERO DENTRO DEL BLANCO) */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 'bold', color: '#333' }}>Año</Typography>
              <TextField
                {...commonProps}
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                type="number"
                sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                inputProps={{ min: 2000, max: 2100 }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 'bold', color: '#333' }}>Mes</Typography>
              <TextField
                {...commonProps}
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                type="number"
                sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                inputProps={{ min: 1, max: 12 }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={handleConsultar}
              disabled={loading}
              sx={{
                height: '50px',
                backgroundColor: '#333333',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#555555', 
                  boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', 
                  transform: 'translateY(-1px)' 
                },
              }}
            >
              {loading ? 'Consultando...' : 'Consultar'}
            </Button>
          </Box>
        </Box>

        {/* CONTENEDOR BLANCO SOLO PARA LA TABLA */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)', mb: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                pageSizeOptions={[10, 25, 50, 100]}
                onRowClick={(params) => handleViewOpen(params.row)}
                disableRowSelectionOnClick
                sx={{
                  border: 'none',
                  height: '100%',
                  fontSize: '0.95rem',
                  '& .MuiDataGrid-columnHeaders': { 
                    borderBottom: '2px solid #000', 
                    fontSize: '1rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    textAlign: 'center'
                  },
                  '& .MuiDataGrid-cell': { 
                    borderBottom: '1px solid #e0e0e000',
                    cursor: 'pointer'
                  },
                  '& .MuiDataGrid-row': { transition: 'all 0.2s ease' },
                  '& .MuiDataGrid-row:hover': { backgroundColor: '#fafafa' },
                }}
              />
            </Box>
          )}
        </Box>

        {/* PIE DE PÁGINA ESTILO ELEGANTE */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3, mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            FACTORES_SUCURSAL, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '-')}, USR: {session?.nombre || 'ADMIN'}
          </Typography>
        </Box>

        {/* NOTIFICACIONES */}
        <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(null)}>
          <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
        </Snackbar>
      </Box>

      {/* Dialog Ver Detalles */}
      <Dialog 
        open={openView} 
        onClose={handleViewClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 'bold', 
          color: '#1a365d',
          borderBottom: '1px solid #e0e0e0',
          py: 2
        }}>
          <Typography variant='h6' sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Detalles de Factores: {viewData?.fecha}
          </Typography>
          <Typography variant='body2' sx={{ color: '#555', mt: 0.5 }}>
            Información completa de factores por sucursal
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          {viewData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Factores de Reventa */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #1a365d',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600, color: '#1a365d' }}>
                    Factores de Reventa
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  {[
                    { label: 'Reventa Ara', value: viewData.reventa_ara },
                    { label: 'Reventa P1', value: viewData.reventa_p1 },
                    { label: 'Reventa P2', value: viewData.reventa_p2 },
                    { label: 'Reventa Ver', value: viewData.reventa_ver },
                    { label: 'Reventa Dor', value: viewData.reventa_dor },
                    { label: 'Reventa And', value: viewData.reventa_and },
                    { label: 'Reventa Leju', value: viewData.reventa_leju },
                  ].map((item, index) => (
                    <Box key={index}>
                      <Typography variant='caption' sx={{ color: '#666', fontWeight: 500 }}>{item.label}</Typography>
                      <Typography variant='body2' sx={{ fontWeight: 600, color: '#333' }}>
                        {((item.value ?? 0) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Factores de Servicio */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #1a365d',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600, color: '#1a365d' }}>
                    Factores de Servicio
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  {[
                    { label: 'Servicio Ara', value: viewData.servicio_ara },
                    { label: 'Servicio P1', value: viewData.servicio_p1 },
                    { label: 'Servicio P2', value: viewData.servicio_p2 },
                    { label: 'Servicio Ver', value: viewData.servicio_ver },
                    { label: 'Servicio Dor', value: viewData.servicio_dor },
                    { label: 'Servicio And', value: viewData.servicio_and },
                    { label: 'Servicio Leju', value: viewData.servicio_leju },
                  ].map((item, index) => (
                    <Box key={index}>
                      <Typography variant='caption' sx={{ color: '#666', fontWeight: 500 }}>{item.label}</Typography>
                      <Typography variant='body2' sx={{ fontWeight: 600, color: '#333' }}>
                        {((item.value ?? 0) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleViewClose}
            sx={{ 
              backgroundColor: '#e0e0e0', 
              color: '#000', 
              fontWeight: 'bold',
              '&:hover': { backgroundColor: '#d0d0d0' },
              borderRadius: '8px'
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openEdit} 
        onClose={handleEditClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 'bold', 
          color: '#1a365d',
          borderBottom: '1px solid #e0e0e0',
          py: 2
        }}>
          <Typography variant='h6' sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Editar Factores: {editingRow?.fecha}
          </Typography>
          <Typography variant='body2' sx={{ color: '#555', mt: 0.5 }}>
            Modificar los factores de reventa y servicio
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {editingRow && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#1a365d' }}>
                Fecha: {editingRow.fecha}
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold', color: '#1a365d' }}>Reventa</Typography>
              <Grid container spacing={2}>
                {[
                  { label: "Reventa Ara", field: 'reventa_ara' },
                  { label: "Reventa P1", field: 'reventa_p1' },
                  { label: "Reventa P2", field: 'reventa_p2' },
                  { label: "Reventa Ver", field: 'reventa_ver' },
                  { label: "Reventa Dor", field: 'reventa_dor' },
                  { label: "Reventa And", field: 'reventa_and' },
                  { label: "Reventa Leju", field: 'reventa_leju' },
                ].map((item, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <TextField
                      {...commonProps}
                      label={item.label}
                      type="number"
                      value={editingRow[item.field as keyof FactorSucursal]}
                      onChange={(e) => handleFieldChange(item.field as keyof FactorSucursal, e.target.value)}
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold', color: '#1a365d' }}>Servicio</Typography>
              <Grid container spacing={2}>
                {[
                  { label: "Servicio Ara", field: 'servicio_ara' },
                  { label: "Servicio P1", field: 'servicio_p1' },
                  { label: "Servicio P2", field: 'servicio_p2' },
                  { label: "Servicio Ver", field: 'servicio_ver' },
                  { label: "Servicio Dor", field: 'servicio_dor' },
                  { label: "Servicio And", field: 'servicio_and' },
                  { label: "Servicio Leju", field: 'servicio_leju' },
                ].map((item, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <TextField
                      {...commonProps}
                      label={item.label}
                      type="number"
                      value={editingRow[item.field as keyof FactorSucursal]}
                      onChange={(e) => handleFieldChange(item.field as keyof FactorSucursal, e.target.value)}
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleEditClose} 
            disabled={saving}
            sx={{ 
              backgroundColor: '#e0e0e0', 
              color: '#000', 
              fontWeight: 'bold',
              '&:hover': { backgroundColor: '#d0d0d0' },
              borderRadius: '8px'
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            sx={{ 
              backgroundColor: '#333333', 
              color: 'white', 
              fontWeight: 600, 
              textTransform: 'none', 
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', 
              transition: 'all 0.3s ease',
              '&:hover': { 
                backgroundColor: '#555555', 
                boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', 
                transform: 'translateY(-1px)' 
              }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </>
  )
}
