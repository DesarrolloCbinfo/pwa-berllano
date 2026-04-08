import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, CircularProgress, Alert, Typography, Paper, Grid } from '@mui/material';
import useConsumoApi from "../../../hooks/useConsumoApi";
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
import Swal from 'sweetalert2';

import PWABadge from '../../../PWABadge';

interface CatMarcas {
  id: number;
  marca: string;
}

export default function CatMarcas() {
  const { consumoApi } = useConsumoApi();
  const [rows, setRows] = useState<CatMarcas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar marcas
  const [openAdd, setOpenAdd] = useState(false);
  const [marca, setMarca] = useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar marcas
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editMarca, setEditMarca] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Estado para eliminar marcas (solo para el loading)
  const [deleting, setDeleting] = useState(false);

  // Props comunes para campos de formulario estilo Berllano Elegante
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

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton 
            onClick={() => handleEditOpen(params.row)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(51, 51, 51, 0.04)',
                color: '#333'
              }
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color='error'
            onClick={() => handleDeleteOpen(params.row)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.04)',
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
    { field: 'id', headerName: 'ID', width: 80, type: 'number' },
    { field: 'marca', headerName: 'Marca', width: 200, type: 'string' },
  ];

  const handleEditOpen = (row: CatMarcas) => {
    setEditId(row.id);
    setEditMarca(row.marca);
    setOpenEdit(true);
  };

  const handleDeleteOpen = async (row: CatMarcas) => {
    const result = await Swal.fire({
      title: '¿Eliminar Marca?',
      text: `¿Seguro que desea eliminar la marca "${row.marca}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000000ff',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;

    try {
      setDeleting(true);

      const response = await consumoApi.delete(
        `/api/CatMarcas/sp_bw_cat_marcas_del`,
        {
          params: {
            id: row.id,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje || 'Error al eliminar');
      }

      await Swal.fire({
        title: '¡Éxito!',
        text: 'Marca eliminada correctamente',
        icon: 'success',
        confirmButtonColor: '#000000ff'
      });

      fetchMarcas(); // 🔄 refresca grid
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#000000ff'
      });
    } finally {
      setDeleting(false);
    }
  };

  const fetchMarcas = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatMarcas/sp_bw_cat_marcas_sel?id=0',
      );
      setRows(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  const handleAdd = async () => {
    if (!marca) return;

    try {
      setSaving(true);

      const response = await consumoApi.post(
        `/api/CatMarcas/sp_bw_cat_marcas_add`,
        null,
        {
          params: {
            marca,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar');
      }

      setOpenAdd(false);
      setMarca('');
      fetchMarcas(); // 🔁 refresca grid
      
      await Swal.fire({
        title: '¡Éxito!',
        text: 'Marca agregada correctamente',
        icon: 'success',
        confirmButtonColor: '#000000ff'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#000000ff'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editMarca) return;

    try {
      setSavingEdit(true);

      const response = await consumoApi.put(
        `/api/CatMarcas/sp_bw_cat_marcas_upd`,
        null,
        {
          params: {
            id: editId,
            marca: editMarca,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al actualizar');
      }

      setOpenEdit(false);
      setEditId(null);
      fetchMarcas(); // 🔄 refrescar grid
      
      await Swal.fire({
        title: '¡Éxito!',
        text: 'Marca actualizada correctamente',
        icon: 'success',
        confirmButtonColor: '#000000ff'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#000000ff'
      });
    } finally {
      setSavingEdit(false);
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
      <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
        
        <style>{`
          .swal2-container {
            z-index: 9999 !important;
          }
        `}</style>

        <Paper sx={{ p: 3 }}>
          {/* Encabezado estilo Berllano Elegante */}
          <Box sx={{ 
            border: '1px solid #2c3e50', 
            borderRadius: '6px', 
            backgroundColor: '#fff', 
            p: 1.5, 
            mb: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontWeight: 'bold', 
                  color: '#1a365d',
                  fontSize: '1.1rem',
                  mb: 0.5
                }}
              >
                Catálogo de Marcas
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#333', 
                fontSize: '0.9rem' 
              }}
            >
              {new Date().toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })}
            </Typography>
          </Box>

         <Grid container spacing={2} justifyContent="flex-start" alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <Button 
                variant="contained" 
                onClick={() => setOpenAdd(true)}
                fullWidth
                sx={{ 
                  height: '40px', 
                  backgroundColor: '#333333', 
                  color: 'white', 
                  fontWeight: 'bold', 
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
                + AGREGAR MARCA
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* TABLA PRINCIPAL */}
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ 
            p: 3, 
            width: '100%', 
            maxHeight: 600, 
            mb: 3, 
            borderRadius: '8px', 
            boxShadow: '0 4px 8px rgba(0,0,0,0.08)' 
          }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              pageSizeOptions={[5, 10, 25]}
              density="compact"
              disableRowSelectionOnClick
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                  },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: '2px solid #000',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e0e0e000'
                }
              }}
            />
          </Paper>
        </Box>

        <Dialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          maxWidth='sm'
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
            background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', 
            color: 'white',
            py: 2.5,
            px: 3,
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Typography variant='h6' sx={{ fontWeight: 600, fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Agregar Nueva Marca
            </Typography>
            <Typography variant='body2' sx={{ color: '#e0e0e0', mt: 0.5 }}>
              Complete la información de la marca
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 3, bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label='Marca *'
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                {...commonProps}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setOpenAdd(false)}
              sx={{ 
                backgroundColor: '#e0e0e0', 
                color: '#000', 
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#d0d0d0' 
                }
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant='contained' 
              onClick={handleAdd} 
              disabled={saving}
              sx={{ 
                backgroundColor: '#333333',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#555555',
                  boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          maxWidth='sm'
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
            background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', 
            color: 'white',
            py: 2.5,
            px: 3,
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Typography variant='h6' sx={{ fontWeight: 600, fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Editar Marca: {editId}
            </Typography>
            <Typography variant='body2' sx={{ color: '#e0e0e0', mt: 0.5 }}>
              Modifique la información de la marca
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 3, bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField 
                label='ID' 
                value={editId || ''} 
                disabled 
                {...commonProps}
              />
              <TextField
                label='Marca *'
                value={editMarca}
                onChange={(e) => setEditMarca(e.target.value)}
                {...commonProps}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setOpenEdit(false)}
              sx={{ 
                backgroundColor: '#e0e0e0', 
                color: '#000', 
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#d0d0d0' 
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              variant='contained'
              onClick={handleUpdate}
              disabled={savingEdit}
              sx={{ 
                backgroundColor: '#333333',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#555555',
                  boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Actualizar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <PWABadge />
    </>
  );
}
