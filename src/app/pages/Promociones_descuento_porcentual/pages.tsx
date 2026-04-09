import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, IconButton, TextField } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import Swal from 'sweetalert2'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'

interface Promocion {
  id: number
  nombrePromo: string
  sucursal: string
  f1: string
  f2: string
  area: string
  depto: string
  marca: string
  familia: string
  clave_prod: string
  cantidad: number
  descuento: number
  idDescuento: string
}

interface Sucursal {
  cve_sucursal: number
  nombre: string
}

interface Area {
  id: string
  descripcion: string
}

interface Departamento {
  id: string
  descripcion: string
}

interface Marca {
  id: number
  marca: string
}

interface Familia {
  clave: number
  descripcion: string
}

interface Producto {
  clave_prod: string
  descripcion: string
}

interface TipoDescuento {
  tipo_descuento: number
  descripcion: string
}

export default function ConfiguracionPromocionesDescuentoPorcentual() {
  const { consumoApi } = useConsumoApi()
  const { session } = useSessionContext() // <--- Extraemos la sesión
  const [rows, setRows] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [tiposDescuento, setTiposDescuento] = useState<TipoDescuento[]>([])

  const [nombrePromo, setNombrePromo] = useState('')
  const [selectedSucursal, setSelectedSucursal] = useState('')
  const [fechaDel, setFechaDel] = useState('')
  const [fechaAl, setFechaAl] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedDepto, setSelectedDepto] = useState('')
  const [selectedMarca, setSelectedMarca] = useState('')
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [selectedProducto, setSelectedProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [descPorcentaje, setDescPorcentaje] = useState('')
  const [selectedTipoDescuento, setSelectedTipoDescuento] = useState('')

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: '',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          color="error"
          onClick={() => handleDeleteOpen(params.row)}
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
    { field: 'nombrePromo', headerName: 'Nombre Promo', width: 200 },
    { field: 'sucursal', headerName: 'Sucursal', width: 80 },
    { field: 'f1', headerName: 'Del', width: 100 },
    { field: 'f2', headerName: 'Al', width: 100 },
    { field: 'area', headerName: 'Area', width: 90 },
    { field: 'depto', headerName: 'Depto', width: 100 },
    { field: 'marca', headerName: 'Marca', width: 100 },
    { field: 'familia', headerName: 'Familia', width: 100 },
    { field: 'clave_prod', headerName: 'Producto', width: 220 },
    { field: 'cantidad', headerName: 'Cant', width: 60 },

 { 
      field: 'descuento', 
      headerName: 'Desc (%)', 
      width: 90,
      type: 'number',
      renderCell: (params) => {
          const valor = Number(params.row.descuento) || 0;
          return `${valor.toFixed(0)}%`;
      }
    }, 
    { field: 'idDescuento', headerName: 'Descuento', width: 100 },
  ]

  const fetchSucursales = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_cat_sucursales_sel')
      setSucursales(res.data)
    } catch (err) {
      console.error('Error al cargar sucursales:', err)
    }
  }

  const fetchAreas = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_cat_areas_sel?area=0')
      setAreas(res.data)
    } catch (err) {
      console.error('Error al cargar áreas:', err)
    }
  }

  const fetchDepartamentos = async (area: string) => {
    try {
      const res = await consumoApi.get(`/api/CatConfigPromoDescPorcen/sp_bw_cat_deptos_sel?area=${area}`)
      setDepartamentos(res.data)
    } catch (err) {
      console.error('Error al cargar departamentos:', err)
    }
  }

  const fetchMarcas = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_cat_marcas_sel?id=0')
      setMarcas(res.data)
    } catch (err) {
      console.error('Error al cargar marcas:', err)
    }
  }

  const fetchFamilias = async (id_marca: number) => {
    try {
      const res = await consumoApi.get(`/api/CatConfigPromoDescPorcen/sp_bw_cat_marcaFam1_sel?id_marca=${id_marca}`)
      setFamilias(res.data)
    } catch (err) {
      console.error('Error al cargar familias:', err)
    }
  }

  const fetchProductos = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_cat_productos_servicios_sel')
      setProductos(res.data)
    } catch (err) {
      console.error('Error al cargar productos:', err)
    }
  }

  const fetchTiposDescuento = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_cat_tipos_descuento_sel')
      setTiposDescuento(res.data)
    } catch (err) {
      console.error('Error al cargar tipos de descuento:', err)
    }
  }

const fetchPromociones = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_t_promocionesDescuentos_sel')
      const data = res.data.map((item: any, index: number) => ({ 
        ...item, 
        id: item.id ?? index,
        // MAGIA: Leemos con mayúscula y minúscula para blindar el dato
        descuento: Number(item.descuento ?? item.Descuento ?? 0) * 100
      }))
      setRows(data)
    } catch (err) {
      console.error('Error al cargar promociones:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchSucursales()
      await fetchAreas()
      await fetchMarcas()
      await fetchProductos()
      await fetchTiposDescuento()
      await fetchPromociones()
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedArea) {
      fetchDepartamentos(selectedArea)
      setSelectedDepto('')
    } else {
      setDepartamentos([])
      setSelectedDepto('')
    }
  }, [selectedArea])

useEffect(() => {
    if (selectedMarca) {
      // Como selectedMarca ya es el ID, lo pasamos directo a la función
      fetchFamilias(Number(selectedMarca))
      setSelectedFamilia('')
    } else {
      setFamilias([])
      setSelectedFamilia('')
    }
  }, [selectedMarca])

const handleAdd = async () => {
    if (!nombrePromo || !selectedSucursal || !fechaDel || !fechaAl || !selectedArea || !selectedDepto || !selectedMarca || !selectedFamilia || !selectedProducto || !cantidad || !descPorcentaje || !selectedTipoDescuento) return

    try {
      setSaving(true)

      // Encontrar el ID del tipo de descuento seleccionado
      const tipoDescuento = tiposDescuento.find(t => t.descripcion === selectedTipoDescuento)
      if (!tipoDescuento) {
        throw new Error('Tipo de descuento no válido')
      }

      // 👇 MAGIA: Convertimos los '0' (TODOS/TODAS) en '%' justo antes de enviarlos a la API
      const response = await consumoApi.post(
        `/api/CatConfigPromoDescPorcen/sp_bw_t_promocionesDescuentos_add`,
        '',
        {
          params: {
            nombrePromo: nombrePromo,
            sucursal: selectedSucursal === '0' ? '%' : selectedSucursal,
            f1: fechaDel,
            f2: fechaAl,
            area: selectedArea === '0' ? '%' : selectedArea,
            depto: selectedDepto === '0' ? '%' : selectedDepto,
            marca: selectedMarca === '0' ? '%' : selectedMarca,
            familia: selectedFamilia === '0' ? '%' : selectedFamilia,
            clave_prod: selectedProducto === '0' ? '%' : selectedProducto,
            cantidad: parseInt(cantidad),
            descuento: parseFloat(descPorcentaje) / 100,
            idDescuento: tipoDescuento.tipo_descuento,
          },
        }
      )

      const result = response.data?.[0]

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar')
      }

      await fetchPromociones()
      
      setNombrePromo('')
      setSelectedSucursal('')
      setFechaDel('')
      setFechaAl('')
      setSelectedArea('')
      setSelectedDepto('')
      setSelectedMarca('')
      setSelectedFamilia('')
      setSelectedProducto('')
      setCantidad('')
      setDescPorcentaje('')
      setSelectedTipoDescuento('')
      setDepartamentos([])
      setFamilias([])

      Swal.fire({
        title: '¡Éxito!',
        text: 'La promoción ha sido agregada correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOpen = async (row: Promocion) => {
    const result = await Swal.fire({
      title: '¿Eliminar Promoción?',
      text: `¿Está seguro de que desea eliminar la promoción "${row.nombrePromo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      await handleDeleteConfirm(row)
    }
  }

  const handleDeleteConfirm = async (row: Promocion) => {
    try {
      setDeleting(true)

      const response = await consumoApi.delete(
        `/api/CatConfigPromoDescPorcen/sp_bw_t_promocionesDescuentos_del`,
        {
          params: {
            id: row.id,
          },
        }
      )

      const result = response.data?.[0]

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al eliminar')
      }

      await fetchPromociones()
      
      Swal.fire({
        title: '¡Eliminado!',
        text: 'La promoción ha sido eliminada correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Error al eliminar', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleBack = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
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

        {/* CONTENEDOR BLANCO SUPERIOR (ENCABEZADO + FORMULARIO) */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', mb: 3 }}>
          
          {/* RECUADRO INTERIOR ELEGANTE */}
          <Box sx={{ border: '1px solid #000000ff', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem', textTransform: 'uppercase' }}>
                      CONFIGURACIÓN DE PROMOCIONES CON DESCUENTO PORCENTUAL
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

          {/* FORMULARIO DE AGREGAR DIRECTO EN EL CONTENEDOR PRINCIPAL */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mt: 1 }}> <TextField
              label="Nombre Promo"
              value={nombrePromo}
              onChange={(e) => setNombrePromo(e.target.value)}
              sx={{ minWidth: 100, bgcolor: 'white' }}
              size="small"
            />

            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Sucursal</InputLabel>
              <Select
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value)}
                label="Sucursal"
                sx={{ bgcolor: 'white' }}
              >
                {sucursales.map((sucursal) => (
                  <MenuItem key={sucursal.cve_sucursal} value={String(sucursal.cve_sucursal)}>
                    {sucursal.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Del"
              type="date"
              value={fechaDel}
              onChange={(e) => setFechaDel(e.target.value)}
              sx={{ minWidth: 130, bgcolor: 'white' }}
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Al"
              type="date"
              value={fechaAl}
              onChange={(e) => setFechaAl(e.target.value)}
              sx={{ minWidth: 130, bgcolor: 'white' }}
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Área</InputLabel>
              <Select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                label="Área"
                sx={{ bgcolor: 'white' }}
              >
                {areas.map((area) => (
                  <MenuItem key={area.id} value={area.id}>
                    {area.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Depto</InputLabel>
              <Select
                value={selectedDepto}
                onChange={(e) => setSelectedDepto(e.target.value)}
                label="Depto"
                disabled={!selectedArea}
                sx={{ bgcolor: 'white' }}
              >
                {departamentos.map((depto) => (
                  <MenuItem key={depto.id} value={depto.id}>
                    {depto.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

           <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Marca</InputLabel>
              <Select
                value={selectedMarca}
                onChange={(e) => setSelectedMarca(e.target.value)}
                label="Marca"
                sx={{ bgcolor: 'white' }}
              >
                {marcas.map((marca) => (
                  // MAGIA: value ahora es el ID, pero mostramos la marca
                  <MenuItem key={marca.id} value={String(marca.id)}>
                    {marca.marca}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Familia</InputLabel>
              <Select
                value={selectedFamilia}
                onChange={(e) => setSelectedFamilia(e.target.value)}
                label="Familia"
                disabled={!selectedMarca}
                sx={{ bgcolor: 'white' }}
              >
                {familias.map((familia) => (
                  // MAGIA: value ahora es la clave
                  <MenuItem key={familia.clave} value={String(familia.clave)}>
                    {familia.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Producto</InputLabel>
              <Select
                value={selectedProducto}
                onChange={(e) => setSelectedProducto(e.target.value)}
                label="Producto"
                sx={{ bgcolor: 'white' }}
              >
                {productos.map((producto) => (
                  // MAGIA: value ahora es la clave del producto
                  <MenuItem key={producto.clave_prod} value={producto.clave_prod}>
                    {producto.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Cant"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              sx={{ minWidth: 80, bgcolor: 'white' }}
              size="small"
              inputProps={{ min: "1" }}
            />

            <TextField
              label="Desc (Ej. 10 = 10%)"
              type="number"
              value={descPorcentaje}
              onChange={(e) => setDescPorcentaje(e.target.value)}
              sx={{ width: 160, bgcolor: 'white' }}
              size="small"
              // step a "1" para enteros, máximo 100
              inputProps={{ step: "1", min: "0", max: "100" }} 
            />

            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Tipo Descuento</InputLabel>
              <Select
                value={selectedTipoDescuento}
                onChange={(e) => setSelectedTipoDescuento(e.target.value)}
                label="Tipo Descuento"
                sx={{ bgcolor: 'white' }}
              >
                {tiposDescuento.map((tipo) => (
                  <MenuItem key={tipo.tipo_descuento} value={tipo.descripcion}>
                    {tipo.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!nombrePromo || !selectedSucursal || !fechaDel || !fechaAl || !selectedArea || !selectedDepto || !selectedMarca || !selectedFamilia || !selectedProducto || !cantidad || !descPorcentaje || !selectedTipoDescuento || saving}
              sx={{ 
                height: 40,
                bgcolor: '#333333',
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.2)',
                '&:hover': { bgcolor: '#555555' }
              }}
            >
              {saving ? 'Guardando...' : '+ AGREGAR'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}

        {/* CONTENEDOR BLANCO SOLO PARA LA TABLA */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>

          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 50 },
              },
            }}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              height: 600,
              fontSize: '0.95rem',
              '& .MuiDataGrid-columnHeaders': { 
                borderBottom: '2px solid #000', 
                fontSize: '1rem',
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          </Box>
        </Box>
      </Box>

      <PWABadge />
    </>
  )
}
