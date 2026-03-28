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
import { useSessionContext } from '../../../context/SessionProvider'; // <--- AGREGAR ESTA LÍNEA

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
  cuenta_contable?: string;
  segmentable?: boolean;
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
  cuenta_contable?: string;
  segmentable?: boolean;
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
  const { session } = useSessionContext(); // <--- AGREGAR ESTA LÍNEA
  
  // --- ESTADOS PRINCIPALES ---
  const [rows, setRows] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- ESTADOS DE MODALES ---
  const [openModal, setOpenModal] = useState(false);
  const [openSubcategoriaFormModal, setOpenSubcategoriaFormModal] = useState(false);
  const [openSubsubcategoriaFormModal, setOpenSubsubcategoriaFormModal] = useState(false);
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
    descripcion: '',
    cuenta_contable: '',
    segmentable: false
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

  const handleEditSubcategoria = async (subcategoria: SubcategoriaRow) => {
    setSubcategoriaForm({
      id_gasto: subcategoria.id_gasto,
      id_subgasto: subcategoria.id_subgasto,
      descripcion: subcategoria.descripcion
    });
    setOpenSubcategoriaFormModal(true);
  };

  const handleUpdateSubcategoria = async () => {
    if (!subcategoriaForm.descripcion.trim()) {
      setMessage({ text: "La descripción de la subcategoría es obligatoria", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.put('/api/CatCategorias/sp_bw_cat_subcategorias_upd', null, {
        params: {
          id_gasto: subcategoriaForm.id_gasto,
          id_subgasto: subcategoriaForm.id_subgasto,
          descripcion: subcategoriaForm.descripcion.trim()
        }
      });
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Subcategoría actualizada exitosamente", 
            type: 'success' 
          });
          setSubcategoriaForm({
            ...subcategoriaForm,
            descripcion: ''
          });
          if (categoriaSeleccionada) {
            fetchSubcategorias(categoriaSeleccionada.id_gasto);
          }
          setOpenSubcategoriaFormModal(false); // ✅ Cerrar modal después de actualizar
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al actualizar subcategoría", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al actualizar subcategoría", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubcategoria = async () => {
    if (!subcategoriaForm.descripcion.trim() || !subcategoriaForm.id_subgasto) {
      setMessage({ text: "El ID y la descripción de la subcategoría son obligatorios", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.post('/api/CatCategorias/sp_bw_cat_subcategorias_add', null, {
        params: {
          id_gasto: subcategoriaForm.id_gasto,
          id_subgasto: subcategoriaForm.id_subgasto,
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
          setOpenSubcategoriaFormModal(false); // ✅ Cerrar modal después de guardar
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
        params: { 
          id_gasto: subcategoria.id_gasto,
          id_subgasto: subcategoria.id_subgasto 
        }
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
      descripcion: '',
      cuenta_contable: '',
      segmentable: false
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
      descripcion: '',
      cuenta_contable: '',
      segmentable: false
    });
    setSubsubcategorias([]);
  };

  const handleSubsubcategoriaChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setSubsubcategoriaForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditSubsubcategoria = async (subsubcategoria: SubsubcategoriaRow) => {
    setSubsubcategoriaForm({
      id_gasto: subsubcategoria.id_gasto,
      id_subgasto: subsubcategoria.id_subgasto,
      id_subsubgasto: subsubcategoria.id_subsubgasto,
      descripcion: subsubcategoria.descripcion,
      cuenta_contable: subsubcategoria.cuenta_contable || '',
      segmentable: subsubcategoria.segmentable || false
    });
    setOpenSubsubcategoriaFormModal(true);
  };

  const handleUpdateSubsubcategoria = async () => {
    if (!subsubcategoriaForm.descripcion.trim()) {
      setMessage({ text: "La descripción de la sub-subcategoría es obligatoria", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.put('/api/CatCategorias/sp_bw_cat_subsubcategorias_upd', null, {
        params: {
          id_gasto: subsubcategoriaForm.id_gasto,
          id_subgasto: subsubcategoriaForm.id_subgasto,
          id_subsubgasto: subsubcategoriaForm.id_subsubgasto,
          descripcion: subsubcategoriaForm.descripcion.trim(),
          cuenta_contable: subsubcategoriaForm.cuenta_contable || '',
          segmentable: subsubcategoriaForm.segmentable || false
        }
      });
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Sub-subcategoría actualizada exitosamente", 
            type: 'success' 
          });
          setSubsubcategoriaForm({
            ...subsubcategoriaForm,
            descripcion: '',
            cuenta_contable: '',
            segmentable: false
          });
          if (subcategoriaSeleccionada) {
            fetchSubsubcategorias(subcategoriaSeleccionada.id_gasto, subcategoriaSeleccionada.id_subgasto);
          }
          setOpenSubsubcategoriaFormModal(false); // ✅ Cerrar modal después de actualizar
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al actualizar sub-subcategoría", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al actualizar sub-subcategoría", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubsubcategoria = async () => {
    if (!subsubcategoriaForm.descripcion.trim() || !subsubcategoriaForm.id_subsubgasto) {
      setMessage({ text: "El ID y la descripción de la sub-subcategoría son obligatorios", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.post('/api/CatCategorias/sp_bw_cat_subsubcategorias_add', null, {
        params: {
          id_gasto: subsubcategoriaForm.id_gasto,
          id_subgasto: subsubcategoriaForm.id_subgasto,
          id_subsubgasto: subsubcategoriaForm.id_subsubgasto,
          descripcion: subsubcategoriaForm.descripcion.trim(),
          cuenta_contable: subsubcategoriaForm.cuenta_contable || '',
          segmentable: subsubcategoriaForm.segmentable || false
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
            descripcion: '',
            cuenta_contable: '',
            segmentable: false
          });
          if (subcategoriaSeleccionada) {
            fetchSubsubcategorias(subcategoriaSeleccionada.id_gasto, subcategoriaSeleccionada.id_subgasto);
          }
          setOpenSubsubcategoriaFormModal(false); // ✅ Cerrar modal después de guardar
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
        params: { 
          id_gasto: subsubcategoria.id_gasto,
          id_subgasto: subsubcategoria.id_subgasto,
          id_subsubgasto: subsubcategoria.id_subsubgasto
        }
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
            sx={{ color: '#505050ff' }}
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
            sx={{ color: '#555555ff' }}
            title="Ver Subcategorías"
          >
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleOpenSubsubcategorias(params.row)}
            sx={{ color: '#555555ff' }}
            title="Ver Sub-subcategorías"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

// --- RENDER ---
  return (
    <Box sx={{ p: 3, bgcolor: '#ececec', minHeight: '100vh' }}>
      
      {/* MAGIA CSS: Forzamos a SweetAlert a saltar al frente de los modales */}
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>

      {/* PAPER 1: ENCABEZADO ESTILO BERLLANO */}
      <Paper sx={{ p: 3, borderRadius: '8px', mb: 3 }}>
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    CATÁLOGO DE CATEGORÍAS DE GASTOS
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
      </Paper>

      {/* --- TRES TABLAS EN LÍNEA --- */}
      <Grid container spacing={2}>
        {/* TABLA DE CATEGORÍAS */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            height: 600, 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '& .super-app-theme--header': {
              backgroundColor: '#797979ff',
              color: 'white',
              fontWeight: 'bold',
            }
          }}>
            <Box sx={{ p: 2, bgcolor: '#555555ff', color: 'white', borderRadius: '12px 12px 0 0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Categorías
              </Typography>
            </Box>
            <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenNew}
                sx={{ 
                  bgcolor: '#000000ff', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '6px',
                  width: '100%'
                }}
              >
                Agregar Categoría
              </Button>
            </Box>
            <DataGrid
              rows={rows}
              columns={[
                {
                  field: 'id_gasto',
                  headerName: 'ID',
                  width: 80,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'descripcion',
                  headerName: 'Descripción',
                  width: 200,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'acciones',
                  headerName: 'Acciones',
                  width: 80,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenEdit(params.row)}
                        sx={{ color: '#555555ff' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(params.row)}
                        sx={{ color: '#555555ff' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              loading={loading}
              getRowId={(row) => row.id_gasto}
              hideFooter
              onRowClick={(params) => handleOpenSubcategorias(params.row)}
              components={{
                Toolbar: () => null,
              }}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#1976d2',
                  color: 'white',
                  fontSize: '12px',
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
                  cursor: 'pointer',
                },
              }}
            />
          </Paper>
        </Grid>

        {/* TABLA DE SUBCATEGORÍAS */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            height: 600, 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '& .super-app-theme--header': {
              backgroundColor: '#797979ff',
              color: 'white',
              fontWeight: 'bold',
            }
          }}>
            <Box sx={{ p: 2, bgcolor: '#555555ff', color: 'white', borderRadius: '12px 12px 0 0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Subcategorías
              </Typography>
              {categoriaSeleccionada && (
                <Typography variant="caption">
                  De: {categoriaSeleccionada.descripcion}
                </Typography>
              )}
            </Box>
            <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<AddIcon />}
                disabled={!categoriaSeleccionada}
                onClick={() => {
                  if (categoriaSeleccionada) {
                    setSubcategoriaForm({
                      id_gasto: categoriaSeleccionada.id_gasto,
                      id_subgasto: undefined,
                      descripcion: ''
                    });
                    setOpenSubcategoriaFormModal(true);
                  }
                }}
                sx={{ 
                  bgcolor: '#000000ff', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '6px',
                  width: '100%'
                }}
              >
                Agregar Subcategoría
              </Button>
            </Box>
            <DataGrid
              rows={subcategorias}
              columns={[
                {
                  field: 'id_subgasto',
                  headerName: 'ID',
                  width: 80,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'descripcion',
                  headerName: 'Descripción',
                  width: 200,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'acciones',
                  headerName: 'Acciones',
                  width: 120,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#555555ff' }}
                        onClick={() => handleEditSubcategoria(params.row)}
                        title="Editar Subcategoría"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#555555ff' }}
                        onClick={() => handleDeleteSubcategoria(params.row)}
                        title="Eliminar Subcategoría"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              loading={loading}
              getRowId={(row) => row.id_subgasto}
              hideFooter
              onRowClick={(params) => handleOpenSubsubcategorias(params.row)}
              components={{
                Toolbar: () => null,
              }}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  fontSize: '12px',
                },
                '& .MuiDataGrid-virtualScroller': {
                  backgroundColor: '#ffffff',
                },
                '& .MuiDataGrid-row': {
                  '&:nth-of-type(odd)': {
                    backgroundColor: '#f9f9f9',
                  },
                  '&:hover': {
                    backgroundColor: '#e8f5e9',
                  },
                  cursor: 'pointer',
                },
              }}
            />
          </Paper>
        </Grid>

        {/* TABLA DE SUB-SUBCATEGORÍAS */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            height: 600, 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '& .super-app-theme--header': {
              backgroundColor: '#797979ff',
              color: 'white',
              fontWeight: 'bold',
            }
          }}>
            <Box sx={{ p: 2, bgcolor: '#555555ff', color: 'white', borderRadius: '12px 12px 0 0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Sub-subcategorías
              </Typography>
              {subcategoriaSeleccionada && (
                <Typography variant="caption">
                  De: {subcategoriaSeleccionada.descripcion}
                </Typography>
              )}
            </Box>
            <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<AddIcon />}
                disabled={!subcategoriaSeleccionada}
                onClick={() => {
                  if (subcategoriaSeleccionada) {
                    setSubsubcategoriaForm({
                      id_gasto: subcategoriaSeleccionada.id_gasto,
                      id_subgasto: subcategoriaSeleccionada.id_subgasto,
                      id_subsubgasto: undefined,
                      descripcion: '',
                      cuenta_contable: '',
                      segmentable: false
                    });
                    setOpenSubsubcategoriaFormModal(true);
                  }
                }}
                sx={{ 
                  bgcolor: '#000000ff', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '6px',
                  width: '100%'
                }}
              >
                Agregar Sub-subcategoría
              </Button>
            </Box>
            <DataGrid
              rows={subsubcategorias}
              columns={[
                {
                  field: 'id_subsubgasto',
                  headerName: 'ID',
                  width: 80,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'descripcion',
                  headerName: 'Descripción',
                  width: 180,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'cuenta_contable',
                  headerName: 'Cuenta Contable',
                  width: 120,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Typography variant="caption" sx={{ fontSize: '11px' }}>
                      {params.value || 'N/A'}
                    </Typography>
                  ),
                },
                {
                  field: 'segmentable',
                  headerName: 'Segmentable',
                  width: 80,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '10px',
                          px: 1,
                          py: 0.5,
                          borderRadius: '4px',
                          bgcolor: params.value ? '#e8f5e9' : '#ffebee',
                          color: params.value ? '#2e7d32' : '#c62828',
                          fontWeight: 'bold'
                        }}
                      >
                        {params.value ? 'Sí' : 'No'}
                      </Typography>
                    </Box>
                  ),
                },
                {
                  field: 'acciones',
                  headerName: 'Acciones',
                  width: 120,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#555555ff' }}
                        onClick={() => handleEditSubsubcategoria(params.row)}
                        title="Editar Sub-subcategoría"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#555555ff' }}
                        onClick={() => handleDeleteSubsubcategoria(params.row)}
                        title="Eliminar Sub-subcategoría"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              loading={loading}
              getRowId={(row) => row.id_subsubgasto}
              hideFooter
              components={{
                Toolbar: () => null,
              }}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#9c27b0',
                  color: 'white',
                  fontSize: '12px',
                },
                '& .MuiDataGrid-virtualScroller': {
                  backgroundColor: '#ffffff',
                },
                '& .MuiDataGrid-row': {
                  '&:nth-of-type(odd)': {
                    backgroundColor: '#f9f9f9',
                  },
                  '&:hover': {
                    backgroundColor: '#f3e5f5',
                  },
                  cursor: 'pointer',
                },
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* --- MODAL DE FORMULARIO DE CATEGORÍAS --- */}
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
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Dialog>

      {/* --- MODAL DE FORMULARIO DE SUBCATEGORÍAS --- */}
      <Dialog 
        open={openSubcategoriaFormModal} 
        onClose={() => setOpenSubcategoriaFormModal(false)} 
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
              {subcategoriaForm.id_subgasto ? '✏️ Editar Subcategoría' : '🆕 Nueva Subcategoría'}
            </Typography>
            <IconButton onClick={() => setOpenSubcategoriaFormModal(false)}>
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

          {/* Formulario */}
          <Box sx={modalSectionStyle}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  {...commonProps}
                  label="ID Subcategoría"
                  name="id_subgasto"
                  value={subcategoriaForm.id_subgasto || ''}
                  onChange={handleSubcategoriaChange}
                  placeholder="Ej. 1100, 1200, etc."
                  type="number"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button 
                    onClick={() => setOpenSubcategoriaFormModal(false)} 
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
                    onClick={subcategoriaForm.id_subgasto ? handleUpdateSubcategoria : handleSaveSubcategoria}
                    variant="contained"
                    disabled={loading || !subcategoriaForm.descripcion.trim()}
                    sx={{ 
                      bgcolor: '#2e7d32',
                      color: 'white',
                      fontWeight: 'bold',
                      px: 4
                    }}
                  >
                    {loading ? 'Guardando...' : (subcategoriaForm.id_subgasto ? 'Actualizar' : 'Guardar')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Dialog>

      {/* --- MODAL DE FORMULARIO DE SUB-SUBCATEGORÍAS --- */}
      <Dialog 
        open={openSubsubcategoriaFormModal} 
        onClose={() => setOpenSubsubcategoriaFormModal(false)} 
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
              {subsubcategoriaForm.id_subsubgasto ? '✏️ Editar Sub-subcategoría' : '🆕 Nueva Sub-subcategoría'}
            </Typography>
            <IconButton onClick={() => setOpenSubsubcategoriaFormModal(false)}>
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

          {/* Formulario */}
          <Box sx={modalSectionStyle}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  {...commonProps}
                  label="ID Sub-subcategoría"
                  name="id_subsubgasto"
                  value={subsubcategoriaForm.id_subsubgasto || ''}
                  onChange={handleSubsubcategoriaChange}
                  placeholder="Ej. 1110, 1120, etc."
                  type="number"
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
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
              <Grid item xs={12} md={4}>
                <TextField
                  {...commonProps}
                  label="Cuenta Contable"
                  name="cuenta_contable"
                  value={subsubcategoriaForm.cuenta_contable}
                  onChange={handleSubsubcategoriaChange}
                  placeholder="Ej. 5-51-51-05"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Segmentable:
                  </Typography>
                  <input
                    type="checkbox"
                    name="segmentable"
                    checked={subsubcategoriaForm.segmentable}
                    onChange={handleSubsubcategoriaChange}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <Typography variant="body2" color="#666">
                    {subsubcategoriaForm.segmentable ? 'Sí' : 'No'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button 
                    onClick={() => setOpenSubsubcategoriaFormModal(false)} 
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
                    onClick={subsubcategoriaForm.id_subsubgasto ? handleUpdateSubsubcategoria : handleSaveSubsubcategoria}
                    variant="contained"
                    disabled={loading || !subsubcategoriaForm.descripcion.trim()}
                    sx={{ 
                      bgcolor: '#9c27b0',
                      color: 'white',
                      fontWeight: 'bold',
                      px: 4
                    }}
                  >
                    {loading ? 'Guardando...' : (subsubcategoriaForm.id_subsubgasto ? 'Actualizar' : 'Guardar')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
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

      {/* PIE DE PÁGINA ESTILO ACCESS */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          CAT_CATEGORIAS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR: {session?.nombre || 'ADMIN'}
        </Typography>
      </Box>

    </Box>
  );
}
