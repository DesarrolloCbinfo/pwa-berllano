"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, IconButton, TextField, Grid, 
  MenuItem, Checkbox, Snackbar, Alert, Paper, Dialog, Slide,
  Tabs, Tab, FormControlLabel, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Autocomplete
} from '@mui/material'; 
import { TransitionProps } from '@mui/material/transitions';
import { 
  DataGrid, GridColDef, GridRenderCellParams, GridToolbar, 
  GridPaginationModel, GridPagination 
} from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';

import useConsumoApi from '../../../hooks/useConsumoApi'; 

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// --- ESTILOS "ANTI-BAILE" DEFINITIVOS ---

const commonProps = {
  fullWidth: true,
  size: "small" as const,
  variant: "outlined" as const,
  sx: {
      width: '100%',
      '& .MuiInputBase-root': { 
          height: '40px', 
          borderRadius: '8px',
          bgcolor: 'white',
          width: '100%', 
          maxWidth: '100%', 
          overflow: 'hidden'
      },
      '& .MuiInputBase-input': {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
      }
  }
};

const selectProps = {
  ...commonProps,
  SelectProps: {
    MenuProps: { PaperProps: { sx: { maxHeight: 300 } } }, 
  },
  sx: {
      ...commonProps.sx,
      '& .MuiSelect-select': { 
          display: 'block !important', 
          whiteSpace: 'nowrap !important', 
          overflow: 'hidden !important', 
          textOverflow: 'ellipsis !important', 
          paddingRight: '30px !important', 
          minHeight: 'auto !important' 
      }
  }
};

const gridItemStyle = { 
  minWidth: 0, 
  flexBasis: 'auto', 
  flexGrow: 0,
  flexShrink: 0,
  maxWidth: '100%' 
};

function CustomPagination() { return <GridPagination />; }

// --- INTERFACES ---
interface ProductoRow {
  id: string;
  clave: string;
  descripcion: string;
  marca: string;
  ex: number;
  costo: number;
  precio: number;
  margen: number;
  iva: number;
  area: string;
  depto: string;
  clase: string;
  inv: boolean;
  obs: boolean;
  cont: boolean;
  prom: boolean;
  kit: boolean;
  ins: boolean;
  serv: boolean;
  prod: boolean;
  prod_libre: boolean;
  origen?: string; 

// --- DATOS EXTRAS PARA EL EXCEL ---
    descripcion1?: string;
    sucursal_origen?: string;
    tasa_iva?: number;
    d_depto?: string;
    d_clase?: string;
    costo_unitario?: number;
    costo_c_iva?: number;
    desc_linea_comercial?: string;
    nombre_comprador?: string;
    mueble?: string;
    tramo?: string;
    nivel?: string;
    finalidad?: string;
    marcaFam1?: string;
    marcaFam2?: string;
    clave_prov?: string;
    clave_sas?: string;
}
interface MarcaFamiliaRel { 
  id_familia: number; 
  id_marca: number; 
  familia: string; 
  marca_desc: string; 
}

interface CatalogoItem { id: number | string; descripcion: string; }

// --- INTERFACES PARA MODAL ---
interface ProductoForm {
  clave_prod: string;
  descripcion: string;
  descripcion_corta: string;
  marca: string;
  familia: string;
  area: string;
  depto: string;
  clase: string;
  observacion: string;
  costo_sin_iva: number;
  tasa_iva: number; 
  costo_con_iva: number;
  costo_promedio: number;
  unidad_paq: number;
  costo_unitario: number;
  costo_unitario_iva: number;
  costo_autorizado: number;
  en_promocion: boolean;
  precio_promocion: number;
  fecha_inicio_promo: string;
  fecha_final_promo: string;
  es_insumo: boolean;
  es_servicio: boolean;
  inventariable: boolean;
  entrega_directa: boolean;
  fraccionable: boolean;
  obsoleto: boolean;
  es_producto: boolean;
  es_kit: boolean;
  controlado: boolean;
  producto_libre: boolean;
  clave_proveedor: string;
  clave_sas: string;
  clave_sap: string;
  sucursal_origen: string;
  finalidad: string;
comision: number;
unidad_paq_traspaso: number;
dias_rotacion: number;
version: string;
}

const initialProductoState: ProductoForm = {
  clave_prod: '',
  descripcion: '',
  descripcion_corta: '',
  marca: '',
  familia: '',
  area: '',
  depto: '',
  clase: '',
  observacion: '',
  
  // --- CAMPOS DE COSTOS ACTUALIZADOS ---
  costo_sin_iva: 0,
  costo_con_iva: 0,
  costo_promedio: 0,
  costo_unitario: 0,
  costo_unitario_iva: 0,
  costo_autorizado: 0,
  
  // --- CAMPOS BASE PARA CÁLCULOS ---
  tasa_iva: 0.16,
  unidad_paq: 1,

  // --- RESTO DE CAMPOS (Mantenlos si los usas en otras pestañas) ---
  en_promocion: false,
  precio_promocion: 0,
  fecha_inicio_promo: '',
  fecha_final_promo: '',
  es_insumo: false,
  es_servicio: false,
  inventariable: true,
  entrega_directa: true,
  fraccionable: false,
  obsoleto: false,
  es_producto: true,
  es_kit: false,
  controlado: false,
  producto_libre: true,
  clave_proveedor: '',
  clave_sas: '',
  clave_sap: '',
  sucursal_origen: '',
  finalidad: '',
comision: 0,
unidad_paq_traspaso: 1,
dias_rotacion: 0,
version: ''
};

// --- ESTILOS PARA MODAL ---
const modalCommonProps = {
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

const modalSelectProps = {
  ...modalCommonProps,
  sx: {
      ...modalCommonProps.sx,
      minWidth: '220px', 
  }
};

const modalSectionStyle = { 
  p: 3, 
  bgcolor: 'white', 
  borderRadius: '12px', 
  border: '1px solid #e0e0e0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.03)' 
};

const initialFormState = {
  area: '%',
  depto: '%',
  clase: '%',
  descripcion: '',
  marca: '%',
  incluir_obsoletos: false
};


// --- COMPONENTE AISLADO PARA PROGRAMACIÓN DE PRECIOS ---
// Esto evita que toda la pantalla principal se congele al editar 120 filas
const ModalProgPrecio = ({ open, onClose, consumoApi, setMessage, claveSeleccionada }: any) => {
    const [datos, setDatos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Cargar datos solo cuando se abre el modal
    useEffect(() => {
        if (open) {
            fetchDatos();
        } else {
            setDatos([]); // Limpiar al cerrar
        }
    }, [open]);

    const fetchDatos = async () => {
        setLoading(true);
        try {
            const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_prog_precio_sel');
            // Agregamos un ID único a cada fila que viene de BD para manejar el renderizado seguro
            const conIds = (res.data || []).map((d: any) => ({ ...d, _uid: Math.random().toString(36).substr(2, 9) }));
            setDatos(conIds);
        } catch (error) {
            setMessage({ text: "Error al cargar la programación", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const fechaDefault = manana.toISOString().split('T')[0];

        setDatos([{ 
            _uid: Math.random().toString(36).substr(2, 9), // ID único
            clave_prod: claveSeleccionada || '', 
            fecha: fechaDefault, 
            lista: 1, 
            precio: 0 
        }, ...datos]);
    };

    const handleDeleteRow = (uid: string) => {
        setDatos(prev => prev.filter(row => row._uid !== uid));
    };

    const handleBlur = (uid: string, campo: string, valor: any) => {
        setDatos(prev => prev.map(row => 
            row._uid === uid ? { ...row, [campo]: valor } : row
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const datosLimpios = datos.map(({ _uid, ...resto }) => ({
                clave_prod: String(resto.clave_prod).trim(),
                fecha: resto.fecha,
                lista: Number(resto.lista),
                precio: Number(resto.precio)
            }));

            const res = await consumoApi.post('/api/CatProductosC/sp_bw_cat_producto_prog_precio_save', datosLimpios);
            if (res.status === 200) {
                setMessage({ text: "✅ Todos los precios programados fueron guardados", type: 'success' });
                onClose();
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al guardar", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                        📅 Programación Global de Precios
                    </Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e3f2fd', borderLeft: '5px solid #1976d2' }}>
                    <Typography variant="body2">
                        Aquí están <strong>todos</strong> los precios programados en el sistema.
                    </Typography>
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 500, border: '1px solid #e0e0e0', boxShadow: 'none', mb: 2 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '200px' }}>Clave Producto</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Fecha Aplicación</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '100px' }}>No. Lista</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Nuevo Precio</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '50px' }} align="center">Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Cargando registros...</TableCell></TableRow>
                            ) : datos.length > 0 ? (
                                datos.map((row) => (
                                    <TableRow key={row._uid} hover>
                                        <TableCell>
                                            <TextField 
                                                defaultValue={row.clave_prod || ''}
                                                onBlur={(e) => handleBlur(row._uid, 'clave_prod', e.target.value)}
                                                size="small" variant="standard" fullWidth placeholder="Ej. 1004"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField 
                                                type="date"
                                                defaultValue={row.fecha ? row.fecha.substring(0, 10) : ''}
                                                onBlur={(e) => handleBlur(row._uid, 'fecha', e.target.value)}
                                                size="small" variant="standard" fullWidth InputLabelProps={{ shrink: true }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField 
                                                type="number"
                                                defaultValue={row.lista}
                                                onBlur={(e) => handleBlur(row._uid, 'lista', e.target.value)}
                                                size="small" variant="standard" fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField 
                                                type="number"
                                                defaultValue={row.precio}
                                                onBlur={(e) => handleBlur(row._uid, 'precio', e.target.value)}
                                                size="small" variant="standard" fullWidth
                                                InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#666' }}>$</Typography> }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" color="error" onClick={() => handleDeleteRow(row._uid)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#999' }}>
                                        No hay precios programados en la tabla.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button variant="outlined" size="small" onClick={handleAddRow} sx={{ fontWeight: 'bold' }}>
                        + Agregar Nuevo
                    </Button>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={onClose} color="inherit">Cancelar</Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSave} 
                            disabled={saving}
                            sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 'bold' }}
                        >
                            {saving ? "Guardando..." : "💾 Guardar Todos"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};
// --- COMPONENTE AISLADO PARA SUSTITUTOS ---
const ModalSustitutos = ({ open, onClose, consumoApi, setMessage, productoForm }: any) => {
    const [datos, setDatos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Estados para las dos cajitas
    const [nuevaClave, setNuevaClave] = useState("");
    const [nuevaDesc, setNuevaDesc] = useState("");

    useEffect(() => {
        if (open && productoForm.clave_prod) {
            fetchDatos();
            // Limpiar cajitas al abrir
            setNuevaClave(""); 
            setNuevaDesc("");
        } else {
            setDatos([]);
        }
    }, [open, productoForm.clave_prod]);

    const fetchDatos = async () => {
        setLoading(true);
        try {
            const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_sustitutos_sel', {
                params: { clave: productoForm.clave_prod }
            });
            setDatos(res.data || []);
        } catch (error) {
            setMessage({ text: "Error al cargar claves sustitutas", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAgregar = async () => {
        if (!nuevaClave.trim()) {
            alert("La clave o código es obligatoria.");
            return;
        }

        setSaving(true);
        try {
            const res = await consumoApi.post('/api/CatProductosC/sp_bw_cat_producto_sustitutos_ins', null, {
                params: {
                    clave_prod: productoForm.clave_prod,
                    clave_real: nuevaClave.trim(),
                    // Mandamos la descripción. Si la dejan vacía, mandamos un texto por defecto
                    descripcion: nuevaDesc.trim() || "Código Alterno / Barras" 
                }
            });

            if (res.status === 200) {
                setMessage({ text: "✅ Código sustituto agregado", type: 'success' });
                // Limpiar cajitas después de guardar
                setNuevaClave(""); 
                setNuevaDesc("");
                fetchDatos(); // Recargar la tabla
            }
        } catch (error: any) {
            // Aquí atrapamos el error "Esta clave ya existe en el catalogo principal"
            const errorMsg = error.response?.data?.mensaje || "Error al agregar el código";
            setMessage({ text: `❌ ${errorMsg}`, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleBorrar = async (claveBorrar: string) => {
        if (!window.confirm(`¿Seguro que desea eliminar el código alterno '${claveBorrar}'?`)) return;

        try {
            const res = await consumoApi.delete('/api/CatProductosC/sp_bw_cat_producto_sustitutos_del', {
                params: {
                    clave_prod: productoForm.clave_prod,
                    clave_real: claveBorrar
                }
            });

            if (res.status === 200) {
                setMessage({ text: "🗑️ Código eliminado", type: 'success' });
                fetchDatos(); // Recargar la tabla
            }
        } catch (error: any) {
            setMessage({ text: "Error al eliminar el código", type: 'error' });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1 }}>
                        Lista de <br /> <span style={{ fontSize: '1.6rem' }}>Códigos Alternos</span>
                    </Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                
                <Divider sx={{ my: 2, borderBottomWidth: 3, borderColor: '#1976d2' }} />

                {/* ENCABEZADO */}
                <Grid container spacing={2} sx={{ mb: 3, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Grid item xs={8}>
                        <Typography variant="body2"><strong>Clave general:</strong> {productoForm.clave_prod}</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}><strong>Descripción:</strong> {productoForm.descripcion}</Typography>
                    </Grid>
                    <Grid item xs={4} textAlign="right">
                        <Typography variant="body2"><strong>Costo unitario:</strong></Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                            ${Number(productoForm.costo_unitario_iva).toFixed(2)}
                        </Typography>
                    </Grid>
                </Grid>

                {/* CAJITAS PARA AGREGAR NUEVO */}
                <Box sx={{ display: 'flex', gap: 1, mb: 3, alignItems: 'flex-start' }}>
                    <TextField 
                        sx={{ flex: 1 }}
                        size="small" 
                        variant="outlined" 
                        label="Nuevo Código" 
                        placeholder="Ej. 7501234..."
                        value={nuevaClave}
                        onChange={(e) => setNuevaClave(e.target.value)}
                        disabled={saving}
                    />
                    <TextField 
                        sx={{ flex: 1.5 }}
                        size="small" 
                        variant="outlined" 
                        label="Descripción del código" 
                        placeholder="Ej. Barras Caja 12 Pzas"
                        value={nuevaDesc}
                        onChange={(e) => setNuevaDesc(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
                        disabled={saving}
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleAgregar}
                        disabled={!nuevaClave.trim() || saving}
                        sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap', height: '40px' }}
                    >
                        {saving ? "..." : "+ Agregar"}
                    </Button>
                </Box>

                {/* TABLA DE CÓDIGOS */}
                <TableContainer component={Paper} sx={{ maxHeight: 300, border: '1px solid #ccc', boxShadow: 'none' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Código / Barra</TableCell>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Descripción específica</TableCell>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold', width: '50px' }} align="center">Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={3} align="center">Cargando...</TableCell></TableRow>
                            ) : datos.length > 0 ? (
                                datos.map((s, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{s.codigo}</TableCell>
                                        <TableCell>{s.descripcion}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" color="error" onClick={() => handleBorrar(s.codigo)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: '#999' }}>No hay claves alternas registradas.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button onClick={onClose} variant="outlined" sx={{ color: '#333', borderColor: '#ccc', px: 4 }}>
                        Cerrar Ventana
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

// --- COMPONENTE AISLADO PARA PROGRAMACIÓN DE COSTOS ---
const ModalProgCosto = ({ open, onClose, consumoApi, setMessage, claveSeleccionada }: any) => {
    const [datos, setDatos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) fetchDatos();
        else setDatos([]);
    }, [open]);

    const fetchDatos = async () => {
        setLoading(true);
        try {
            const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_prog_costo_sel');
            const conIds = (res.data || []).map((d: any) => ({ ...d, _uid: Math.random().toString(36).substr(2, 9) }));
            setDatos(conIds);
        } catch (error) {
            setMessage({ text: "Error al cargar la programación de costos", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        setDatos([{ 
            _uid: Math.random().toString(36).substr(2, 9), 
            clave_prod: claveSeleccionada || '', 
            fecha: manana.toISOString().split('T')[0], 
            costo_unitario: 0, 
            costo_paquete: 0,
            costoNeto: 0
        }, ...datos]);
    };

    const handleDeleteRow = (uid: string) => setDatos(prev => prev.filter(row => row._uid !== uid));

    const handleBlur = (uid: string, campo: string, valor: any) => {
        setDatos(prev => prev.map(row => row._uid === uid ? { ...row, [campo]: valor } : row));
    };

    const handleSave = async () => {
        // Validar que no haya claves ni fechas vacías
        if (datos.some(d => !d.clave_prod || !d.fecha)) {
            alert("Asegúrese de que todas las filas tengan Clave y Fecha.");
            return;
        }

        setSaving(true);
        try {
            const datosLimpios = datos.map(({ _uid, ...resto }) => ({
                clave_prod: String(resto.clave_prod).trim(),
                fecha: resto.fecha,
                costo_unitario: Number(resto.costo_unitario || 0),
                costo_paquete: Number(resto.costo_paquete || 0),
                costoNeto: Number(resto.costoNeto || 0)
            }));

            const res = await consumoApi.post('/api/CatProductosC/sp_bw_cat_producto_prog_costo_save', datosLimpios);
            if (res.status === 200) {
                setMessage({ text: "✅ Todos los costos programados fueron guardados", type: 'success' });
                onClose();
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al guardar costos", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                        📈 Programación Global de Costos
                    </Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e8f5e9', borderLeft: '5px solid #4caf50' }}>
                    <Typography variant="body2">
                        Aquí puedes programar los futuros <strong>Costos</strong>. Se actualizarán automáticamente al llegar la fecha.
                    </Typography>
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 500, border: '1px solid #e0e0e0', boxShadow: 'none', mb: 2 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '200px' }}>Clave</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Fecha</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Costo Unitario</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Costo Paquete</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Costo Neto</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '50px' }} align="center">Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Cargando costos...</TableCell></TableRow>
                            ) : datos.length > 0 ? (
                                datos.map((row) => (
                                    <TableRow key={row._uid} hover>
                                        <TableCell>
                                            <TextField defaultValue={row.clave_prod || ''} onBlur={(e) => handleBlur(row._uid, 'clave_prod', e.target.value)} size="small" variant="standard" fullWidth />
                                        </TableCell>
                                        <TableCell>
                                            <TextField type="date" defaultValue={row.fecha ? row.fecha.substring(0, 10) : ''} onBlur={(e) => handleBlur(row._uid, 'fecha', e.target.value)} size="small" variant="standard" fullWidth InputLabelProps={{ shrink: true }} />
                                        </TableCell>
                                        <TableCell>
                                            <TextField type="number" defaultValue={row.costo_unitario} onBlur={(e) => handleBlur(row._uid, 'costo_unitario', e.target.value)} size="small" variant="standard" fullWidth InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#666' }}>$</Typography> }} />
                                        </TableCell>
                                        <TableCell>
                                            <TextField type="number" defaultValue={row.costo_paquete} onBlur={(e) => handleBlur(row._uid, 'costo_paquete', e.target.value)} size="small" variant="standard" fullWidth InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#666' }}>$</Typography> }} />
                                        </TableCell>
                                        <TableCell>
                                            <TextField type="number" defaultValue={row.costoNeto} onBlur={(e) => handleBlur(row._uid, 'costoNeto', e.target.value)} size="small" variant="standard" fullWidth InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#666' }}>$</Typography> }} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" color="error" onClick={() => handleDeleteRow(row._uid)}><DeleteIcon fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#999' }}>No hay costos programados en la tabla.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button variant="outlined" size="small" onClick={handleAddRow} sx={{ fontWeight: 'bold' }}>+ Agregar Nuevo</Button>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={onClose} color="inherit">Cancelar</Button>
                        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: '#2e7d32', color: '#fff', fontWeight: 'bold' }}>
                            {saving ? "Guardando..." : "💾 Guardar Todos"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};

// --- COMPONENTE AISLADO PARA STOCK POR SUCURSAL ---
const ModalStockSucursal = ({ open, onClose, consumoApi, setMessage, productoForm, sucursales }: any) => {
    const [datos, setDatos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && productoForm.clave_prod) fetchDatos();
        else setDatos([]);
    }, [open, productoForm.clave_prod]);

    const fetchDatos = async () => {
        setLoading(true);
        try {
            const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_stock_sel', {
                params: { clave: productoForm.clave_prod }
            });
            const conIds = (res.data || []).map((d: any) => ({ ...d, _uid: Math.random().toString(36).substr(2, 9) }));
            setDatos(conIds);
        } catch (error) {
            setMessage({ text: "Error al cargar el stock", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        setDatos([...datos, { _uid: Math.random().toString(36).substr(2, 9), sucursal: '', stock_minimo: 0 }]);
    };

    // Función equivalente al botón "Agregar stock General" de Access
    const handleAddStockGeneral = () => {
        const sucursalesActuales = datos.map(d => Number(d.sucursal));
        const nuevasFilas: any[] = [];

        // Recorremos el catálogo general de sucursales que ya tenemos en memoria
        sucursales.forEach((suc: any) => {
            if (!sucursalesActuales.includes(Number(suc.id))) {
                nuevasFilas.push({
                    _uid: Math.random().toString(36).substr(2, 9),
                    sucursal: suc.id,
                    stock_minimo: 0
                });
            }
        });

        if (nuevasFilas.length > 0) {
            setDatos([...datos, ...nuevasFilas].sort((a, b) => Number(a.sucursal) - Number(b.sucursal)));
        } else {
            alert("Todas las sucursales ya están agregadas en la lista.");
        }
    };

    const handleDeleteRow = (uid: string) => setDatos(prev => prev.filter(row => row._uid !== uid));

    const handleChange = (uid: string, campo: string, valor: any) => {
        setDatos(prev => prev.map(row => row._uid === uid ? { ...row, [campo]: valor } : row));
    };

    const handleSave = async () => {
        // Validar campos vacíos
        if (datos.some(d => !d.sucursal || d.sucursal === '')) {
            alert("Asegúrese de seleccionar una sucursal en todas las filas.");
            return;
        }

        setSaving(true);
        try {
            const datosLimpios = datos.map(({ _uid, ...resto }) => ({
                sucursal: Number(resto.sucursal),
                stock_minimo: Number(resto.stock_minimo || 0)
            }));

            const res = await consumoApi.post(
                `/api/CatProductosC/sp_bw_cat_producto_stock_save?clave=${productoForm.clave_prod}`, 
                datosLimpios
            );
            
            if (res.status === 200) {
                setMessage({ text: "✅ Configuración de stock guardada con éxito", type: 'success' });
                onClose();
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al guardar el stock", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                        📦 Configuración de Stock por Sucursal
                    </Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderLeft: '5px solid #333' }}>
                    <Box>
                        <Typography variant="body2"><strong>Clave:</strong> {productoForm.clave_prod}</Typography>
                        <Typography variant="body2"><strong>Descripción:</strong> {productoForm.descripcion}</Typography>
                    </Box>
                    <Button variant="contained" color="primary" size="small" onClick={handleAddStockGeneral} sx={{ fontWeight: 'bold' }}>
                        Agregar stock General
                    </Button>
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 350, border: '1px solid #e0e0e0', boxShadow: 'none', mb: 2 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Sucursal</TableCell>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }} align="right">Stock Mínimo</TableCell>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold', width: '50px' }} align="center">Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3 }}>Cargando stock...</TableCell></TableRow>
                            ) : datos.length > 0 ? (
                                datos.map((row) => (
                                    <TableRow key={row._uid} hover>
                                        <TableCell>
                                            {/* Usamos un Select para que el usuario vea el nombre de la sucursal, no solo el ID */}
                                            <TextField 
                                                select
                                                value={row.sucursal}
                                                onChange={(e) => handleChange(row._uid, 'sucursal', e.target.value)}
                                                size="small" variant="standard" fullWidth
                                            >
                                                {sucursales.map((s: any) => (
                                                    <MenuItem key={s.id} value={s.id}>{s.descripcion}</MenuItem>
                                                ))}
                                            </TextField>
                                        </TableCell>
                                        <TableCell align="right">
                                            <TextField 
                                                type="number"
                                                value={row.stock_minimo}
                                                onChange={(e) => handleChange(row._uid, 'stock_minimo', e.target.value)}
                                                size="small" variant="standard" 
                                                sx={{ width: '100px' }}
                                                inputProps={{ style: { textAlign: 'right' } }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" color="error" onClick={() => handleDeleteRow(row._uid)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: '#999' }}>Sin configuración de stock.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button variant="outlined" size="small" onClick={handleAddRow} sx={{ fontWeight: 'bold' }}>
                        + Fila Manual
                    </Button>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={onClose} color="inherit">Cancelar</Button>
                        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: '#333', color: '#fff', fontWeight: 'bold' }}>
                            {saving ? "Guardando..." : "💾 Guardar"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};

// --- COMPONENTE AISLADO PARA ANÁLISIS POR CLAVE ---
const ModalAnalisisPorClave = ({ open, onClose, onAbrirVentasComparativas }: any) => {
    // Lista exacta de botones según la imagen de Access
    const botonesReportes = [
        "REPORTE DE VENTAS COMPARATIVAS",
        "ANALISIS DE COMPRAS POR CLAVE",
        "REPORTE DE CAMBIOS AL CATALOGO DE PRODUCTOS",
        "REPORTE DE VENTAS COMPARATIVAS POR CLASE",
        "REPORTE DE VENTAS - PRODUCTOS OFERTADOS",
        "REPORTE DE VENTA CRUZADA",
        "REPORTE DE VENTAS REMATES"
    ];

    const handleClick = (texto: string) => {
        if (texto === "REPORTE DE VENTAS COMPARATIVAS") {
            onClose(); // Cerramos el menú actual
            onAbrirVentasComparativas(); // Abrimos el nuevo modal de filtros
        } else {
            alert(`Módulo en desarrollo: ${texto}`);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 4, bgcolor: '#fdfdfd', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#777', mb: 4 }}>
                    Análisis por clave
                </Typography>
                
                {/* Contenedor de la lista de botones */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 5, px: 2 }}>
                    {botonesReportes.map((texto, idx) => (
                        <Button 
                            key={idx}
                            variant="contained" 
                            fullWidth
                            sx={{ 
                                bgcolor: '#e3f2fd', // Azul clarito estilo Access
                                color: '#555', 
                                fontWeight: 600, 
                                border: '1px solid #90caf9',
                                py: 1.5,
                                boxShadow: 'none',
                                '&:hover': { bgcolor: '#bbdefb', boxShadow: 'none' }
                            }}
                            // ⚠️ AQUÍ ESTABA EL ERROR: Ahora sí llama a la función
                            onClick={() => handleClick(texto)}
                        >
                            {texto}
                        </Button>
                    ))}
                </Box>

                {/* Botón de Salir (más ancho y separado) */}
                <Button 
                    variant="contained" 
                    onClick={onClose}
                    sx={{ 
                        bgcolor: '#e3f2fd', 
                        color: '#555', 
                        fontWeight: 600, 
                        width: '70%',
                        border: '1px solid #90caf9',
                        py: 1.5,
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#bbdefb', boxShadow: 'none' }
                    }}
                >
                    SALIR
                </Button>
            </Box>
        </Dialog>
    );
};

// --- COMPONENTE: REPORTE DE VENTAS COMPARATIVAS ---
const ModalVentasComparativas = ({ open, onClose, consumoApi, setMessage }: any) => {
    // --- ESTADOS DE LOS FILTROS ---
    const [area, setArea] = useState('%');
    const [depto, setDepto] = useState('%');
    const [clase, setClase] = useState('%');
    const [sucursal, setSucursal] = useState('%');
    const [producto, setProducto] = useState<any>(null); // Para el Autocomplete
    const [productoWildcard, setProductoWildcard] = useState('%'); // La cajita al lado de producto

    // Fechas (Por defecto hoy)
    const hoy = new Date().toISOString().split('T')[0];
    const [fechaDel, setFechaDel] = useState(hoy);
    const [fechaAl, setFechaAl] = useState(hoy);

    // Checkboxes
    const [chkTiendas, setChkTiendas] = useState(true);
    const [chkRutas, setChkRutas] = useState(true);
    const [chkBodegas, setChkBodegas] = useState(true);
    const [chkNocturnas, setChkNocturnas] = useState(false);
    const [chkConIva, setChkConIva] = useState(true);
    const [chkPromociones, setChkPromociones] = useState(false);

    // Radio buttons
    const [tipoTiendas, setTipoTiendas] = useState('totales');

    // --- ESTADOS DE LAS LISTAS DESPLEGABLES ---
    const [listaAreas, setListaAreas] = useState<any[]>([]);
    const [listaDeptos, setListaDeptos] = useState<any[]>([]);
    const [listaClases, setListaClases] = useState<any[]>([]);
    const [listaSucursales, setListaSucursales] = useState<any[]>([]);
    const [catBusquedaProd, setCatBusquedaProd] = useState<any[]>([]);

    // Cargar listas principales al abrir el modal
    useEffect(() => {
        if (open) {
            cargarListasBase();
        }
    }, [open]);

    const cargarListasBase = async () => {
        try {
            const [resAreas, resSuc] = await Promise.all([
                consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_areas'),
                consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_sucursales')
            ]);
            setListaAreas(resAreas.data);
            
            // Fíjate que aquí usamos "id" porque así viene la respuesta mapeada de la vista general que hiciste, pero
            // dependiendo de tu API, las llaves originales pueden venir como cve_sucursal y nombre.
            // Para asegurarnos, inyectamos la opción %
            setListaSucursales([{ id: '%', descripcion: ' TODAS' }, ...resSuc.data]);
            
            // Cargar Deptos y Clases iniciales (con %)
            cargarDeptos('%');
            cargarClases('%', '%');
        } catch (error) {
            setMessage({ text: "Error al cargar los catálogos", type: 'error' });
        }
    };

    const cargarDeptos = async (areaId: string) => {
        const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_deptos', { params: { area: areaId } });
        setListaDeptos(res.data);
    };

    const cargarClases = async (areaId: string, deptoId: string) => {
        const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_clases', { params: { area: areaId, depto: deptoId } });
        setListaClases(res.data);
    };

    // Buscador de productos (cuando escriben)
    const buscarProductos = async (termino: string) => {
        if (termino.length < 3) return; // Buscar solo si hay 3 o más letras
        try {
            const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_productos_sel', {
                params: { descripcion: termino, sucursal: 1 } // Pasamos sucursal 1 como genérico para búsqueda
            });
            setCatBusquedaProd(res.data || []);
        } catch (e) {}
    };

    // Manejo de cambios en cascada
    const handleCambioArea = (val: string) => {
        setArea(val); setDepto('%'); setClase('%');
        cargarDeptos(val); cargarClases(val, '%');
    };
    const handleCambioDepto = (val: string) => {
        setDepto(val); setClase('%');
        cargarClases(area, val);
    };

    // Función mockeada para los botones de reportes
    const dispararReporte = (nombreReporte: string) => {
        alert(`Falta conectar el SP para: ${nombreReporte}\nFiltros actuales:\nÁrea: ${area}, Depto: ${depto}\nFechas: ${fechaDel} al ${fechaAl}`);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <Box sx={{ p: 4, bgcolor: '#fdfdfd' }}>
                
                {/* ENCABEZADO ESTILO ACCESS */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                        <Typography variant="h6" sx={{ color: '#999', mb: -1, ml: 1 }}>Reporte de</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', borderBottom: '6px solid black', display: 'inline-block', pb: 0.5, pr: 8, color: '#000' }}>
                            Ventas Comparativas
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>

                {/* ZONA DE FILTROS (GRID) */}
                <Box sx={{ px: 4 }}>
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs={3} textAlign="right"><Typography fontWeight="bold">AREA</Typography></Grid>
                        {/* ⚠️ CORRECCIÓN AQUÍ: Usamos (a.id || a.area) para que no falle si la API devuelve nombres distintos */}
                        <Grid item xs={9}><TextField select size="small" fullWidth value={area} onChange={(e) => handleCambioArea(e.target.value)}>{listaAreas.map(a => <MenuItem key={a.id || a.area} value={a.id || a.area}>{a.descripcion}</MenuItem>)}</TextField></Grid>

                        <Grid item xs={3} textAlign="right"><Typography fontWeight="bold">DEPTO</Typography></Grid>
                        <Grid item xs={9}><TextField select size="small" fullWidth value={depto} onChange={(e) => handleCambioDepto(e.target.value)}>{listaDeptos.map(d => <MenuItem key={d.id || d.depto} value={d.id || d.depto}>{d.descripcion}</MenuItem>)}</TextField></Grid>

                        <Grid item xs={3} textAlign="right"><Typography fontWeight="bold">CLASE</Typography></Grid>
                        <Grid item xs={9}><TextField select size="small" fullWidth value={clase} onChange={(e) => setClase(e.target.value)}>{listaClases.map(c => <MenuItem key={c.id || c.clase} value={c.id || c.clase}>{c.descripcion}</MenuItem>)}</TextField></Grid>

                        <Grid item xs={3} textAlign="right"><Typography fontWeight="bold">PRODUCTO</Typography></Grid>
                        <Grid item xs={7}>
                            <Autocomplete
                                options={catBusquedaProd}
                                getOptionLabel={(option: any) => `${option.Clave || option.clave_prod} - ${option.Descripcion || option.descripcion}`}
                                value={producto}
                                onChange={(e, val) => setProducto(val)}
                                onInputChange={(e, val) => buscarProductos(val)}
                                renderInput={(params) => <TextField {...params} size="small" placeholder="Buscar producto..." />}
                            />
                        </Grid>
                        <Grid item xs={2}><TextField size="small" fullWidth value={productoWildcard} onChange={(e)=>setProductoWildcard(e.target.value)} /></Grid>

                        <Grid item xs={3} textAlign="right"><Typography fontWeight="bold">SUCURSAL</Typography></Grid>
                        <Grid item xs={9}><TextField select size="small" fullWidth value={sucursal} onChange={(e) => setSucursal(e.target.value)}>{listaSucursales.map(s => <MenuItem key={s.id || s.cve_sucursal} value={s.id || s.cve_sucursal}>{s.descripcion || s.nombre}</MenuItem>)}</TextField></Grid>

                        <Grid item xs={3} textAlign="right"><Typography fontWeight="bold">DEL</Typography></Grid>
                        <Grid item xs={4}><TextField type="date" size="small" fullWidth value={fechaDel} onChange={(e)=>setFechaDel(e.target.value)}/></Grid>
                        <Grid item xs={1} textAlign="center"><Typography fontWeight="bold">AL</Typography></Grid>
                        <Grid item xs={4}><TextField type="date" size="small" fullWidth value={fechaAl} onChange={(e)=>setFechaAl(e.target.value)}/></Grid>
                    </Grid>

                    {/* ZONA DE CHECKBOXES */}
                    <Grid container spacing={2} sx={{ mb: 4, pl: 3 }}>
                        <Grid item xs={8}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                <FormControlLabel control={<Checkbox checked={chkTiendas} onChange={(e)=>setChkTiendas(e.target.checked)} />} label="TIENDAS" />
                                <FormControlLabel control={<Checkbox checked={chkRutas} onChange={(e)=>setChkRutas(e.target.checked)} />} label="RUTAS" />
                                <FormControlLabel control={<Checkbox checked={chkBodegas} onChange={(e)=>setChkBodegas(e.target.checked)} />} label="BODEGAS" />
                            </Box>
                            <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 1, position: 'relative', mt: 2 }}>
                                <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: '#fdfdfd', px: 1, color: '#666' }}>Tiendas</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                                    <FormControlLabel control={<Checkbox checked={tipoTiendas === 'totales'} onChange={() => setTipoTiendas('totales')} icon={<Box sx={{width:16,height:16,borderRadius:'50%',border:'1px solid gray'}}/>} checkedIcon={<Box sx={{width:16,height:16,borderRadius:'50%',border:'1px solid gray', bgcolor:'black'}}/>} />} label="Totales" />
                                    <FormControlLabel control={<Checkbox checked={tipoTiendas === 'iguales'} onChange={() => setTipoTiendas('iguales')} icon={<Box sx={{width:16,height:16,borderRadius:'50%',border:'1px solid gray'}}/>} checkedIcon={<Box sx={{width:16,height:16,borderRadius:'50%',border:'1px solid gray', bgcolor:'black'}}/>} />} label="Iguales" />
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                            <FormControlLabel control={<Checkbox checked={chkNocturnas} onChange={(e)=>setChkNocturnas(e.target.checked)} />} label="SOLO NOCTURNAS" />
                            <FormControlLabel control={<Checkbox checked={chkConIva} onChange={(e)=>setChkConIva(e.target.checked)} />} label="VENTAS CON IVA" />
                            <FormControlLabel control={<Checkbox checked={chkPromociones} onChange={(e)=>setChkPromociones(e.target.checked)} />} label="SOLO PROMOCIONES" />
                        </Grid>
                    </Grid>

                    {/* BOTONES DE REPORTES */}
                    <Grid container spacing={2}>
                        {["RESUMEN POR CLAVE", "RESUMEN POR DEPTO", "RESUMEN POR SUCURSAL", "RESUMEN POR CLASE", "RESUMEN POR AREA", "RESUMEN POR SUC. GLOBAL", "RESUMEN AÑO-MES"].map((btn, idx) => (
                            <Grid item xs={4} key={idx}>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    onClick={() => dispararReporte(btn)}
                                    sx={{ 
                                        bgcolor: '#e3f2fd', color: '#333', fontWeight: 'bold', 
                                        border: '1px solid #90caf9', boxShadow: 'none',
                                        '&:hover': { bgcolor: '#bbdefb', boxShadow: 'none' }
                                    }}
                                >
                                    {btn} 📊
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>
        </Dialog>
    );
};

// --- COMPONENTE AISLADO PARA REASIGNACIÓN MASIVA ---
const ModalReasignacionMasiva = ({ open, onClose, consumoApi, setMessage, rows, onSuccess }: any) => {
    const [lista, setLista] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [seleccion, setSeleccion] = useState<any>(null);

    useEffect(() => {
        if (open) {
            setSeleccion(null);
            fetchLista();
        }
    }, [open]);

    const fetchLista = async () => {
        setLoading(true);
        try {
            const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_jerarquia_plana');
            setLista(res.data || []);
        } catch (error) {
            setMessage({ text: "Error al cargar clasificaciones", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmar = async () => {
        if (!seleccion) return;
        if (rows.length === 0) {
            alert("No hay productos en la tabla para actualizar.");
            return;
        }

        // Aquí le decimos al usuario exactamente a cuántos va a afectar
        const confirmar = window.confirm(`¿Está seguro de reasignar los ${rows.length} productos filtrados en la tabla a la clasificación:\n\n${seleccion.d_area} > ${seleccion.d_depto} > ${seleccion.d_clase}?`);
        if (!confirmar) return;

        setSaving(true);
        try {
            // MAGIA: Aquí sacamos SOLO las claves de los productos que están en la tabla
            const clavesSeparadasPorComa = rows.map((r: any) => r.clave).join(',');

            const res = await consumoApi.post('/api/CatProductosC/sp_bw_cat_combo_reasignar', {
                claves_prod: clavesSeparadasPorComa,
                nuevo_area: seleccion.area,
                nuevo_depto: seleccion.depto,
                nuevo_clase: seleccion.clase
            });

            if (res.status === 200) {
                setMessage({ text: `✅ ${rows.length} productos reasignados con éxito.`, type: 'success' });
                onClose();
                onSuccess(); // Dispara la recarga de la tabla principal
            }
        } catch (error) {
            setMessage({ text: "Error al aplicar la reasignación masiva", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f', mb: 1 }}>
                    ⚠️ Reasignación Masiva
                </Typography>
                <Typography variant="body2" sx={{ color: '#555', mb: 3 }}>
                    Se cambiará el Área, Departamento y Clase de los <strong>{rows.length} productos</strong> que tienes filtrados actualmente. Selecciona la nueva clasificación:
                </Typography>

                <Autocomplete
                    options={lista}
                    loading={loading}
                    getOptionLabel={(opt) => `${opt.d_area} > ${opt.d_depto} > ${opt.d_clase}`}
                    value={seleccion}
                    onChange={(e, newValue) => setSeleccion(newValue)}
                    disabled={saving}
                    renderInput={(params) => (
                        <TextField {...params} label="Buscar nueva clasificación..." variant="outlined" autoFocus />
                    )}
                />

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={onClose} variant="outlined" color="inherit" disabled={saving}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleConfirmar} 
                        disabled={!seleccion || saving}
                        sx={{ bgcolor: '#d32f2f', color: '#fff', fontWeight: 'bold' }}
                    >
                        {saving ? "Procesando..." : "Confirmar Reasignación"}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

// --- COMPONENTE AISLADO PARA INFO STOCK ---
const ModalInfoStock = ({ open, onClose, consumoApi, setMessage, productoForm }: any) => {
    const [datos, setDatos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && productoForm.clave_prod) fetchDatos();
        else setDatos([]);
    }, [open, productoForm.clave_prod]);

    const fetchDatos = async () => {
        setLoading(true);
        try {
            const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_info_stock_sel', {
                params: { clave: productoForm.clave_prod }
            });
            setDatos(res.data || []);
        } catch (error) {
            setMessage({ text: "Error al cargar la información de stock", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
            <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#777', lineHeight: 1 }}>
                        Información de <br /> <span style={{ fontSize: '1.8rem', color: '#000' }}>Stock</span>
                    </Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                
                <Divider sx={{ my: 2, borderBottomWidth: 4, borderColor: '#000' }} />

                <Box sx={{ mb: 2, p: 0 }}>
                    <Typography variant="body1"><strong>Clave:</strong> {productoForm.clave_prod}</Typography>
                    <Typography variant="body1"><strong>Descripción:</strong> {productoForm.descripcion}</Typography>
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 500, border: '1px solid #000', borderRadius: 0, boxShadow: 'none', overflowX: 'auto' }}>
                    <Table stickyHeader size="small" sx={{ minWidth: 1500 }}>
                        <TableHead>
                            <TableRow>
                                {["Sucursal", "Descripción", "Entradas", "Salidas", "Existencias", "Ventas Periodo", "Ventas Promedio", "Días Muestra", "Unid. Paq. Traspaso", "Días Rotación", "Días Min.", "Días Max.", "Nuevo Mínimo", "Nuevo Máximo"].map((col, idx) => (
                                    <TableCell key={idx} align={idx > 1 ? "right" : "left"} sx={{ bgcolor: '#b3e5fc', fontWeight: 'bold', borderRight: '1px solid #fff', whiteSpace: 'nowrap' }}>
                                        {col}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={14} align="center" sx={{ py: 3 }}>Consultando información...</TableCell></TableRow>
                            ) : datos.length > 0 ? (
                                datos.map((row, idx) => (
                                    <TableRow key={idx} hover sx={{ '& td': { borderRight: '1px solid #eee' } }}>
                                        <TableCell>{row.sucursal}</TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.descripcion}</TableCell>
                                        <TableCell align="right">{Number(row.entradas || 0).toFixed(2)}</TableCell>
                                        <TableCell align="right">{Number(row.salidas || 0).toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{Number(row.existencias || 0).toFixed(2)}</TableCell>
                                        <TableCell align="right">{Number(row.venta_periodo || 0).toFixed(2)}</TableCell>
                                        <TableCell align="right">{Number(row.ventas_promedio || 0).toFixed(2)}</TableCell>
                                        <TableCell align="right">{Number(row.dias_muestra || 0)}</TableCell>
                                        <TableCell align="right">{Number(row.unidad_paq_traspaso || 0)}</TableCell>
                                        <TableCell align="right">{Number(row.dias_rotacion || 0)}</TableCell>
                                        <TableCell align="right">{Number(row.dias_min || 0)}</TableCell>
                                        <TableCell align="right">{Number(row.dias_max || 0)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{Number(row.nuevo_minimo || 0).toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>{Number(row.nuevo_maximo || 0).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={14} align="center" sx={{ py: 4, color: '#999' }}>No hay información de stock para esta clave.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#e0e0e0', color: '#333', '&:hover': { bgcolor: '#ccc' }, px: 6, fontWeight: 'bold' }}>
                        Cerrar
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

// --- COMPONENTE AISLADO PARA PROVEEDORES ---
const ModalProveedores = ({ open, onClose, consumoApi, setMessage, productoForm, proveedores }: any) => {
    const [datos, setDatos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && productoForm.clave_prod) fetchDatos();
        else setDatos([]);
    }, [open, productoForm.clave_prod]);

    const fetchDatos = async () => {
        setLoading(true);
        try {
            const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_proveedores_sel', {
                params: { clave: productoForm.clave_prod }
            });
            const conIds = (res.data || []).map((d: any) => ({ ...d, _uid: Math.random().toString(36).substr(2, 9) }));
            setDatos(conIds);
        } catch (error) {
            setMessage({ text: "Error al cargar los proveedores", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        setDatos([...datos, { _uid: Math.random().toString(36).substr(2, 9), cve_prov: '', descuento: 0 }]);
    };

    const handleDeleteRow = (uid: string) => setDatos(prev => prev.filter(row => row._uid !== uid));

    const handleChange = (uid: string, campo: string, valor: any) => {
        if (campo === 'descuento') {
            const num = Number(valor);
            if (num < 0 || num > 1) {
                alert("Ingrese solo valores entre 0 y 1 para indicar porcentajes (Ej. 0.15 para 15%).");
                return;
            }
        }
        setDatos(prev => prev.map(row => row._uid === uid ? { ...row, [campo]: valor } : row));
    };

    const handleSave = async () => {
        if (datos.some(d => !d.cve_prov || d.cve_prov === '')) {
            alert("Asegúrese de seleccionar un proveedor en todas las filas.");
            return;
        }

        setSaving(true);
        try {
            const datosLimpios = datos.map(({ _uid, ...resto }) => ({
                cve_prov: String(resto.cve_prov),
                descuento: Number(resto.descuento || 0)
            }));

            const res = await consumoApi.post(
                `/api/CatProductosC/sp_bw_cat_producto_proveedores_save?clave=${productoForm.clave_prod}`, 
                datosLimpios
            );
            
            if (res.status === 200) {
                setMessage({ text: "✅ Proveedores asignados con éxito", type: 'success' });
                onClose();
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al guardar", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                        🏢 Proveedores Asignados
                    </Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderLeft: '5px solid #d32f2f' }}>
                    <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 'bold', mb: 0.5 }}>Clave general: {productoForm.clave_prod}</Typography>
                    <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>Descripción: {productoForm.descripcion}</Typography>
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 350, border: '1px solid #e0e0e0', boxShadow: 'none', mb: 2 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold', color: '#8b0000' }}>Proveedores</TableCell>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold', color: '#8b0000', width: '120px' }} align="center">Descuento</TableCell>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold', width: '50px' }} align="center">Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3 }}>Cargando proveedores...</TableCell></TableRow>
                            ) : datos.length > 0 ? (
                                datos.map((row) => (
                                    <TableRow key={row._uid} hover>
                                        <TableCell>
                                            <TextField 
                                                select
                                                value={row.cve_prov}
                                                onChange={(e) => handleChange(row._uid, 'cve_prov', e.target.value)}
                                                size="small" variant="outlined" fullWidth
                                                sx={{ '& .MuiSelect-select': { py: 0.5 } }}
                                            >
                                                {proveedores.map((p: any) => (
                                                    <MenuItem key={p.id} value={p.id}>{p.descripcion}</MenuItem>
                                                ))}
                                            </TextField>
                                        </TableCell>
                                        <TableCell align="center">
                                            <TextField 
                                                type="number"
                                                value={row.descuento}
                                                onChange={(e) => handleChange(row._uid, 'descuento', e.target.value)}
                                                size="small" variant="outlined" 
                                                inputProps={{ step: "0.01", min: "0", max: "1", style: { textAlign: 'center' } }}
                                                sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" color="error" onClick={() => handleDeleteRow(row._uid)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: '#999' }}>No hay proveedores asignados.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button variant="outlined" size="small" onClick={handleAddRow} sx={{ fontWeight: 'bold', color: '#333', borderColor: '#ccc' }}>
                        * Agregar Fila
                    </Button>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={onClose} color="inherit" variant="outlined" sx={{ borderColor: '#ccc' }}>Salir</Button>
                        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: '#333', color: '#fff', fontWeight: 'bold' }}>
                            {saving ? "Guardando..." : "💾 Guardar"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};

// --- COMPONENTE AISLADO PARA KARDEX (TARJETA DE ALMACÉN) ---
const ModalKardex = ({ open, onClose, consumoApi, setMessage, productoForm, sucursales }: any) => {
    const [datos, setDatos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Fechas por defecto (Primer día del mes actual al día de hoy)
    const hoy = new Date().toISOString().split('T')[0];
    const primerDia = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [fechaInicio, setFechaInicio] = useState(primerDia);
    const [fechaFin, setFechaFin] = useState(hoy);
    
    // Tratamos de tomar la sucursal del usuario por defecto, o la primera del catálogo
    const sucursalUsuario = () => {
        try {
            const tokenData = localStorage.getItem('token');
            if (tokenData) return JSON.parse(tokenData).claveDepartamento;
        } catch(e) {}
        return '';
    };
    const [sucursalSel, setSucursalSel] = useState<string>(sucursalUsuario());

    useEffect(() => {
        if (open) {
            setDatos([]); // Limpiar la tabla al abrir
        }
    }, [open]);

    const handleConsultar = async () => {
        if (!sucursalSel) {
            alert("Seleccione una sucursal para consultar.");
            return;
        }
        if (fechaInicio > fechaFin) {
            alert("La fecha final debe ser mayor o igual a la inicial.");
            return;
        }

        setLoading(true);
        try {
            const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_kardex_sel', {
                params: {
                    clave: productoForm.clave_prod,
                    sucursal: sucursalSel,
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin
                }
            });
            setDatos(res.data || []);
            if(res.data.length === 0) setMessage({ text: "No se encontraron movimientos en este periodo.", type: 'success' });
        } catch (error) {
            setMessage({ text: "Error al consultar el Kardex", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Sumatorias estilo Access
    const totalEntradas = datos.reduce((sum, row) => sum + Number(row.cantidad_entrada || 0), 0);
    const totalSalidas = datos.reduce((sum, row) => sum + Number(row.cantidad_salida || 0), 0);
    const diferencia = totalEntradas - totalSalidas;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <Box sx={{ p: 3, bgcolor: '#fdfdfd', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#777', lineHeight: 1 }}>
                        Tarjeta de Almacén <br /> <span style={{ fontSize: '2rem', color: '#000' }}>KARDEX</span>
                    </Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                
                <Divider sx={{ my: 2, borderBottomWidth: 4, borderColor: '#000' }} />

                {/* ZONA DE FILTROS */}
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2, bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
                    <Grid item xs={12} md={3}>
                        <TextField select fullWidth size="small" label="Sucursal" value={sucursalSel} onChange={(e) => setSucursalSel(e.target.value)}>
                            {sucursales.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.descripcion}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <TextField type="date" fullWidth size="small" label="Del" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} InputLabelProps={{ shrink: true }}/>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <TextField type="date" fullWidth size="small" label="Al" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} InputLabelProps={{ shrink: true }}/>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Button variant="contained" fullWidth onClick={handleConsultar} disabled={loading} sx={{ bgcolor: '#333', color: 'white', fontWeight: 'bold', height: '40px' }}>
                            {loading ? "Buscando..." : "Consultar Kardex"}
                        </Button>
                    </Grid>
                </Grid>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2"><strong>Clave:</strong> {productoForm.clave_prod}</Typography>
                    <Typography variant="body2"><strong>Producto:</strong> {productoForm.descripcion}</Typography>
                </Box>

                {/* TABLA DE MOVIMIENTOS */}
                <TableContainer component={Paper} sx={{ flex: 1, border: '1px solid #ccc', borderRadius: 0, boxShadow: 'none' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Fecha</TableCell>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Folio</TableCell>
                                <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Concepto</TableCell>
                                <TableCell align="right" sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Entrada</TableCell>
                                <TableCell align="right" sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Salida</TableCell>
                                <TableCell align="right" sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Costo</TableCell>
                                <TableCell align="center" sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>Usuario</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Buscando movimientos...</TableCell></TableRow>
                            ) : datos.length > 0 ? (
                                datos.map((row, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.fecha_movto ? String(row.fecha_movto).replace('T', ' ').substring(0, 16) : ''}</TableCell>
                                        <TableCell>{row.folio_movto}</TableCell>
                                        <TableCell>{row.tipo_movimiento}</TableCell>
                                        <TableCell align="right" sx={{ color: 'green', fontWeight: row.cantidad_entrada > 0 ? 'bold' : 'normal' }}>
                                            {Number(row.cantidad_entrada) > 0 ? row.cantidad_entrada : '-'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'red', fontWeight: row.cantidad_salida > 0 ? 'bold' : 'normal' }}>
                                            {Number(row.cantidad_salida) > 0 ? row.cantidad_salida : '-'}
                                        </TableCell>
                                        <TableCell align="right">${Number(row.costo).toFixed(2)}</TableCell>
                                        <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#666' }}>{row.usr}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>Realice una búsqueda para ver los movimientos.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* SUMATORIAS AL ESTILO ACCESS */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around', bgcolor: '#f9f9f9', p: 2, border: '1px solid #ccc' }}>
                    <Box textAlign="center">
                        <Typography variant="caption" color="textSecondary">Total de Entradas:</Typography>
                        <Typography variant="h6" sx={{ color: 'green', fontWeight: 'bold' }}>{totalEntradas.toFixed(2)}</Typography>
                    </Box>
                    <Box textAlign="center">
                        <Typography variant="caption" color="textSecondary">Total de Salidas:</Typography>
                        <Typography variant="h6" sx={{ color: 'red', fontWeight: 'bold' }}>{totalSalidas.toFixed(2)}</Typography>
                    </Box>
                    <Box textAlign="center">
                        <Typography variant="caption" color="textSecondary">Diferencia:</Typography>
                        <Typography variant="h6" sx={{ color: diferencia < 0 ? 'red' : 'black', fontWeight: 'bold' }}>{diferencia.toFixed(2)}</Typography>
                    </Box>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button onClick={onClose} variant="outlined" sx={{ color: '#333', borderColor: '#ccc', px: 4 }}>Cerrar Kardex</Button>
                </Box>
            </Box>
        </Dialog>
    );
};
export default function CatProductos() {
  const { consumoApi } = useConsumoApi();

  // --- ESTADOS ---
  const [rows, setRows] = useState<ProductoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<CatalogoItem[]>([]);
  const [deptos, setDeptos] = useState<CatalogoItem[]>([]);
  const [clases, setClases] = useState<CatalogoItem[]>([]);
  const [marcas, setMarcas] = useState<CatalogoItem[]>([]);
  const [sucursales, setSucursales] = useState<CatalogoItem[]>([]);
  const [proveedores, setProveedores] = useState<CatalogoItem[]>([]);
  const [finalidades, setFinalidades] = useState<CatalogoItem[]>([]);
  
  const [precios, setPrecios] = useState<any[]>([]);
  const [cantidadesDescarga, setCantidadesDescarga] = useState<any[]>([]);

  const [deptosModal, setDeptosModal] = useState<CatalogoItem[]>([]);
  const [clasesModal, setClasesModal] = useState<CatalogoItem[]>([]);
  const [marcasFamRaw, setMarcasFamRaw] = useState<MarcaFamiliaRel[]>([]);
  const [marcasUnicasModal, setMarcasUnicasModal] = useState<{id: number, desc: string}[]>([]);
  const [familiasFiltradasModal, setFamiliasFiltradasModal] = useState<MarcaFamiliaRel[]>([]);

  const [loadingDeptos, setLoadingDeptos] = useState(false);
  const [loadingClases, setLoadingClases] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [claveSeleccionada, setClaveSeleccionada] = useState<string | null>(null);
  const [productoForm, setProductoForm] = useState<ProductoForm>(initialProductoState);
  const [modalTabValue, setModalTabValue] = useState(0);

// --- ESTADOS PARA EL CLONADOR ---
const [openClonador, setOpenClonador] = useState(false);
const [nuevaClaveClon, setNuevaClaveClon] = useState("");


// --- ESTADOS PARA KIT ---
const [catBusqueda, setCatBusqueda] = useState<any[]>([]); 
const [itemSeleccionado, setItemSeleccionado] = useState<any>(null); 
const [nuevaCantKit, setNuevaCantKit] = useState(1);
const [busquedaClave, setBusquedaClave] = useState(""); // Nueva
const [busquedaDesc, setBusquedaDesc] = useState("");   // Nueva
const [loadingSaveKit, setLoadingSaveKit] = useState(false); // Para el botón guardar

// --- ESTADOS PARA BITÁCORA ---
const [openBitacora, setOpenBitacora] = useState(false);
const [bitacoraDatos, setBitacoraDatos] = useState<any[]>([]);
const [loadingBitacora, setLoadingBitacora] = useState(false);
const [openBitacoraPrecios, setOpenBitacoraPrecios] = useState(false);
const [bitacoraPreciosDatos, setBitacoraPreciosDatos] = useState<any[]>([]);
const [loadingBitacoraPrecios, setLoadingBitacoraPrecios] = useState(false);

// --- ESTADOS PARA PROGRAMACIÓN DE PRECIOS ---
const [openProgPrecio, setOpenProgPrecio] = useState(false);
const [openProgCosto, setOpenProgCosto] = useState(false);
const [openStock, setOpenStock] = useState(false);

const [openKardex, setOpenKardex] = useState(false);

const handleOpenKardex = () => {
    if (!claveSeleccionada) {
        alert("Primero debe seleccionar un producto.");
        return;
    }
    setOpenKardex(true);
};

const [openInfoStock, setOpenInfoStock] = useState(false);

const handleOpenInfoStock = () => {
    if (!claveSeleccionada) {
        alert("Primero debe seleccionar o guardar un producto.");
        return;
    }
    setOpenInfoStock(true);
};

const [openSustitutos, setOpenSustitutos] = useState(false);

const [openProveedores, setOpenProveedores] = useState(false);

const handleOpenProveedores = () => {
    if (!claveSeleccionada) {
        alert("Primero debe seleccionar o guardar un producto.");
        return;
    }
    setOpenProveedores(true);
};

const [openAnalisis, setOpenAnalisis] = useState(false);

const [openReasignacionMasiva, setOpenReasignacionMasiva] = useState(false);

const [openVentasComparativas, setOpenVentasComparativas] = useState(false);


const handleSaveKit = async () => {
    if (!claveSeleccionada) return;
    if (componentesKit.length === 0) {
        alert("El kit debe tener al menos un componente.");
        return;
    }

    setLoadingSaveKit(true);
    try {
        // ACTUALIZADO: Usamos el nombre exacto de la columna en la BD
        const componentesFinales = componentesKit.map(c => ({
            clave_prod: String(c.clave),
            cantidad: Number(c.cantidad),
            costo_unitario: Number(c.costo_sin_iva || 0), 
            costo_unitario_iva: Number(c.costo_iva || 0)  // <--- Corregido aquí
        }));

        const res = await consumoApi.post(
            `/api/CatProductosC/sp_bw_cat_producto_kit_save?clave_kit=${claveSeleccionada}`, 
            componentesFinales
        );

        if (res.status === 200) {
            setMessage({ text: "✅ Composición del Kit guardada exitosamente", type: 'success' });
            setOpenKit(false); 
        }
    } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.mensaje || "Error al guardar el Kit";
        setMessage({ text: msg, type: 'error' });
    } finally {
        setLoadingSaveKit(false);
    }
};


// Estados para el Modal de Componentes KIT
const [openKit, setOpenKit] = useState(false);
const [componentesKit, setComponentesKit] = useState<any[]>([]);
const [loadingKit, setLoadingKit] = useState(false);

const handleAddSelectedProduct = () => {
    if (!itemSeleccionado) return;

    // Evitar duplicados en el kit actual
    if (componentesKit.some(c => c.clave === itemSeleccionado.clave)) {
        alert("Este producto ya está en la lista.");
        return;
    }

    const nuevoComponente = {
        id: itemSeleccionado.clave,
        clave: itemSeleccionado.clave,
        descripcion: itemSeleccionado.descripcion1, // Nombre que viene del nuevo SP
        cantidad: nuevaCantKit,
        costo_iva: Number(itemSeleccionado.costo_iva) || 0,
        costo_sin_iva: Number(itemSeleccionado.costo_sin_iva) || 0
    };

    setComponentesKit([...componentesKit, nuevoComponente]);
    
    // Limpiar para la siguiente captura
    setItemSeleccionado(null);
    setNuevaCantKit(1);
};

const handleOpenKit = async () => {
    if (!productoForm.es_kit) {
        alert("Esta clave no está configurada como Kit. Verifique!");
        return;
    }

    const sucursalId = getSucursalUsuario();
    if (sucursalId === 0) {
        alert("Error: No se detectó sucursal activa.");
        return;
    }

    setOpenKit(true);
    setLoadingKit(true);
    
    // Limpieza preventiva
    setItemSeleccionado(null);
    setBusquedaClave("");
    setBusquedaDesc("");

    try {
        // 1. Cargar componentes que ya tiene guardados el Kit
        const resComp = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_kit_sel', { 
            params: { clave_kit: claveSeleccionada, sucursal: sucursalId } 
        });
        setComponentesKit(Array.isArray(resComp.data) ? resComp.data : []);

        // 2. Cargar el catálogo general para los Autocompletes
        const resCat = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_busqueda_autocomplete', { 
            params: { sucursal: sucursalId } 
        });
        setCatBusqueda(resCat.data || []);

    } catch (error) {
        console.error(error);
        setMessage({ text: "Error al cargar datos del Kit", type: 'error' });
    } finally {
        setLoadingKit(false);
    }
};


// Función para abrir y cargar la Bitácora
const handleOpenBitacora = async () => {
    if (!claveSeleccionada) {
        alert("Primero debe seleccionar un producto guardado.");
        return;
    }
    
    setOpenBitacora(true);
    setLoadingBitacora(true);
    try {
        const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_bitacora_sel', { 
            params: { clave: claveSeleccionada } 
        });
        setBitacoraDatos(res.data || []);
    } catch (error) {
        console.error(error);
        setMessage({ text: "Error al cargar la bitácora histórica", type: 'error' });
    } finally {
        setLoadingBitacora(false);
    }
};

const handleOpenBitacoraPrecios = async () => {
    if (!claveSeleccionada) {
        alert("Primero debe seleccionar un producto.");
        return;
    }
    
    setOpenBitacoraPrecios(true);
    setLoadingBitacoraPrecios(true);
    try {
        const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_bitacora_precios_sel', { 
            params: { clave: claveSeleccionada } 
        });
        setBitacoraPreciosDatos(res.data || []);
    } catch (error) {
        console.error(error);
        setMessage({ text: "Error al cargar la bitácora de precios", type: 'error' });
    } finally {
        setLoadingBitacoraPrecios(false);
    }
};

const handleOpenStock = () => {
    if (!claveSeleccionada) {
        alert("Primero debe seleccionar o guardar un producto.");
        return;
    }
    setOpenStock(true);
};

  // --- LÓGICA ---
  const getSucursalUsuario = () => {
    try {
        const tokenData = localStorage.getItem('token');
        if (tokenData) {
            const userData = JSON.parse(tokenData);
            return Number(userData.claveDepartamento) || 0;
        }
    } catch (error) { console.error(error); }
    return 0; 
  };

  useEffect(() => { fetchCatalogos(); }, []);

  const fetchCatalogos = async () => {
    try {
      const [areasRes, marcasRes, marcasFamRes, sucursalesRes, provRes, finRes] = await Promise.all([
        consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_areas'),
        consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_marcas'),
        consumoApi.get('/api/CatProductosC/sp_bw_cat_marcasfamilias_sel'),
        consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_sucursales'),
        consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_proveedores'), 
        consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_finalidades')
      ]);
      setAreas(areasRes.data);
      setMarcas(marcasRes.data);
      setMarcasFamRaw(marcasFamRes.data);
      setSucursales(sucursalesRes.data || []);
      setProveedores(provRes.data);
      setFinalidades(finRes.data);

      const marcasMap = new Map();
      marcasFamRes.data.forEach((item: MarcaFamiliaRel) => {
        if (!marcasMap.has(item.id_marca)) marcasMap.set(item.id_marca, item.marca_desc);
      });
      setMarcasUnicasModal(Array.from(marcasMap, ([id, desc]) => ({ id, desc })));

      fetchDeptos('%'); fetchClases('%', '%');
    } catch (error) { setMessage({ text: 'Error al cargar filtros', type: 'error' }); }
  };

  const fetchDeptos = async (areaId: string) => {
    setLoadingDeptos(true);
    try {
        const response = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_deptos', { params: { area: areaId || '%' }});
        setDeptos(response.data);
    } catch (error) { console.error(error); } finally { setLoadingDeptos(false); }
  };

  const fetchClases = async (areaId: string, deptoId: string) => {
    setLoadingClases(true);
    try {
        const response = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_clases', { params: { area: areaId || '%', depto: deptoId || '%' } });
        setClases(response.data);
    } catch (error) { console.error(error); } finally { setLoadingClases(false); }
  };

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const sucursal = getSucursalUsuario();
      if (sucursal === 0) { setLoading(false); return; }

      const params = {
        area: formData.area || '%', depto: formData.depto || '%', clase: formData.clase || '%',
        marca: formData.marca || '%', descripcion: formData.descripcion || null,
        sucursal: sucursal, obsoleto: formData.incluir_obsoletos
      };

      const response = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_productos_sel', { params, timeout: 120000 });
      const data = response.data;
      
      if (!Array.isArray(data)) { setRows([]); setLoading(false); return; }

      const rowsMapped: ProductoRow[] = data.map((item: any) => ({
        id: item.id, clave: item.Clave || '', descripcion: item.descripcion || item.Descripcion || '', marca: item.Marca || '',
        ex: Number(item.Ex) || 0, costo: Number(item.Costo) || 0, precio: Number(item.Precio) || 0,
        margen: Number(item.Margen) || 0, iva: Number(item.IVA) || 0, area: item.Area || '', 
        depto: item.Depto || '', clase: item.Clase || '', inv: item.INV ?? false, obs: item.OBS ?? false,
        cont: item.CONT ?? false, prom: item.PROM ?? false, kit: item.KIT ?? false, ins: item.INS ?? false,
        serv: item.SERV ?? false, prod: item.PROD ?? false, prod_libre: item.PROD_LIBRE ?? false,

descripcion1: item.descripcion1 || '',
        sucursal_origen: item.sucursal_origen || '',
        tasa_iva: Number(item.tasa_iva) || 0,
        d_depto: item.d_depto || '',
        d_clase: item.d_clase || '',
        costo_unitario: Number(item.costo_unitario) || 0,
        costo_c_iva: Number(item.costo_c_iva) || 0,
        desc_linea_comercial: item.desc_linea_comercial || '',
        nombre_comprador: item.nombre_comprador || '',
        mueble: item.mueble || '',
        tramo: item.tramo || '',
        nivel: item.nivel || '',
        finalidad: item.finalidad || '',
        marcaFam1: item.marcaFam1 || '',
        marcaFam2: item.marcaFam2 || '',
        clave_prov: item.clave_prov || '',
        clave_sas: item.clave_sas || ''
      }));

      setRows(rowsMapped); setMessage(null);
    } catch (error: any) {
      if (error.code !== 'ECONNABORTED' && !error.message?.includes('canceled')) {
         setMessage({ text: 'Error al cargar productos.', type: 'error' });
      }
    } finally { setLoading(false); }
  };

  const handleApplyFilters = () => { setSearchPerformed(true); setPaginationModel(prev => ({ ...prev, page: 0 })); fetchProductos(); };

  const handleInputChange = (e: any) => {
    const { name, value, checked, type } = e.target;
    if (name === 'area') {
        fetchDeptos(value); fetchClases(value, '%');
        setFormData(prev => ({ ...prev, [name]: value, depto: '%', clase: '%' }));
    } else if (name === 'depto') {
        fetchClases(formData.area, value);
        setFormData(prev => ({ ...prev, [name]: value, clase: '%' }));
    } else {
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleOpenAdd = () => { 
    setClaveSeleccionada(null); 
    setProductoForm(initialProductoState);
    setDeptosModal([]);
    setClasesModal([]);
    setFamiliasFiltradasModal([]);
    setModalTabValue(0);
    setPrecios([]);
    setCantidadesDescarga([]);
    setOpenModal(true); 
  };
  
const handleOpenEdit = async (row: ProductoRow) => {
    setLoading(true); // Puedes usar el loading del grid o uno local
    try {
        // 1. Pedir el detalle completo a la API
        const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_detalle', { 
            params: { clave: row.clave } 
        });
        const d = res.data; // Los datos completos de la tabla


        const resPrecios = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_precios', { 
            params: { clave: row.clave } 
        });
        setPrecios(resPrecios.data || []);

        const resCant = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_cantidades', { 
            params: { clave: row.clave } 
        });
        setCantidadesDescarga(resCant.data || []);


        setClaveSeleccionada(d.clave_prod);

        // 2. Cargar catálogos dependientes (Deptos, Clases, Familias)
        // Esto asegura que los selects muestren la descripción y no el código
        const [resDep, resCla] = await Promise.all([
            consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_deptos', { params: { area: d.area } }),
            consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_clases', { params: { area: d.area, depto: d.depto } })
        ]);
        
        setDeptosModal(resDep.data);
        setClasesModal(resCla.data);

        // Filtrar familias para la marca actual
        const marcaRel = marcasUnicasModal.find(m => m.desc === d.marca || String(m.id) === String(d.marca));
        if (marcaRel) {
            setFamiliasFiltradasModal(marcasFamRaw.filter(m => String(m.id_marca) === String(marcaRel.id)));
        }

        // 3. Llenar el formulario con los 41 campos del objeto 'd'
        setProductoForm({
            ...initialProductoState,
            clave_prod: d.clave_prod,
            descripcion: d.descripcion,
            descripcion_corta: d.descripcion_corta,
            marca: marcaRel ? marcaRel.id : d.marca,
            familia: d.marcaFam1,
            area: d.area,
            depto: d.depto,
            clase: d.clase,
            observacion: d.observacion,
            costo_sin_iva: d.costo,
            tasa_iva: d.tasa_iva,
            unidad_paq: d.unidad_paq,
            sucursal_origen: d.sucursal_origen,
            comision: d.comision,
            finalidad: d.finalidad,
            unidad_paq_traspaso: d.unidad_paq_traspaso,
            en_promocion: !!d.promocion,
            precio_promocion: d.precio_promocion,
            fecha_inicio_promo: d.fecha_inicio?.split('T')[0] || '',
            fecha_final_promo: d.fecha_final?.split('T')[0] || '',
            inventariable: !!d.inventariable,
            controlado: !!d.controlado,
            obsoleto: !!d.obsoleto,
            fraccionable: !!d.es_fraccion,
            es_insumo: !!d.es_insumo,
            es_servicio: !!d.es_servicio,
            es_producto: !!d.es_producto,
            es_kit: !!d.es_kit,
            producto_libre: !!d.productoLibre,
            entrega_directa: !!d.entregaDirecta
        });

        setModalTabValue(0);
        setOpenModal(true);
    } catch (error) {
        console.error(error);
        setMessage({ text: "Error al cargar el detalle del producto", type: "error" });
    } finally {
        setLoading(false);
    }
};
  
  const handleCloseModal = () => { 
    setOpenModal(false); 
    setClaveSeleccionada(null); 
    setProductoForm(initialProductoState);
    setPrecios([]);
    setCantidadesDescarga([]);
    if (searchPerformed) fetchProductos(); 
  };

// 1. Esta función solo abre el modal
const handleOpenClonador = () => {
    if (!claveSeleccionada) {
        alert("Primero debe seleccionar un producto guardado.");
        return;
    }
    setNuevaClaveClon(""); // Limpia la caja de texto
    setOpenClonador(true);
};

// 2. Esta función se ejecuta al darle "Confirmar" dentro del modal
const handleEjecutarClon = async () => {
    if (!nuevaClaveClon || nuevaClaveClon.trim() === "") {
        alert("Por favor, ingrese la nueva clave para el clon.");
        return;
    }

    try {
        setLoading(true);
        const res = await consumoApi.post('/api/CatProductosC/generar_clon', null, {
            params: {
                claveOriginal: claveSeleccionada,
                nuevaClave: nuevaClaveClon.trim()
            }
        });

        if (res.status === 200) {
            setMessage({ text: `✅ ${res.data.mensaje}: ${nuevaClaveClon}`, type: 'success' });
            
            // Cerramos ambos modales y recargamos
            setOpenClonador(false);
            handleCloseModal(); 
            fetchProductos();
        }
    } catch (error: any) {
        const errorMsg = error.response?.data?.mensaje || "Error inesperado al clonar";
        setMessage({ text: `❌ ${errorMsg}`, type: 'error' });
    } finally {
        setLoading(false);
    }
};

// --- LÓGICA DE SALIDA A EXCEL CON ESTILOS ---
  const handleExportExcel = async () => {
    if (rows.length === 0) {
      setMessage({ text: "No hay datos para exportar. Primero realice una consulta.", type: 'error' });
      return;
    }

    try {
      setMessage({ text: "⏳ Generando archivo Excel...", type: 'success' });
      
      // ⚠️ CAMBIO CLAVE: Cargamos la librería que sí soporta colores
      const XLSX = await import('xlsx-js-style');

      // 1. Mapeamos TODAS las columnas que pediste
      const worksheetData = rows.map(row => ({
        "EXISTENCIA": row.ex,
        "ES KIT": row.kit ? "SÍ" : "NO",
        "MARCA": row.marca,
        "CLAVE PROD": row.clave,
        "DESCRIPCION 1": row.descripcion1 || row.descripcion,
        "SUCURSAL ORIGEN": row.sucursal_origen,
        "TASA IVA": row.tasa_iva || row.iva,
        "AREA": row.area,
        "DESCRIPCION": row.descripcion,
        "DEPTO": row.depto,
        "DESC DEPTO": row.d_depto,
        "CLASE": row.clase,
        "DESC CLASE": row.d_clase,
        "INVENTARIABLE": row.inv ? "SÍ" : "NO",
        "CONTROLADO": row.cont ? "SÍ" : "NO",
        "OBSOLETO": row.obs ? "SÍ" : "NO",
        "PROMOCION": row.prom ? "SÍ" : "NO",
        "COSTO UNITARIO": row.costo_unitario || row.costo,
        "PRECIO": row.precio,
        "MARGEN %": `${(row.margen * 100).toFixed(2)}%`,
        "COSTO C/IVA": row.costo_c_iva,
        "LINEA COMERCIAL": row.desc_linea_comercial,
        "COMPRADOR": row.nombre_comprador,
        "MUEBLE": row.mueble,
        "TRAMO": row.tramo,
        "NIVEL": row.nivel,
        "ES INSUMO": row.ins ? "SÍ" : "NO",
        "ES SERVICIO": row.serv ? "SÍ" : "NO",
        "ES PRODUCTO": row.prod ? "SÍ" : "NO",
        "FINALIDAD": row.finalidad,
        "MARCA FAM 1": row.marcaFam1,
        "MARCA FAM 2": row.marcaFam2,
        "CLAVE PROV": row.clave_prov,
        "CLAVE SAS": row.clave_sas,
        "PROD LIBRE": row.prod_libre ? "SÍ" : "NO"
      }));

      // 2. Creamos y configuramos el Excel
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // --- 🎨 MAGIA PARA EL ENCABEZADO GRIS ---
      // Obtenemos cuántas columnas y filas tiene el Excel generado
      const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1");
      
      // Recorremos solo la fila 0 (el encabezado) celda por celda
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[address]) continue;
        
        // Le inyectamos el estilo de fondo gris y texto en negrita
        worksheet[address].s = {
          fill: {
            patternType: "solid",
            fgColor: { rgb: "D9D9D9" } // Código HEX del gris claro
          },
          font: {
            bold: true,
            color: { rgb: "000000" } // Negro
          }
        };
      }
      // ----------------------------------------

      // Ajustar el ancho de las columnas automáticamente para que no se vea amontonado
      const wscols = Object.keys(worksheetData[0]).map(key => ({ wch: Math.max(key.length + 2, 12) }));
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Catálogo");

      // 3. Descargamos el archivo con fecha
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Catalogo_Productos_${fecha}.xlsx`);

      setMessage({ text: "✅ Archivo Excel descargado con éxito", type: 'success' });
    } catch (error) {
      console.error(error);
      setMessage({ text: "Error al generar el Excel. Asegúrese de haber instalado xlsx-js-style", type: 'error' });
    }
  };

  const handleDelete = async (id: string) => { if (window.confirm(`¿Eliminar?`)) setMessage({ text: 'Desarrollo', type: 'success' }); };


const calculateCosts = (name: string, val: number) => {
    const tasa = productoForm.tasa_iva || 0.16;
    const paq = productoForm.unidad_paq || 1;
    let newForm = { ...productoForm, [name]: val };
    let valorIva = val;if (name === 'tasa_iva' && val > 1) {valorIva = val / 100;}

    switch (name) {
      case 'costo_sin_iva':
        newForm.costo_unitario = val / paq;
        newForm.costo_promedio = newForm.costo_unitario;
        newForm.costo_con_iva = val * (1 + tasa);
        newForm.costo_unitario_iva = newForm.costo_unitario * (1 + tasa);
        break;

      case 'costo_con_iva':
        newForm.costo_sin_iva = val / (1 + tasa);
        newForm.costo_unitario_iva = val / paq;
        newForm.costo_unitario = newForm.costo_unitario_iva / (1 + tasa);
        newForm.costo_promedio = newForm.costo_unitario;
        break;

      case 'costo_unitario':
        newForm.costo_sin_iva = val * paq;
        newForm.costo_con_iva = newForm.costo_sin_iva * (1 + tasa);
        newForm.costo_unitario_iva = val * (1 + tasa);
        newForm.costo_promedio = val;
        break;

      case 'costo_unitario_iva':
        newForm.costo_unitario = val / (1 + tasa);
        newForm.costo_sin_iva = (val / (1 + tasa)) * paq;
        newForm.costo_con_iva = val * paq;
        newForm.costo_promedio = newForm.costo_unitario;
        break;

      case 'unidad_paq':
        if (val <= 0) return; // Evitar división por cero
        newForm.costo_unitario = productoForm.costo_sin_iva / val;
        newForm.costo_unitario_iva = productoForm.costo_con_iva / val;
        break;

          case 'tasa_iva':
      newForm.costo_con_iva = productoForm.costo_sin_iva * (1 + val);
      newForm.costo_unitario_iva = productoForm.costo_unitario * (1 + val);
      break;

      case 'unidad_paq_traspaso':
      // Lógica exacta de Access: Round((Valor + 0.5) / 2, 0)
      newForm.dias_rotacion = Math.round((Number(val) + 0.5) / 2);
      break;
    }
    setProductoForm(newForm);
  };
const handleProductoChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    // Lista de campos que disparan cálculos automáticos
    const costFields = ['costo_sin_iva', 'costo_con_iva', 'costo_unitario', 'costo_unitario_iva', 'unidad_paq', 'tasa_iva', 'unidad_paq_traspaso'];

    if (costFields.includes(name)) {
      calculateCosts(name, Number(val));
    } 
    else if (name === 'area') {
      consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_deptos', { params: { area: val } })
        .then(res => setDeptosModal(res.data));
      setProductoForm(prev => ({ ...prev, area: val, depto: '', clase: '' }));
    } 
    else if (name === 'depto') {
      consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_clases', { params: { area: productoForm.area, depto: val } })
        .then(res => setClasesModal(res.data));
      setProductoForm(prev => ({ ...prev, depto: val, clase: '' }));
    } 
    else if (name === 'marca') {
      const filtradas = marcasFamRaw.filter(m => String(m.id_marca) === String(val));
      setFamiliasFiltradasModal(filtradas);
      setProductoForm(prev => ({ ...prev, marca: val, familia: '' }));
    } 
    else {
      setProductoForm(prev => ({ ...prev, [name]: val }));
    }
  };

const handleSaveProducto = async () => {
    // 1. Validaciones básicas
    if (!productoForm.clave_prod || !productoForm.descripcion || !productoForm.familia) {
        setMessage({ text: "Clave, descripción y familia son obligatorios", type: 'error' });
        return;
    }

    try {
        const marcaRel = marcasUnicasModal.find(m => String(m.id) === String(productoForm.marca));
        
        // 2. Mapeo de parámetros (asegúrate de incluir los nuevos campos que agregamos al SP)
        const paramsEnvio = {
            clave_prod: productoForm.clave_prod,
            descripcion: productoForm.descripcion,
            descripcion_corta: productoForm.descripcion_corta || productoForm.descripcion.substring(0, 20),
            marca: marcaRel ? marcaRel.desc : '',
            marcaFam1: Number(productoForm.familia),
            area: productoForm.area,
            depto: productoForm.depto,
            clase: productoForm.clase,
            observacion: productoForm.observacion || '',

            costo: Number(productoForm.costo_sin_iva),
            tasa_iva: Number(productoForm.tasa_iva),
            unidad_paq: Number(productoForm.unidad_paq),
            comision: Number(productoForm.comision) || 0,
            finalidad: Number(productoForm.finalidad) || 0,
            sucursal_origen: Number(productoForm.sucursal_origen) || 0,

            unidad_paq_traspaso: Number(productoForm.unidad_paq_traspaso) || 1,
            clave_sas: productoForm.clave_sas || productoForm.clave_prod,
            clave_prov: productoForm.clave_proveedor || '',

            inventariable: productoForm.inventariable,
            controlado: productoForm.controlado,
            obsoleto: productoForm.obsoleto,
            es_fraccion: productoForm.fraccionable,
            es_kit: productoForm.es_kit,
            es_insumo: productoForm.es_insumo,
            es_servicio: productoForm.es_servicio,
            es_producto: productoForm.es_producto,
            productoLibre: productoForm.producto_libre,
            entregaDirecta: productoForm.entrega_directa,
            version: productoForm.version || '',

            promocion: productoForm.en_promocion,
            precio_promocion: Number(productoForm.precio_promocion) || 0,
            fecha_inicio: productoForm.en_promocion ? productoForm.fecha_inicio_promo : null,
            fecha_final: productoForm.en_promocion ? productoForm.fecha_final_promo : null
        };

        // 3. LÓGICA DE DECISIÓN DE URL
        // Si claveSeleccionada tiene valor, estamos EDITANDO
        const url = claveSeleccionada 
            ? '/api/CatProductosC/sp_bw_cat_combo_productos_upd' 
            : '/api/CatProductosC/sp_bw_cat_combo_productos_inse';

        const response = await consumoApi.post(url, null, { params: paramsEnvio });

        if (response.status === 200) {
            setMessage({ 
                text: claveSeleccionada ? "✅ Producto actualizado correctamente" : "✅ Producto registrado con éxito", 
                type: 'success' 
            });

            handleCloseModal();
            fetchProductos();
        }
    } catch (error: any) {
        console.error(error);
        const errorMsg = error.response?.data?.mensaje || "Error al procesar el registro";
        setMessage({ text: errorMsg, type: 'error' });
    }
};


  const columns = useMemo<GridColDef[]>(() => [
    {
      field: 'acciones', headerName: 'Acci.', width: 100, sortable: false, filterable: false, headerAlign: 'center', align: 'center',       
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(params.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
    { field: 'clave', headerName: 'Clave', width: 120 },
    { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 200 },
    { field: 'marca', headerName: 'Marca', width: 150 },
    { field: 'ex', headerName: 'Ex', width: 80, type: 'number' },
    { field: 'costo', headerName: 'Costo', width: 100, type: 'number', valueFormatter: (v: any) => v == null ? '$0.00' : `$${Number(v).toFixed(2)}` },
    { field: 'precio', headerName: 'Precio', width: 100, type: 'number', valueFormatter: (v: any) => v == null ? '$0.00' : `$${Number(v).toFixed(2)}` },
{field: 'margen', headerName: 'Margen', width: 100, type: 'number', valueFormatter: (params: any) => {if (params == null) return '0.00%';
// Multiplicamos por 100 para convertir el decimal a porcentaje entero/decimal
const valorPorcentaje = Number(params) * 100;
return `${valorPorcentaje.toFixed(2)}%`;
} 
},
    { field: 'iva', headerName: 'IVA', width: 80, type: 'number' },
    // --- BUSCA ESTO Y REEMPLÁZALO ---

{ field: 'area', headerName: 'Área', width: 150 },
{ field: 'depto', headerName: 'Depto.', width: 150 },
{ field: 'clase', headerName: 'Clase', width: 150 },

// --- BORRA LAS LÍNEAS QUE DECÍAN valueFormatter: (v: any) => areas.find(...) ---
    { field: 'inv', headerName: 'INV', width: 60, type: 'boolean' },
    { field: 'obs', headerName: 'OBS', width: 60, type: 'boolean' },
    { field: 'cont', headerName: 'CONT', width: 60, type: 'boolean' },
    { field: 'prom', headerName: 'PROM', width: 60, type: 'boolean' },
    { field: 'kit', headerName: 'KIT', width: 60, type: 'boolean' },
    { field: 'ins', headerName: 'INS', width: 60, type: 'boolean' },
    { field: 'serv', headerName: 'SERV', width: 60, type: 'boolean' },
    { field: 'prod', headerName: 'PROD', width: 60, type: 'boolean' },
    { field: 'prod_libre', headerName: 'PROD. LIBRE', width: 100, type: 'boolean' },
  ], [areas, deptos, clases]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5', overflow: 'hidden' }}>
      
      <Box sx={{ height: 'auto', flexShrink: 0, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}>
            <Box sx={{ width: 28, height: 28, backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem' }}>📦</Box>
            CATÁLOGO DE PRODUCTOS
          </Typography>
        </Box>

        <Paper sx={{ p: 1.5, backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={4} md={4} sx={gridItemStyle}>
              <TextField {...selectProps} select label="Área" name="area" value={formData.area} onChange={handleInputChange}>
                {areas.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} md={4} sx={gridItemStyle}>
              <TextField {...selectProps} select label={loadingDeptos ? "..." : "Depto"} name="depto" value={formData.depto} onChange={handleInputChange} disabled={loadingDeptos}>
                {deptos.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} md={4} sx={gridItemStyle}>
              <TextField {...selectProps} select label={loadingClases ? "..." : "Clase"} name="clase" value={formData.clase} onChange={handleInputChange} disabled={loadingClases}>
                {clases.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={gridItemStyle}>
              <TextField {...selectProps} select label="Marca" name="marca" value={formData.marca} onChange={handleInputChange}>
                {marcas.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={12} md={4} sx={gridItemStyle}>
               <TextField {...commonProps} label='Descripción' name="descripcion" value={formData.descripcion || ''} onChange={handleInputChange} onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}/>
            </Grid>
            <Grid item xs={6} sm={6} md={2} sx={gridItemStyle}>
               <Box sx={{ display: 'flex', alignItems: 'center', height: '40px', bgcolor: '#f8f9fa', borderRadius: '8px', px: 1, border: '1px solid #e0e0e0', width: '100%', overflow: 'hidden' }}>
                  <Checkbox size="small" checked={formData.incluir_obsoletos} onChange={handleInputChange} name="incluir_obsoletos" />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Obsoletos</Typography>
               </Box>
            </Grid>
            <Grid item xs={6} sm={6} md={3} sx={gridItemStyle}>
              <Button variant="contained" onClick={handleApplyFilters} fullWidth sx={{ bgcolor: '#333', color: 'white', borderRadius: '8px', height: '40px', fontWeight: 'bold' }}>CONSULTAR</Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, p: 2, pt: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ flex: 1, width: '100%', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', bgcolor: 'white', mb: 2 }}>
          <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} loading={loading} paginationModel={paginationModel} onPaginationModelChange={setPaginationModel} pageSizeOptions={[10, 20, 30, 50, 100]} slots={{ toolbar: GridToolbar, pagination: CustomPagination }} slotProps={{ toolbar: { showQuickFilter: true } }} sx={{ border: 'none', height: '100%' }} />
        </Paper>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
           <Button variant="contained" onClick={handleOpenAdd} sx={{ backgroundColor: '#333333', color: 'white', borderRadius: '8px', fontWeight: 'bold', padding: '10px 24px' }}>+ ALTA DE CLAVES</Button>
            <Button 
             variant="contained" 
             onClick={() => setOpenReasignacionMasiva(true)}
             disabled={rows.length === 0}
             sx={{ backgroundColor: '#d32f2f', color: 'white', borderRadius: '8px', fontWeight: 'bold', padding: '10px 24px', '&:hover': { backgroundColor: '#b71c1c' } }}
           >
             🔄 REASIGNAR FILTRADOS
           </Button>
           <Button 
             variant="contained" 
             onClick={() => setOpenAnalisis(true)}
             sx={{ backgroundColor: '#1976d2', color: 'white', borderRadius: '8px', fontWeight: 'bold', padding: '10px 24px', '&:hover': { backgroundColor: '#115293' } }}
           >
             📈 REPORTE POR CLAVE
           </Button>
<Button 
             variant="contained" 
             onClick={handleExportExcel}
             sx={{ backgroundColor: '#2e7d32', color: 'white', borderRadius: '8px', fontWeight: 'bold', padding: '10px 24px', '&:hover': { backgroundColor: '#1b5e20' } }}
           >
             📊 SALIDA EXCEL
           </Button>
        </Box>
      </Box>

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="lg" fullWidth TransitionComponent={Transition}>
        <Box sx={{ bgcolor: '#f5f5f5', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        
          <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 0.5 }}>{claveSeleccionada ? `Editar Producto` : 'Nuevo Producto'}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>{claveSeleccionada ? `Clave: ${claveSeleccionada}` : 'Generación de nueva clave'}</Typography>
              </Box>
              <IconButton onClick={handleCloseModal} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}><CloseIcon /></IconButton>
            </Box>
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          </Box>

          <Box sx={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', px: 3, flexShrink: 0 }}>
            <Tabs value={modalTabValue} onChange={(e, v) => setModalTabValue(v)} variant="scrollable" scrollButtons="auto">
              <Tab label="General" />
              <Tab label="Costos y Precios" />
              <Tab label="Logística" />
              <Tab label="Configuracion y Herramientas" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
            {modalTabValue === 0 && (
                <Box sx={modalSectionStyle}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} /> Datos del Producto
                    </Typography>
                    
                    <Grid container spacing={3}>
                        {/* RENGLON 1: CLAVE Y DESCRIPCIONES */}
                        <Grid item xs={12} md={4}>
                            <TextField {...modalCommonProps} label="Clave del Producto" name="clave_prod" value={productoForm.clave_prod} onChange={handleProductoChange} disabled={!!claveSeleccionada} required />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField {...modalCommonProps} label="Descripción Ticket (Corta)" name="descripcion_corta" value={productoForm.descripcion_corta} onChange={handleProductoChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField {...modalCommonProps} label="Descripción Completa" name="descripcion" value={productoForm.descripcion} onChange={handleProductoChange} />
                        </Grid>

                        {/* RENGLON 2: MARCA, FAMILIA Y ÁREA */}
                        <Grid item xs={12} md={4}>
                            <TextField {...modalSelectProps} select label="Marca" name="marca" value={productoForm.marca} onChange={handleProductoChange}>
                                {marcasUnicasModal.map((m) => (<MenuItem key={m.id} value={m.id}>{m.desc}</MenuItem>))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField {...modalSelectProps} select label="Familia" name="familia" value={productoForm.familia} onChange={handleProductoChange} disabled={!productoForm.marca}>
                                {familiasFiltradasModal.length > 0 ? (
                                    familiasFiltradasModal.map((f) => (<MenuItem key={f.id_familia} value={f.id_familia}>{f.familia}</MenuItem>))
                                ) : (
                                    <MenuItem disabled>Seleccione marca primero</MenuItem>
                                )}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField {...modalSelectProps} select label="Área" name="area" value={productoForm.area} onChange={handleProductoChange}>
                                {areas.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                            </TextField>
                        </Grid>

                        {/* RENGLON 3: DEPTO Y CLASE */}
                        <Grid item xs={12} md={4}>
                            <TextField {...modalSelectProps} select label="Departamento" name="depto" value={productoForm.depto} onChange={handleProductoChange} disabled={!productoForm.area}>
                                {deptosModal.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField {...modalSelectProps} select label="Clase" name="clase" value={productoForm.clase} onChange={handleProductoChange} disabled={!productoForm.depto}>
                                {clasesModal.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                            </TextField>
                        </Grid>

                        



                        {/* RENGLON FINAL: OBSERVACIONES (OCUPA TODO EL ANCHO) */}
                        <Grid item xs={12}>
                            <TextField 
                                {...modalCommonProps} 
                                label="Observaciones" 
                                name="observacion" 
                                multiline 
                                rows={2} 
                                value={productoForm.observacion} 
                                onChange={handleProductoChange} 
                                sx={{ ...modalCommonProps.sx, '& .MuiInputBase-root': { height: 'auto', py: 1.5 } }} 
                            />
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* PESTAÑA 1: COSTOS Y PRECIOS */}
{modalTabValue === 1 && (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* CONTENEDOR DE COSTOS */}
        <Box sx={modalSectionStyle}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                Estructura de Costos y Precios
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Unidades x Paquete" name="unidad_paq" type="number" value={productoForm.unidad_paq} onChange={handleProductoChange} /></Grid>
                <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Tasa IVA (Ej. 0.16)" type="number" name="tasa_iva" value={productoForm.tasa_iva} onChange={handleProductoChange}inputProps={{ step: "0.01" }}/></Grid>
                <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Costo sin IVA" type="number" name="costo_sin_iva" value={productoForm.costo_sin_iva} onChange={handleProductoChange} /></Grid>
                <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Costo con IVA" type="number" name="costo_con_iva" value={productoForm.costo_con_iva} onChange={handleProductoChange} /></Grid>
                <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Costo Promedio" type="number" name="costo_promedio" value={productoForm.costo_promedio} onChange={handleProductoChange} /></Grid>
                <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Costo Unitario" type="number" name="costo_unitario" value={productoForm.costo_unitario} onChange={handleProductoChange} /></Grid>
                <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Cto. Unit. c. IVA" type="number" name="costo_unitario_iva" value={productoForm.costo_unitario_iva} onChange={handleProductoChange} /></Grid>
                <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Costo Auto." type="number" name="costo_autorizado" value={productoForm.costo_autorizado} onChange={handleProductoChange} /></Grid>
            </Grid>
        </Box>

        {/* CONTENEDOR DE PROMOCIONES */}
        <Box sx={modalSectionStyle}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, backgroundColor: '#FF9800', borderRadius: 2 }} />
                Promoción Vigente
            </Typography>
            <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                    <Box sx={{ p: 1, border: '1.5px solid #e0e0e0', borderRadius: '8px', textAlign: 'center', bgcolor: productoForm.en_promocion ? '#fffde7' : 'transparent' }}>
                        <FormControlLabel 
                            control={<Checkbox checked={productoForm.en_promocion} name="en_promocion" onChange={handleProductoChange} sx={{ color: '#333' }} />} 
                            label={<Typography variant="body2" fontWeight={600}>Activar Promo</Typography>} 
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                    <TextField {...modalCommonProps} label="Inicio Promo" type="date" name="fecha_inicio_promo" value={productoForm.fecha_inicio_promo} onChange={handleProductoChange} InputLabelProps={{ shrink: true }} disabled={!productoForm.en_promocion} />
                </Grid>
                <Grid item xs={12} md={3}>
                    <TextField {...modalCommonProps} label="Final Promo" type="date" name="fecha_final_promo" value={productoForm.fecha_final_promo} onChange={handleProductoChange} InputLabelProps={{ shrink: true }} disabled={!productoForm.en_promocion} />
                </Grid>
                <Grid item xs={12} md={3}>
                    <TextField {...modalCommonProps} label="Precio Promo" type="number" name="precio_promocion" value={productoForm.precio_promocion} onChange={handleProductoChange} disabled={!productoForm.en_promocion} />
                </Grid>
            </Grid>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* --- NUEVO CONTENEDOR DE LISTA DE PRECIOS --- */}
        <Box sx={modalSectionStyle}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, backgroundColor: '#4caf50', borderRadius: 2 }} />
                Listas de Precios Vinculadas (ERP)
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 300, borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '80px' }}>Lista</TableCell>
                            <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Descripción</TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Precio</TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Margen %</TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Real %</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
    {precios.length > 0 ? (
        precios.map((p, index) => {
            // Extraemos los valores con nombres exactos del SP
            const numLista = p.Lista || p.lista || '';
            const descLista = p["Lista de Precios"] || p["lista de precios"] || '';
            const valPrecio = Number(p.Precio || p.precio) || 0;
            const valMargen = Number(p.Margen || p.margen) || 0;
            const costoUnitario = Number(productoForm.costo_unitario) || 0;
            const tasaIva = Number(productoForm.tasa_iva) || 0;
            const costoConIva = costoUnitario * (1 + tasaIva);
            //real
            let valReal = 0;
            if (costoConIva > 0) {
                valReal = (valPrecio - costoConIva) / costoConIva;
            } else if (valPrecio > 0) {
                valReal = 1; // Si no hay costo pero sí precio, el margen es 100%
            }

            return (
                <TableRow key={index} hover>
                    <TableCell>{numLista}</TableCell>
                    <TableCell>{descLista}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ${valPrecio.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: valMargen < 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>
                        {(valMargen * 100).toFixed(2)}%
                    </TableCell>
                <TableCell align="right" sx={{ 
                        fontWeight: 'bold', 
                        color: valReal < 0 ? '#d32f2f' : '#2e7d32',
                        bgcolor: valReal < 0 ? '#fff5f5' : 'transparent' 
                    }}>
                        {(valReal * 100).toFixed(2)}%
                    </TableCell>
                </TableRow>
            );
        })
    ) : (
        <TableRow>
            <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#999' }}>
                {claveSeleccionada ? "Consultando precios..." : "Las listas de precios se generarán al guardar el producto."}
            </TableCell>
        </TableRow>
    )}
</TableBody>
                </Table>
            </TableContainer>
        </Box>
    </Box>
    </Box>
)}



            {modalTabValue === 2 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Box sx={modalSectionStyle}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} /> Datos Externos
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}><TextField {...modalSelectProps} select label="Proveedor" name="clave_proveedor" value={productoForm.clave_proveedor} onChange={handleProductoChange}>{proveedores.map((p) => (<MenuItem key={p.id} value={p.id}>{p.descripcion}</MenuItem>))}</TextField></Grid>
                                <Grid item xs={12}><TextField {...modalCommonProps} label="Clave SAS" name="clave_sas" value={productoForm.clave_sas} onChange={handleProductoChange} /></Grid>
                                <Grid item xs={12}><TextField {...modalCommonProps} label="Clave SAP" name="clave_sap" value={productoForm.clave_sap} onChange={handleProductoChange} /></Grid> 
                                <Grid item xs={12}>
                <TextField {...modalSelectProps} select label="Finalidad" name="finalidad" value={productoForm.finalidad} onChange={handleProductoChange}>
                  {finalidades.map((f) => (<MenuItem key={f.id} value={f.id}>{f.descripcion}</MenuItem>))}
                </TextField>
              </Grid><Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Comisión (%)" type="number" name="comision" value={productoForm.comision} onChange={handleProductoChange} /></Grid>
                            </Grid>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={modalSectionStyle}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} /> Control Interno
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}><TextField {...modalSelectProps} select label="Sucursal Origen" name="sucursal_origen" value={productoForm.sucursal_origen} onChange={handleProductoChange}>{/* Mapeo dinámico de la API */}{sucursales.map((suc) => (<MenuItem key={suc.id} value={suc.id}>{suc.descripcion}</MenuItem>))}</TextField></Grid>
                                <Grid item xs={6}><TextField {...modalCommonProps} label="Fecha de Alta" value="" disabled /></Grid>
                                <Grid item xs={6}><TextField {...modalCommonProps} label="Última Modificación" value="" disabled /></Grid>
                                <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Unidades Paq. TX" type="number" name="unidad_paq_traspaso" value={productoForm.unidad_paq_traspaso} onChange={handleProductoChange} /></Grid>
                                <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Plan B (Días Rotación)" name="dias_rotacion" value={productoForm.dias_rotacion} disabled sx={{ ...modalCommonProps.sx, '& .MuiInputBase-root': { bgcolor: '#f5f5f5' } }}/></Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
            <Box sx={modalSectionStyle}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 4, height: 20, backgroundColor: '#d32f2f', borderRadius: 2 }} />
                    Cantidades a Descargar
                </Typography>
                
                <TableContainer component={Paper} sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                                    Cantidad
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cantidadesDescarga.length > 0 ? (
                                cantidadesDescarga.map((c, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell align="center" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                            {Number(c.cantidad || c.Cantidad).toFixed(3)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell align="center" sx={{ py: 2, color: '#999', fontSize: '0.8rem' }}>
                                        {claveSeleccionada ? "Sin registros" : "Se definen en el ERP"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Grid>
                </Grid>
            )}

            {/* PESTAÑA 3: CONFIGURACIÓN Y HERRAMIENTAS */}
{modalTabValue === 3 && (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    
    {/* CONTENEDOR 1: BANDERAS (CONFIGURACIÓN) */}
    <Box sx={modalSectionStyle}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} /> 
        Banderas y Permisos
      </Typography>
      <Grid container spacing={2}>
        {[
          { label: "Es Insumo", name: "es_insumo" }, { label: "Es Servicio", name: "es_servicio" },
          { label: "Inventariable", name: "inventariable" }, { label: "Entrega Directa", name: "entrega_directa" },
          { label: "Fraccionable", name: "fraccionable" }, { label: "Obsoleto", name: "obsoleto" },
          { label: "Es Producto", name: "es_producto" }, { label: "Es Kit", name: "es_kit" },
          { label: "Controlado", name: "controlado" }, { label: "Producto Libre", name: "producto_libre" }
        ].map((item) => (
          <Grid item xs={6} sm={4} md={2.4} key={item.name}>
            <Box sx={{ p: 1, border: '1px solid #eee', borderRadius: '8px', height: '100%', display: 'flex', alignItems: 'center', bgcolor: '#fafafa' }}>
              <FormControlLabel 
                control={<Checkbox size="small" checked={(productoForm as any)[item.name]} name={item.name} onChange={handleProductoChange} sx={{ color: '#333' }} />} 
                label={<Typography variant="caption" fontWeight={600}>{item.label}</Typography>} 
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>

{/* CONTENEDOR 2: HERRAMIENTAS (ACCIONES RÁPIDAS) */}
<Box sx={modalSectionStyle}>
  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box sx={{ width: 4, height: 20, backgroundColor: '#1976d2', borderRadius: 2 }} /> 
    Herramientas de Clave
  </Typography>
  <Grid container spacing={1.5}>
    {[
      { label: "Generar Clon", action: handleOpenClonador },
      { label: "Sustitutos", action: () => setOpenSustitutos(true) },
      { label: "Componentes KIT", action: handleOpenKit },
       { label: "Stock", action: handleOpenStock },
        { label: "Bitácora de la clave", action: handleOpenBitacora },
        { label: "Programación Costos", action: () => setOpenProgCosto(true) },
        { label: "Kardex", action: handleOpenKardex },
        { label: "Info stock", action: handleOpenInfoStock },
        { label: "Proveedores", action: handleOpenProveedores },
        { label: "Bitácora Precios", action: handleOpenBitacoraPrecios },
        { label: "Programación Precios", action: () => setOpenProgPrecio(true) },

    ].map((item, index) => (
      <Grid item xs={6} sm={4} md={2.4} key={index}>
        <Button 
          fullWidth 
          variant="outlined" 
          sx={{ 
            color: '#555', 
            borderColor: '#e0e0e0', 
            height: '45px', 
            textTransform: 'none', 
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            '&:hover': { bgcolor: '#f0f7ff', borderColor: '#1976d2', color: '#1976d2' }
          }} 
          onClick={item.action} 
        >
          {item.label}
        </Button>
      </Grid>
    ))}
  </Grid>
</Box>
  </Box>
)}
          </Box>

          <Box sx={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>* Revise los datos antes de guardar</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={handleCloseModal} color="inherit" sx={{ borderRadius: '8px', fontWeight: 600, px: 3, py: 1, backgroundColor: '#e0e0e0' }}>Cancelar</Button>
              <Button onClick={handleSaveProducto} variant="contained" sx={{ borderRadius: '8px', fontWeight: 600, px: 4, py: 1, backgroundColor: '#333333' }}>
                {claveSeleccionada ? 'Actualizar Cambios' : 'Registrar Producto'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>

{/* --- MODAL CLONADOR DE PRODUCTOS --- */}
<Dialog open={openClonador} onClose={() => setOpenClonador(false)} maxWidth="xs" fullWidth>
    <Box sx={{ p: 3, bgcolor: '#fdfdfd', textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
            🧬 Generar Clon
        </Typography>
        
        <Typography variant="body2" sx={{ color: '#555', mb: 3 }}>
            Se creará un producto <strong>idéntico</strong> tomando como base la clave actual: <br/>
            <span style={{ fontWeight: 'bold', color: '#333' }}>{claveSeleccionada}</span>.
        </Typography>

        <TextField 
            fullWidth 
            autoFocus
            label="Escriba la Nueva Clave" 
            variant="outlined" 
            value={nuevaClaveClon}
            onChange={(e) => setNuevaClaveClon(e.target.value)}
            placeholder="Ej. NUEVA-CLAVE-123"
            sx={{ mb: 3 }}
            InputLabelProps={{ shrink: true }}
            onKeyDown={(e) => e.key === 'Enter' && handleEjecutarClon()}
        />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button onClick={() => setOpenClonador(false)} variant="outlined" color="inherit">
                Cancelar
            </Button>
            <Button 
                variant="contained" 
                onClick={handleEjecutarClon}
                disabled={loading || !nuevaClaveClon.trim()}
                sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 'bold' }}
            >
                {loading ? "Clonando..." : "Confirmar Clonación"}
            </Button>
        </Box>
    </Box>
</Dialog>

{/* --- MODAL DE SUSTITUTOS --- */}
<ModalSustitutos 
    open={openSustitutos} 
    onClose={() => setOpenSustitutos(false)} 
    consumoApi={consumoApi} 
    setMessage={setMessage} 
    productoForm={productoForm}
/>

<Dialog open={openKit} onClose={() => setOpenKit(false)} maxWidth="md" fullWidth>
    <Box sx={{ p: 3, bgcolor: '#fff' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0, color: '#333' }}>
                Catálogo de <br /> <span style={{ fontSize: '2.3rem' }}>Descargas - Kits</span>
            </Typography>
            <IconButton onClick={() => setOpenKit(false)}><CloseIcon /></IconButton>
        </Box>
        <Divider sx={{ mb: 2, borderBottomWidth: 4, borderColor: 'black' }} />

        {/* INFO DEL PRODUCTO PADRE */}
        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f9f9f9', borderLeft: '5px solid orange' }}>
            <Typography variant="body1"><strong>Clave KIT:</strong> {productoForm.clave_prod}</Typography>
            <Typography variant="body1"><strong>Descripción:</strong> {productoForm.descripcion}</Typography>
        </Box>

        <TableContainer component={Paper} sx={{ border: '1px solid #000', borderRadius: 0, boxShadow: 'none' }}>
    <Table size="small" stickyHeader>
        {/* CABECERAS: Ya incluye la columna de Costo s/IVA */}
        <TableHead>
            <TableRow sx={{ bgcolor: '#eee' }}>
                <TableCell><strong>Clave</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell align="right"><strong>Cant.</strong></TableCell>
                <TableCell align="right"><strong>Costo c/IVA</strong></TableCell>
                <TableCell align="right"><strong>Costo s/IVA</strong></TableCell>
                <TableCell align="center"><strong>Acción</strong></TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {/* FILA DE CAPTURA DUAL CON FILTRADO EN TIEMPO REAL */}
            <TableRow sx={{ bgcolor: '#fffde7', borderBottom: '2px solid #ccc' }}>
                {/* AUTOCOMPLETE CLAVE */}
                <TableCell sx={{ width: '150px' }}>
                    <Autocomplete
                        options={catBusqueda || []}
                        getOptionLabel={(option) => option?.clave ? String(option.clave) : ""}
                        inputValue={busquedaClave}
                        onInputChange={(e, val) => setBusquedaClave(val || "")}
                        value={itemSeleccionado}
                        onChange={(e, newValue) => {
                            setItemSeleccionado(newValue);
                            setBusquedaClave(newValue?.clave ? String(newValue.clave) : "");
                            setBusquedaDesc(newValue?.descripcion1 || "");
                        }}
                        isOptionEqualToValue={(option, value) => option.clave === value?.clave}
                        filterOptions={(options, { inputValue }) => {
                            const search = String(inputValue || "").toLowerCase().trim();
                            if (!search) return options.slice(0, 50); // Muestra 50 por defecto
                            return options.filter(o => 
                                String(o?.clave || "").toLowerCase().includes(search)
                            ).slice(0, 50); // Filtra en tiempo real mientras escribes
                        }}
                        renderInput={(params) => <TextField {...params} label="Clave" variant="standard" />}
                    />
                </TableCell>

                {/* AUTOCOMPLETE DESCRIPCIÓN */}
                <TableCell sx={{ minWidth: 300 }}>
                    <Autocomplete
                        options={catBusqueda || []}
                        getOptionLabel={(option) => option?.descripcion1 || ""}
                        inputValue={busquedaDesc}
                        onInputChange={(e, val) => setBusquedaDesc(val || "")}
                        value={itemSeleccionado}
                        onChange={(e, newValue) => {
                            setItemSeleccionado(newValue);
                            setBusquedaDesc(newValue?.descripcion1 || "");
                            setBusquedaClave(newValue?.clave ? String(newValue.clave) : "");
                        }}
                        isOptionEqualToValue={(option, value) => option.clave === value?.clave}
                        filterOptions={(options, { inputValue }) => {
                            const search = String(inputValue || "").toLowerCase().trim();
                            if (!search) return options.slice(0, 50); // Muestra 50 por defecto
                            return options.filter(o => 
                                String(o?.descripcion1 || "").toLowerCase().includes(search)
                            ).slice(0, 50); // Filtra en tiempo real mientras escribes
                        }}
                        renderInput={(params) => <TextField {...params} label="Descripción del Componente" variant="standard" />}
                    />
                </TableCell>

                {/* CANTIDAD A DESCONTAR */}
                <TableCell align="right">
                    <TextField 
                        type="number" size="small" variant="standard" 
                        value={nuevaCantKit} onChange={(e) => setNuevaCantKit(Number(e.target.value))}
                        sx={{ width: 60 }}
                    />
                </TableCell>
                
                {/* PREVISUALIZACIÓN DE COSTOS */}
                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    ${itemSeleccionado && itemSeleccionado.costo_iva != null ? Number(itemSeleccionado.costo_iva).toFixed(2) : "0.00"}
                </TableCell>
                <TableCell align="right" sx={{ color: '#666' }}>
                    ${itemSeleccionado && itemSeleccionado.costo_sin_iva != null ? Number(itemSeleccionado.costo_sin_iva).toFixed(2) : "0.00"}
                </TableCell>

                {/* BOTÓN AGREGAR */}
                <TableCell align="center">
                    <Button variant="contained" size="small" onClick={handleAddSelectedProduct} sx={{ bgcolor: '#2e7d32' }}>+</Button>
                </TableCell>
            </TableRow>

            {/* LISTA DE COMPONENTES AGREGADOS */}
            {(componentesKit || []).map((item, idx) => (
                <TableRow key={idx}>
                    <TableCell>{item.clave}</TableCell>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell align="right">{Number(item.cantidad || 0).toFixed(3)}</TableCell>
                    <TableCell align="right">${Number(item.costo_iva || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">${Number(item.costo_sin_iva || 0).toFixed(2)}</TableCell> {/* Celda agregada */}
                    <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => setComponentesKit(componentesKit.filter((_, i) => i !== idx))}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </TableCell>
                </TableRow>
            ))}

            {/* TOTALES FINALES */}
            <TableRow sx={{ bgcolor: '#fff9c4' }}>
                <TableCell colSpan={2} align="right"><strong>TOTALES:</strong></TableCell>
                <TableCell align="right"><strong>{componentesKit.reduce((sum, i) => sum + Number(i.cantidad || 0), 0).toFixed(3)}</strong></TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    ${componentesKit.reduce((sum, i) => sum + (Number(i.costo_iva || 0) * Number(i.cantidad || 0)), 0).toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ${componentesKit.reduce((sum, i) => sum + (Number(i.costo_sin_iva || 0) * Number(i.cantidad || 0)), 0).toFixed(2)}
                </TableCell>
                <TableCell />
            </TableRow>
        </TableBody>
    </Table>
</TableContainer> 

        {/* BOTONES FINALES */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setOpenKit(false)} variant="outlined" color="inherit">Cancelar</Button>
            <Button 
                onClick={handleSaveKit} 
                variant="contained" 
                sx={{ bgcolor: '#2e7d32', color: 'white', fontWeight: 'bold' }}
                disabled={loadingSaveKit}
            >
                {loadingSaveKit ? "Guardando..." : "💾 Guardar Kit"}
            </Button>
        </Box>
    </Box>
</Dialog>

<Dialog open={openBitacora} onClose={() => setOpenBitacora(false)} maxWidth="lg" fullWidth>
    <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                📋 Bitácora de Movimientos (Historial)
            </Typography>
            <IconButton onClick={() => setOpenBitacora(false)}><CloseIcon /></IconButton>
        </Box>
        
        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e3f2fd', borderLeft: '5px solid #1976d2' }}>
            <Typography variant="body2"><strong>Clave:</strong> {productoForm.clave_prod}</Typography>
            <Typography variant="body2"><strong>Descripción Actual:</strong> {productoForm.descripcion}</Typography>
        </Box>

        <Divider sx={{ mb: 2, borderBottomWidth: 2, borderColor: '#ccc' }} />

        {/* Tabla con scroll horizontal habilitado */}
{/* Tabla con scroll horizontal habilitado para ver los 39 campos en el orden de Access */}
        <TableContainer component={Paper} sx={{ maxHeight: 500, border: '1px solid #e0e0e0', boxShadow: 'none', overflowX: 'auto' }}>
            <Table stickyHeader size="small" sx={{ minWidth: 4000 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>ID</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap' }}>FECHA CAMBIO</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>IP</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>ESTATUS</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>CLAVE PROD</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap' }}>FECHA ALTA</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap' }}>FECHA ACTUALIZACION</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', minWidth: 250 }}>DESCRIPCION</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', minWidth: 150 }}>DESCRIPCION CORTA</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>SUCURSAL ORIGEN</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>MARCA</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>AREA</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>DEPTO</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>CLASE</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', minWidth: 200 }}>OBSERVACIONES</TableCell>
                        
                        {/* Checkboxes */}
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>INVENTARIABLE</TableCell>
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>EXCENTOS</TableCell>
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>CONTROLADO</TableCell>
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>ES FRACCION</TableCell>
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>OBSOLETO</TableCell>
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>ES KIT</TableCell>
                        
                        {/* Costos, precios y cantidades */}
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>TASA IVA</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>COSTO</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>COSTO UNITARIO</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>COSTO PROMEDIO</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>COSTO UNITARIO AUTORIZADO</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>UNIDAD PAQ</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>UNIDAD PAQUETE TRASPASO</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>CANTIDAD 1</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>CANTIDAD 2</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>CANTIDAD 3</TableCell>
                        
                        {/* Promociones y otros */}
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>PROMOCION</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>PORCENTAJE PROMOCION</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>PRECIO PROMOCION</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap' }}>FECHA INICIO</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap' }}>FECHA FINAL</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>DIAS ROTACION</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>TIPO COSTEO</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>VERSION</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loadingBitacora ? (
                        <TableRow><TableCell colSpan={39} align="center" sx={{ py: 3 }}>Consultando historial en el servidor...</TableCell></TableRow>
                    ) : bitacoraDatos.length > 0 ? (
                        bitacoraDatos.map((row, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>{row.id}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>
                                    {row.fecha_cambio ? String(row.fecha_cambio).replace('T', ' ').substring(0, 16) : ''}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.85rem' }}>{row.ip}</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: row.estatus === 'BAJA' ? '#d32f2f' : 'inherit' }}>
                                    {row.estatus}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>{row.clave_prod}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {row.fecha_alta ? String(row.fecha_alta).replace('T', ' ').substring(0, 16) : ''}
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {row.fecha_act ? String(row.fecha_act).replace('T', ' ').substring(0, 16) : ''}
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>{row.descripcion}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{row.descripcion_corta}</TableCell>
                                <TableCell>{row.sucursal_origen}</TableCell>
                                <TableCell>{row.marca}</TableCell>
                                <TableCell>{row.area}</TableCell>
                                <TableCell>{row.depto}</TableCell>
                                <TableCell>{row.clase}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem', color: '#666', maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.observacion}</TableCell>

                                {/* Checkboxes */}
                                <TableCell align="center">{row.inventariable ? 'SÍ' : 'NO'}</TableCell>
                                <TableCell align="center">{row.excentos ? 'SÍ' : 'NO'}</TableCell>
                                <TableCell align="center">{row.controlado ? 'SÍ' : 'NO'}</TableCell>
                                <TableCell align="center">{row.es_fraccion ? 'SÍ' : 'NO'}</TableCell>
                                <TableCell align="center" sx={{ color: row.obsoleto ? '#d32f2f' : 'inherit', fontWeight: row.obsoleto ? 'bold' : 'normal' }}>{row.obsoleto ? 'SÍ' : 'NO'}</TableCell>
                                <TableCell align="center">{row.es_kit ? 'SÍ' : 'NO'}</TableCell>

                                {/* Costos, precios y cantidades */}
                                <TableCell align="right">{Number(row.tasa_iva || 0)}</TableCell>
                                <TableCell align="right" sx={{ color: '#666' }}>${Number(row.costo || 0).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 500 }}>${Number(row.costo_unitario || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">${Number(row.costo_promedio || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">${Number(row.costo_unitario_autorizado || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">{row.unidad_paq}</TableCell>
                                <TableCell align="right">{row.unidad_paq_traspaso}</TableCell>
                                <TableCell align="right">{row.cantidad1}</TableCell>
                                <TableCell align="right">{row.cantidad2}</TableCell>
                                <TableCell align="right">{row.cantidad3}</TableCell>

                                {/* Promociones y otros */}
                                <TableCell align="center">{row.promocion ? 'SÍ' : 'NO'}</TableCell>
                                <TableCell align="right">{Number(row.porcentaje_promocion || 0)}%</TableCell>
                                <TableCell align="right" sx={{ color: '#FF9800', fontWeight: 'bold' }}>${Number(row.precio_promocion || 0).toFixed(2)}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{row.fecha_inicio ? String(row.fecha_inicio).split('T')[0] : ''}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{row.fecha_final ? String(row.fecha_final).split('T')[0] : ''}</TableCell>
                                <TableCell>{row.dias_rotacion}</TableCell>
                                <TableCell>{row.tipo_costeo}</TableCell>
                                <TableCell>{row.version}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={39} align="center" sx={{ py: 4, color: '#999' }}>
                                Esta clave no tiene registros históricos en la bitácora.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpenBitacora(false)} variant="contained" sx={{ bgcolor: '#333', color: 'white' }}>
                Cerrar Historial
            </Button>
        </Box>
    </Box>
</Dialog>
{/* --- MODAL DE BITÁCORA DE PRECIOS --- */}
<Dialog open={openBitacoraPrecios} onClose={() => setOpenBitacoraPrecios(false)} maxWidth="md" fullWidth>
    <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                💲 Bitácora de Cambios de Precios
            </Typography>
            <IconButton onClick={() => setOpenBitacoraPrecios(false)}><CloseIcon /></IconButton>
        </Box>
        
        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e8f5e9', borderLeft: '5px solid #4caf50' }}>
            <Typography variant="body2"><strong>Clave:</strong> {productoForm.clave_prod}</Typography>
            <Typography variant="body2"><strong>Descripción:</strong> {productoForm.descripcion}</Typography>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 400, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>ID</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Fecha Cambio</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Estatus</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>IP</TableCell>
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Clave Lista</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Precio</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Margen</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loadingBitacoraPrecios ? (
                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Consultando cambios de precios...</TableCell></TableRow>
                    ) : bitacoraPreciosDatos.length > 0 ? (
                        bitacoraPreciosDatos.map((row, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>{row.id}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>
                                    {row.fecha_cambio ? String(row.fecha_cambio).replace('T', ' ').substring(0, 16) : ''}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: row.estatus === 'Actual' ? '#2e7d32' : '#666' }}>
                                    {row.estatus}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.85rem' }}>{row.ip}</TableCell>
                                <TableCell align="center">{row.clave_lista}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    ${Number(row.precio || 0).toFixed(2)}
                                </TableCell>
                                <TableCell align="right">
                                    {Number(row.margen || 0)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>
                                No hay registro de cambios de precios para esta clave.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpenBitacoraPrecios(false)} variant="contained" sx={{ bgcolor: '#333', color: 'white' }}>
                Cerrar
            </Button>
        </Box>
    </Box>
</Dialog>
{/* --- MODAL DE PROGRAMACIÓN DE PRECIOS --- */}
<ModalProgPrecio 
    open={openProgPrecio} 
    onClose={() => setOpenProgPrecio(false)} 
    consumoApi={consumoApi} 
    setMessage={setMessage} 
    claveSeleccionada={claveSeleccionada}
/>

{/* AGREGAR ESTE NUEVO */}
<ModalProgCosto 
    open={openProgCosto} 
    onClose={() => setOpenProgCosto(false)} 
    consumoApi={consumoApi} 
    setMessage={setMessage} 
    claveSeleccionada={claveSeleccionada}
/>

<ModalStockSucursal 
    open={openStock} 
    onClose={() => setOpenStock(false)} 
    consumoApi={consumoApi} 
    setMessage={setMessage} 
    productoForm={productoForm}
    sucursales={sucursales}
/>

{/* --- MODAL DE REASIGNACIÓN MASIVA --- */}
<ModalReasignacionMasiva 
    open={openReasignacionMasiva} 
    onClose={() => setOpenReasignacionMasiva(false)} 
    consumoApi={consumoApi} 
    setMessage={setMessage} 
    rows={rows} 
    onSuccess={fetchProductos} 
/>

<ModalAnalisisPorClave 
    open={openAnalisis} 
    onClose={() => setOpenAnalisis(false)} 
    onAbrirVentasComparativas={() => setOpenVentasComparativas(true)}
/>

{/* --- MODAL DE FILTROS: VENTAS COMPARATIVAS --- */}
<ModalVentasComparativas
    open={openVentasComparativas}
    onClose={() => setOpenVentasComparativas(false)}
    consumoApi={consumoApi}
    setMessage={setMessage}
/>

<ModalInfoStock 
    open={openInfoStock} 
    onClose={() => setOpenInfoStock(false)} 
    consumoApi={consumoApi} 
    setMessage={setMessage} 
    productoForm={productoForm}
/>
<ModalProveedores 
    open={openProveedores} 
    onClose={() => setOpenProveedores(false)} 
    consumoApi={consumoApi} 
    setMessage={setMessage} 
    productoForm={productoForm}
    proveedores={proveedores}
/>

<ModalKardex 
    open={openKardex} 
    onClose={() => setOpenKardex(false)} 
    consumoApi={consumoApi} 
    setMessage={setMessage} 
    productoForm={productoForm}
    sucursales={sucursales}
/>
      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}