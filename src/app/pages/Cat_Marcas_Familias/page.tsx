import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  TextField,
  Button,
  LinearProgress,
  Snackbar,
  Alert,
  Grid
} from '@mui/material';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { useSessionContext } from '../../../context/SessionProvider'; 
import AddIcon from '@mui/icons-material/Add';

// --- ESTILOS BERLLANO ELEGANTE (TONALIDADES NEUTRAS) ---
// 1. Estilo General (Altura fija de 50px con detalles elegantes)
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

// 2. Estilo SOLO para Selects (Hereda el general pero agrega ancho mínimo)
const selectProps = {
  ...commonProps,
  sx: {
      ...commonProps.sx,
      minWidth: '220px', // <--- ESTO FUERZA QUE SIEMPRE SEAN LARGOS
  }
};

// --- INTERFACES (Ajustadas a tu SP real) ---
interface MarcaItem {
  id: number;      // SQL devuelve 'id'
  marca: string;   // SQL devuelve 'marca'
}

interface FamiliaRow {
  id_familia: number; // SQL devuelve 'id_familia'
  id_marca: number;   // SQL devuelve 'id_marca'
  familia: string;    // SQL devuelve 'familia'
}

const Cat_MarcasFamilias: React.FC = () => {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  // --- ESTADOS ---
  const [marcas, setMarcas] = useState<MarcaItem[]>([]);
  const [rows, setRows] = useState<FamiliaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estado para mensajes de confirmación (Feedback visual)
  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  // --- CARGA INICIAL ---
  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Cargar Catálogo de Marcas (Dropdown)
      // Nota: Ruta actualizada a tu Controller nuevo
      const resMarcas = await consumoApi.get('/api/CatMarcasFamilias/sp_bw_cat_marcasfamilias_list');
      setMarcas(resMarcas.data);

      // 2. Cargar Filas de la Tabla
      // Nota: Ruta actualizada a tu Controller nuevo
      const resFamilias = await consumoApi.get('/api/CatMarcasFamilias/sp_bw_cat_marcasfamilias_sel');
      setRows(resFamilias.data);

    } catch (error) {
      console.error("Error cargando datos", error);
      setMensaje({ texto: "Error de conexión al cargar", tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE GUARDADO (AUTO-SAVE) ---
  const guardarCambioEnBD = async (row: FamiliaRow) => {
    try {
        await consumoApi.put('/api/CatMarcasFamilias/sp_bw_cat_marcasfamilias_upd', null, { 
            params: { 
                id_familia: row.id_familia,
                id_marca: row.id_marca,
                familia: row.familia 
            }
        });
        // Mensaje discreto
        setMensaje({ texto: 'Guardado correctamente', tipo: 'success' });
    } catch (error) {
        console.error(error);
        setMensaje({ texto: 'Error al guardar el cambio', tipo: 'error' });
    }
  };

  // --- MANEJO DE EDICIÓN EN GRILLA ---
  
  // 1. Actualización visual inmediata
  const handleRowChange = (index: number, field: keyof FamiliaRow, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);

    // CASO ESPECIAL: Si cambiaron el Combo (Marca), guardamos YA.
    if (field === 'id_marca') {
        guardarCambioEnBD(newRows[index]);
    }
  };

  // 2. Evento al salir de la caja de texto (onBlur)
  const handleBlur = (index: number) => {
    // Aquí guardamos el texto que escribió el usuario
    guardarCambioEnBD(rows[index]);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      <Paper sx={{ p: 3, borderRadius: '8px' }}>
        {/* ENCABEZADO */}
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Catálogo de Marcas y Familias
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
                    Usuario: {session?.nombre || 'Cargando...'}
                </Typography>
            </Box>
        </Box>

        <Grid container spacing={2} justifyContent="flex-start" alignItems="center" sx={{ mb: 0.5 }}>
            <Grid item xs={12} md={2}>
              <Button variant="contained" disabled={saving} fullWidth startIcon={<AddIcon />}
                sx={{ 
                    height: '50px', backgroundColor: '#333333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease',
                    '&:hover': { backgroundColor: '#555555', boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', transform: 'translateY(-1px)' }
                }}>
                AGREGAR
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

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Tabla estilo Access con Estilo Berllano Elegante */}
        <TableContainer sx={{ 
          mb: 3, 
          maxHeight: '60vh', 
          overflowY: 'auto'
        }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  borderBottom: '2px solid #000', 
                  textAlign: 'center', 
                  fontSize: '1rem', 
                  width: '40%',
                  color: '#333'
                }}>
                  Marca
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  borderBottom: '2px solid #000', 
                  textAlign: 'center', 
                  fontSize: '1rem', 
                  width: '60%',
                  color: '#333'
                }}>
                  Familia
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index} sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                  '&:hover': { backgroundColor: '#f0f0f0' }
                }}>
                  
                  {/* COLUMNA 1: MARCA (DROPDOWN) */}
                  <TableCell sx={{ padding: '12px 16px' }}>
                    <Select
                      {...selectProps}
                      value={row.id_marca || ''}
                      onChange={(e) => handleRowChange(index, 'id_marca', e.target.value)}
                    >
                      {marcas.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.marca}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  {/* COLUMNA 2: FAMILIA (TEXTO) */}
                  <TableCell sx={{ padding: '12px 16px' }}>
                    <TextField
                      {...commonProps}
                      value={row.familia || ''}
                      onChange={(e) => handleRowChange(index, 'familia', e.target.value)}
                      onBlur={() => handleBlur(index)} // <--- Dispara el guardado al salir
                    />
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
          </Paper>
        </Box>

      {/* PIE DE PÁGINA */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          CAT_MARCAS_FAMILIAS, ARAUCARIAS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:{session?.nombre || 'ADMIN'}
        </Typography>
      </Box>

      {/* NOTIFICACIÓN FLOTANTE (FEEDBACK) */}
      <Snackbar 
        open={!!mensaje} 
        autoHideDuration={2000} 
        onClose={() => setMensaje(null)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={mensaje?.tipo} variant="filled">
            {mensaje?.texto}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Cat_MarcasFamilias;
