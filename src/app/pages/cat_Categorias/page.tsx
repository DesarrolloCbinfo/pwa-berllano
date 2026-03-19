"use client";

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, IconButton, TextField, Grid,
  Snackbar, Alert, Paper, Dialog, Divider
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';

import useConsumoApi from '../../../hooks/useConsumoApi';

// --- INTERFACES ---
interface CategoriaRow {
  id_gasto: number;
  descripcion: string;
  subcategorias?: SubcategoriaRow[];
}

interface SubcategoriaRow {
  id_gasto: number;
  id_subgasto: number;
  descripcion: string;
  subsubcategorias?: SubsubcategoriaRow[];
}

interface SubsubcategoriaRow {
  id_gasto: number;
  id_subgasto: number;
  id_subsubgasto: number;
  descripcion: string;
}

interface CategoriaForm {
  id_gasto?: number;
  descripcion: string;
}

interface SubcategoriaForm {
  id_subgasto?: number;
  id_gasto: number;
  descripcion: string;
}

interface SubsubcategoriaForm {
  id_subsubgasto?: number;
  id_gasto: number;
  id_subgasto: number;
  descripcion: string;
}

// --- ESTILOS COMUNES ---
const commonProps = {
  fullWidth: true,
  size: "small" as const,
  variant: "outlined" as const,
  sx: {
    '& .MuiInputBase-root': {
      height: '45px',
      borderRadius: '8px',
    }
  }
};

const modalSectionStyle = {
  p: 3,
  bgcolor: 'white',
  borderRadius: '12px',
  border: '1px solid #e0e0e0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
};

const initialCategoriaState: CategoriaForm = {
  id_gasto: 0,
  descripcion: ''
};

// --- COMPONENTE PRINCIPAL ---
export default function CatCategorias() {
  const consumoApi = useConsumoApi();
  
  // --- ESTADOS PRINCIPALES ---
  const [rows, setRows] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [claveSeleccionada, setClaveSeleccionada] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // --- ESTADOS DEL FORMULARIO ---
  const [categoriaForm, setCategoriaForm] = useState<CategoriaForm>(initialCategoriaState);
  const [subcategoriaForm, setSubcategoriaForm] = useState<SubcategoriaForm>({
    id_gasto: 0,
    descripcion: ''
  });
  const [subsubcategoriaForm, setSubsubcategoriaForm] = useState<SubsubcategoriaForm>({
    id_gasto: 0,
    id_subgasto: 0,
    descripcion: ''
  });
  
  // --- ESTADOS DE MODALES ---
  const [openSubcategoriaModal, setOpenSubcategoriaModal] = useState(false);
  const [openSubsubcategoriaModal, setOpenSubsubcategoriaModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaRow | null>(null);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<SubcategoriaRow | null>(null);
  const [subcategorias, setSubcategorias] = useState<SubcategoriaRow[]>([]);
  const [subsubcategorias, setSubsubcategorias] = useState<SubsubcategoriaRow[]>([]);
  
  // --- CARGAR DATOS ---
  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.get('/api/CatCategorias/sp_bw_cat_categorias_sel');
      setRows(res.data || []);
    } catch (error) {
      setMessage({ text: "Error al cargar categorías", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategorias = async (id_gasto: number) => {
    try {
      const res = await consumoApi.consumoApi.get('/api/CatCategorias/sp_bw_cat_subcategorias_sel', {
        params: { id_gasto }
      });
      setSubcategorias(res.data || []);
    } catch (error) {
      setMessage({ text: "Error al cargar subcategorías", type: 'error' });
    }
  };

  const fetchSubsubcategorias = async (id_gasto: number, id_subgasto: number) => {
    try {
      const res = await consumoApi.consumoApi.get('/api/CatCategorias/sp_bw_cat_subsubcategorias_sel', {
        params: { id_gasto, id_subgasto }
      });
      setSubsubcategorias(res.data || []);
    } catch (error) {
      setMessage({ text: "Error al cargar sub-subcategorías", type: 'error' });
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  // --- MANEJO DEL FORMULARIO ---
  const handleCategoriaChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setCategoriaForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOpenEdit = async (categoria: CategoriaRow) => {
    setClaveSeleccionada(categoria.id_gasto);
    setCategoriaForm({
      id_gasto: categoria.id_gasto,
      descripcion: categoria.descripcion
    });
    setOpenModal(true);
  };

  const handleOpenNew = () => {
    setClaveSeleccionada(null);
    setCategoriaForm(initialCategoriaState);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setClaveSeleccionada(null);
    setCategoriaForm(initialCategoriaState);
  };

  const handleOpenSubcategorias = async (categoria: CategoriaRow) => {
    setCategoriaSeleccionada(categoria);
    setSubcategoriaForm({
      id_gasto: categoria.id_gasto,
      descripcion: ''
    });
    await fetchSubcategorias(categoria.id_gasto);
    setOpenSubcategoriaModal(true);
  };

  const handleCloseSubcategoriaModal = () => {
    setOpenSubcategoriaModal(false);
    setCategoriaSeleccionada(null);
    setSubcategoriaForm({
      id_gasto: 0,
      descripcion: ''
    });
    setSubcategorias([]);
  };

  const handleSubcategoriaChange = (e: any) => {
    const { name, value } = e.target;
    setSubcategoriaForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSubcategoria = async () => {
    if (!subcategoriaForm.descripcion.trim()) {
      setMessage({ text: "La descripción de la subcategoría es obligatoria", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.post('/api/CatCategorias/sp_bw_cat_subcategorias_add', null, {
        params: {
          id_gasto: subcategoriaForm.id_gasto,
          id_subgasto: subcategoriaForm.id_subgasto || Math.floor(Math.random() * 9000) + 1000,
          descripcion: subcategoriaForm.descripcion.trim()
        }
      });
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Subcategoría registrada exitosamente", 
            type: 'success' 
          });
          setSubcategoriaForm({
            ...subcategoriaForm,
            descripcion: ''
          });
          if (categoriaSeleccionada) {
            fetchSubcategorias(categoriaSeleccionada.id_gasto);
          }
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al registrar subcategoría", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al guardar subcategoría", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubcategoria = async (subcategoria: SubcategoriaRow) => {
    if (!window.confirm(`¿Seguro que desea eliminar la subcategoría "${subcategoria.descripcion}"?`)) {
      return;
    }

    try {
      const res = await consumoApi.consumoApi.delete('/api/CatCategorias/sp_bw_cat_subcategorias_del', {
        params: { id_subgasto: subcategoria.id_subgasto }
      });
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Subcategoría eliminada exitosamente", 
            type: 'success' 
          });
          if (categoriaSeleccionada) {
            fetchSubcategorias(categoriaSeleccionada.id_gasto);
          }
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al eliminar subcategoría", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al eliminar subcategoría", 
        type: 'error' 
      });
    }
  };

  // --- MANEJO DE SUB-SUBCATEGORÍAS ---
  const handleOpenSubsubcategorias = async (subcategoria: SubcategoriaRow) => {
    setSubcategoriaSeleccionada(subcategoria);
    setSubsubcategoriaForm({
      id_gasto: subcategoria.id_gasto,
      id_subgasto: subcategoria.id_subgasto,
      descripcion: ''
    });
    await fetchSubsubcategorias(subcategoria.id_gasto, subcategoria.id_subgasto);
    setOpenSubsubcategoriaModal(true);
  };

  const handleCloseSubsubcategoriaModal = () => {
    setOpenSubsubcategoriaModal(false);
    setSubcategoriaSeleccionada(null);
    setSubsubcategoriaForm({
      id_gasto: 0,
      id_subgasto: 0,
      descripcion: ''
    });
    setSubsubcategorias([]);
  };

  const handleSubsubcategoriaChange = (e: any) => {
    const { name, value } = e.target;
    setSubsubcategoriaForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSubsubcategoria = async () => {
    if (!subsubcategoriaForm.descripcion.trim()) {
      setMessage({ text: "La descripción de la sub-subcategoría es obligatoria", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.post('/api/CatCategorias/sp_bw_cat_subsubcategorias_add', null, {
        params: {
          id_gasto: subsubcategoriaForm.id_gasto,
          id_subgasto: subsubcategoriaForm.id_subgasto,
          id_subsubgasto: subsubcategoriaForm.id_subsubgasto || Math.floor(Math.random() * 9000) + 1000,
          descripcion: subsubcategoriaForm.descripcion.trim()
        }
      });
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Sub-subcategoría registrada exitosamente", 
            type: 'success' 
          });
          setSubsubcategoriaForm({
            ...subsubcategoriaForm,
            descripcion: ''
          });
          if (subcategoriaSeleccionada) {
            fetchSubsubcategorias(subcategoriaSeleccionada.id_gasto, subcategoriaSeleccionada.id_subgasto);
          }
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al registrar sub-subcategoría", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al guardar sub-subcategoría", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubsubcategoria = async (subsubcategoria: SubsubcategoriaRow) => {
    if (!window.confirm(`¿Seguro que desea eliminar la sub-subcategoría "${subsubcategoria.descripcion}"?`)) {
      return;
    }

    try {
      const res = await consumoApi.consumoApi.delete('/api/CatCategorias/sp_bw_cat_subsubcategorias_del', {
        params: { id_subsubgasto: subsubcategoria.id_subsubgasto }
      });
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Sub-subcategoría eliminada exitosamente", 
            type: 'success' 
          });
          if (subcategoriaSeleccionada) {
            fetchSubsubcategorias(subcategoriaSeleccionada.id_gasto, subcategoriaSeleccionada.id_subgasto);
          }
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al eliminar sub-subcategoría", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al eliminar sub-subcategoría", 
        type: 'error' 
      });
    }
  };

  const handleSave = async () => {
    // Validaciones básicas
    if (!categoriaForm.descripcion.trim()) {
      setMessage({ text: "La descripción es obligatoria", type: 'error' });
      return;
    }

    if (!claveSeleccionada && (!categoriaForm.id_gasto || categoriaForm.id_gasto <= 0)) {
      setMessage({ text: "El ID Gasto es obligatorio para nuevas categorías", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      if (claveSeleccionada) {
        // Actualizar categoría con PUT y query parameters
        const res = await consumoApi.consumoApi.put('/api/CatCategorias/sp_bw_cat_categorias_upd', null, {
          params: {
            id_gasto: claveSeleccionada,
            descripcion: categoriaForm.descripcion.trim()
          }
        });
        
        if (res.status === 200) {
          const response = res.data;
          if (response && response.length > 0 && response[0].codigo === 0) {
            setMessage({ 
              text: response[0].mensaje1 || "Categoría actualizada exitosamente", 
              type: 'success' 
            });
            handleCloseModal();
            fetchCategorias();
          } else {
            setMessage({ 
              text: response?.[0]?.mensaje1 || "Error al actualizar categoría", 
              type: 'error' 
            });
          }
        }
      } else {
        // Insertar nueva categoría con POST y query parameters
        const res = await consumoApi.consumoApi.post('/api/CatCategorias/sp_bw_cat_categorias_add', null, {
          params: {
            id_gasto: categoriaForm.id_gasto!, // Usar el ID proporcionado por el usuario
            descripcion: categoriaForm.descripcion.trim()
          }
        });
        
        if (res.status === 200) {
          const response = res.data;
          if (response && response.length > 0 && response[0].codigo === 0) {
            setMessage({ 
              text: response[0].mensaje1 || "Categoría registrada exitosamente", 
              type: 'success' 
            });
            handleCloseModal();
            fetchCategorias();
          } else {
            setMessage({ 
              text: response?.[0]?.mensaje1 || "Error al registrar categoría", 
              type: 'error' 
            });
          }
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al guardar categoría", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoria: CategoriaRow) => {
    if (!window.confirm(`¿Seguro que desea eliminar la categoría "${categoria.descripcion}"?`)) {
      return;
    }

    try {
      const res = await consumoApi.consumoApi.delete('/api/CatCategorias/sp_bw_cat_categorias_del', {
        params: { id_gasto: categoria.id_gasto }
      });
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Categoría eliminada exitosamente", 
            type: 'success' 
          });
          fetchCategorias();
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al eliminar categoría", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al eliminar categoría", 
        type: 'error' 
      });
    }
  };

  // --- COLUMNAS DEL DATAGRID ---
  const columns: GridColDef[] = [
    {
      field: 'id_gasto',
      headerName: 'ID Gasto',
      width: 120,
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'descripcion',
      headerName: 'Descripción',
      width: 400,
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 240,
      headerClassName: 'super-app-theme--header',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => handleOpenEdit(params.row)}
            sx={{ color: '#1976d2' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDelete(params.row)}
            sx={{ color: '#d32f2f' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleOpenSubcategorias(params.row)}
            sx={{ color: '#2e7d32' }}
            title="Ver Subcategorías"
          >
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleOpenSubsubcategorias(params.row)}
            sx={{ color: '#9c27b0' }}
            title="Ver Sub-subcategorías"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* --- HEADER --- */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        bgcolor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
          📁 Categorías de Gastos
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenNew}
          sx={{ 
            bgcolor: '#1976d2', 
            color: 'white',
            fontWeight: 'bold',
            px: 3,
            py: 1.5,
            borderRadius: '8px'
          }}
        >
          Nueva Categoría de Gasto
        </Button>
      </Box>

      {/* --- DATAGRID --- */}
      <Paper sx={{ 
        height: 600, 
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        '& .super-app-theme--header': {
          backgroundColor: '#1976d2',
          color: 'white',
          fontWeight: 'bold',
        }
      }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id_gasto}
          components={{
            Toolbar: GridToolbar,
          }}
          componentsProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          sx={{
            '& .MuiDataGrid-root': {
              border: 'none',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#1976d2',
              color: 'white',
              fontSize: '14px',
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: '#ffffff',
            },
            '& .MuiDataGrid-row': {
              '&:nth-of-type(odd)': {
                backgroundColor: '#f9f9f9',
              },
              '&:hover': {
                backgroundColor: '#e3f2fd',
              },
            },
          }}
        />
      </Paper>

      {/* --- MODAL DE FORMULARIO --- */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <Box sx={{ p: 4, bgcolor: '#fdfdfd' }}>
          {/* Header del Modal */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              {claveSeleccionada ? '✏️ Editar Categoría de Gasto' : '🆕 Nueva Categoría de Gasto'}
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3, borderBottomWidth: 2, borderColor: '#1976d2' }} />

          {/* Formulario */}
          <Box sx={modalSectionStyle}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  {...commonProps}
                  label="ID Gasto"
                  name="id_gasto"
                  value={categoriaForm.id_gasto || ''}
                  onChange={handleCategoriaChange}
                  placeholder="Ej. 1000, 2000, etc."
                  type="number"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  {...commonProps}
                  label="Descripción de la Categoría"
                  name="descripcion"
                  value={categoriaForm.descripcion}
                  onChange={handleCategoriaChange}
                  placeholder="Ej. Gastos operativos, Mantenimientos, etc."
                  multiline
                  rows={2}
                  required
                />
              </Grid>
            </Grid>
          </Box>

          {/* Botones de Acción */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 4,
            p: 2,
            bgcolor: '#f8f9fa',
            borderRadius: '8px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <Typography variant="caption" sx={{ color: '#666' }}>
              * El ID Gasto y la descripción son obligatorios
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                onClick={handleCloseModal} 
                variant="outlined"
                sx={{ 
                  borderColor: '#ccc',
                  color: '#666',
                  fontWeight: 'bold',
                  px: 3
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                variant="contained"
                disabled={loading}
                sx={{ 
                  bgcolor: '#1976d2',
                  color: 'white',
                  fontWeight: 'bold',
                  px: 4
                }}
              >
                {loading ? 'Guardando...' : (claveSeleccionada ? 'Actualizar' : 'Guardar')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>

      {/* --- MODAL DE SUBCATEGORÍAS --- */}
      <Dialog 
        open={openSubcategoriaModal} 
        onClose={handleCloseSubcategoriaModal} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <Box sx={{ p: 4, bgcolor: '#fdfdfd' }}>
          {/* Header del Modal */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              🗂️ Subcategorías de {categoriaSeleccionada?.descripcion}
            </Typography>
            <IconButton onClick={handleCloseSubcategoriaModal}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3, borderBottomWidth: 2, borderColor: '#2e7d32' }} />

          {/* Info de la categoría padre */}
          {categoriaSeleccionada && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Categoría Padre: {categoriaSeleccionada.descripcion} (ID: {categoriaSeleccionada.id_gasto})
              </Typography>
            </Box>
          )}

          {/* Formulario para agregar subcategoría */}
          <Box sx={modalSectionStyle}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 2 }}>
              Agregar Nueva Subcategoría
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  {...commonProps}
                  label="Descripción de la Subcategoría"
                  name="descripcion"
                  value={subcategoriaForm.descripcion}
                  onChange={handleSubcategoriaChange}
                  placeholder="Ej. Amenidades Clientes, Lavandería, etc."
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  onClick={handleSaveSubcategoria}
                  disabled={loading || !subcategoriaForm.descripcion.trim()}
                  sx={{ 
                    bgcolor: '#2e7d32', 
                    color: 'white',
                    fontWeight: 'bold',
                    px: 4
                  }}
                >
                  {loading ? 'Guardando...' : 'Agregar Subcategoría'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Lista de subcategorías existentes */}
          <Box sx={modalSectionStyle}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
              Subcategorías Existentes
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {subcategorias.length > 0 ? (
                subcategorias.map((sub) => (
                  <Box 
                    key={sub.id_subgasto} 
                    sx={{ 
                      p: 2, 
                      mb: 1, 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: '#f9f9f9'
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        {sub.descripcion}
                      </Typography>
                      <Typography variant="caption" color="#666">
                        ID Subgasto: {sub.id_subgasto}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#9c27b0' }}
                        onClick={() => handleOpenSubsubcategorias(sub)}
                        title="Ver Sub-subcategorías"
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#d32f2f' }}
                        onClick={() => handleDeleteSubcategoria(sub)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 3 }}>
                  No hay subcategorías registradas para esta categoría.
                </Typography>
              )}
            </Box>
          </Box>

          {/* Botones de Acción */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center',
            mt: 4,
            p: 2,
            bgcolor: '#f8f9fa',
            borderRadius: '8px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <Button 
              onClick={handleCloseSubcategoriaModal} 
              variant="contained"
              sx={{ 
                bgcolor: '#666',
                color: 'white',
                fontWeight: 'bold',
                px: 4
              }}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* --- MODAL DE SUB-SUBCATEGORÍAS --- */}
      <Dialog 
        open={openSubsubcategoriaModal} 
        onClose={handleCloseSubsubcategoriaModal} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <Box sx={{ p: 4, bgcolor: '#fdfdfd' }}>
          {/* Header del Modal */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              🗂️ Sub-subcategorías de {subcategoriaSeleccionada?.descripcion}
            </Typography>
            <IconButton onClick={handleCloseSubsubcategoriaModal}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3, borderBottomWidth: 2, borderColor: '#9c27b0' }} />

          {/* Info de la jerarquía */}
          {categoriaSeleccionada && subcategoriaSeleccionada && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f3e5f5', borderRadius: '8px', border: '1px solid #9c27b0' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Jerarquía completa:
              </Typography>
              <Typography variant="body2" color="#666">
                📁 {categoriaSeleccionada.descripcion} (ID: {categoriaSeleccionada.id_gasto})
              </Typography>
              <Typography variant="body2" color="#666">
                📂 {subcategoriaSeleccionada.descripcion} (ID: {subcategoriaSeleccionada.id_subgasto})
              </Typography>
            </Box>
          )}

          {/* Formulario para agregar sub-subcategoría */}
          <Box sx={modalSectionStyle}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9c27b0', mb: 2 }}>
              Agregar Nueva Sub-subcategoría
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  {...commonProps}
                  label="Descripción de la Sub-subcategoría"
                  name="descripcion"
                  value={subsubcategoriaForm.descripcion}
                  onChange={handleSubsubcategoriaChange}
                  placeholder="Ej. Mantenimiento de Aire Acondicionado, Limpieza Diaria, etc."
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  onClick={handleSaveSubsubcategoria}
                  disabled={loading || !subsubcategoriaForm.descripcion.trim()}
                  sx={{ 
                    bgcolor: '#9c27b0', 
                    color: 'white',
                    fontWeight: 'bold',
                    px: 4
                  }}
                >
                  {loading ? 'Guardando...' : 'Agregar Sub-subcategoría'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Lista de sub-subcategorías existentes */}
          <Box sx={modalSectionStyle}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
              Sub-subcategorías Existentes
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {subsubcategorias.length > 0 ? (
                subsubcategorias.map((subsub) => (
                  <Box 
                    key={subsub.id_subsubgasto} 
                    sx={{ 
                      p: 2, 
                      mb: 1, 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: '#f9f9f9'
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        {subsub.descripcion}
                      </Typography>
                      <Typography variant="caption" color="#666">
                        ID Sub-subgasto: {subsub.id_subsubgasto}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      sx={{ color: '#d32f2f' }}
                      onClick={() => handleDeleteSubsubcategoria(subsub)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 3 }}>
                  No hay sub-subcategorías registradas para esta subcategoría.
                </Typography>
              )}
            </Box>
          </Box>

          {/* Botones de Acción */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center',
            mt: 4,
            p: 2,
            bgcolor: '#f8f9fa',
            borderRadius: '8px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <Button 
              onClick={handleCloseSubsubcategoriaModal} 
              variant="contained"
              sx={{ 
                bgcolor: '#666',
                color: 'white',
                fontWeight: 'bold',
                px: 4
              }}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* --- SNACKBAR --- */}
      <Snackbar 
        open={!!message} 
        autoHideDuration={4000} 
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={message?.type} 
          onClose={() => setMessage(null)} 
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}
