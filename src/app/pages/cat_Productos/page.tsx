"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, IconButton, TextField, Grid,
  MenuItem, Checkbox, Snackbar, Alert, Paper, Dialog, Slide,
  Tabs, Tab, FormControlLabel, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Autocomplete, DialogContent,
  DialogActions
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  DataGrid, GridColDef, GridRenderCellParams, GridToolbar,
  GridPaginationModel, GridPagination
} from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';

import useConsumoApi from '../../../hooks/useConsumoApi';
import { useSessionContext } from '../../../context/SessionProvider';
import Swal from 'sweetalert2';

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
  fecha_alta: string;
  fecha_act: string;
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
  clave_sap: '',
  sucursal_origen: '',
  finalidad: '',
  comision: 0,
  unidad_paq_traspaso: 1,
  dias_rotacion: 0,
  version: '',
  fecha_alta: '',
  fecha_act: ''
};

// --- ESTILOS PARA MODAL ---
const modalCommonProps = {
  fullWidth: true,
  size: "small" as const,
  variant: "outlined" as const,
  sx: {
    width: '100%',
    '& .MuiInputBase-root': {
      height: '50px', // <--- RESTAURAMOS LA ALTURA FIJA PARA QUE NO CREZCA HACIA ABAJO
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
      <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Programación Global de Precios
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
            Consulte y programe los cambios de precios a futuro de sus productos
          </Typography>
        </Box>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" sx={{ color: '#333' }}>
            Aquí están <strong>todos</strong> los precios programados en el sistema. Modifique o agregue fechas futuras para la aplicación de nuevos precios.
          </Typography>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: 'none', mb: 2 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000', width: '200px' }}>Clave Producto</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Fecha Aplicación</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000', width: '100px' }}>No. Lista</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Nuevo Precio</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000', width: '50px' }} align="center">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: '#666' }}>Cargando registros...</TableCell></TableRow>
              ) : datos.length > 0 ? (
                datos.map((row) => (
                  <TableRow key={row._uid} hover sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        defaultValue={row.clave_prod || ''}
                        onBlur={(e) => handleBlur(row._uid, 'clave_prod', e.target.value)}
                        size="small" variant="standard" fullWidth placeholder="Ej. 1004"
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 0.5, fontWeight: 500, color: '#1a365d' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        type="date"
                        defaultValue={row.fecha ? row.fecha.substring(0, 10) : ''}
                        onBlur={(e) => handleBlur(row._uid, 'fecha', e.target.value)}
                        size="small" variant="standard" fullWidth InputLabelProps={{ shrink: true }}
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        type="number"
                        defaultValue={row.lista}
                        onBlur={(e) => handleBlur(row._uid, 'lista', e.target.value)}
                        size="small" variant="standard" fullWidth
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        type="number"
                        defaultValue={row.precio}
                        onBlur={(e) => handleBlur(row._uid, 'precio', e.target.value)}
                        size="small" variant="standard" fullWidth
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#666', fontWeight: 'bold' }}>$</Typography>, disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <IconButton size="small" color="error" onClick={() => handleDeleteRow(row._uid)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#999' }}>No hay precios programados en la tabla.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="text"
            size="small"
            onClick={handleAddRow}
            sx={{ fontWeight: 'bold', color: '#666', textTransform: 'none', '&:hover': { bgcolor: '#f5f5f5', color: '#333' } }}
          >
            + Agregar Nueva Fila
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{
            bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
            '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
          }}
        >
          {saving ? "Guardando..." : "Guardar Todos"}
        </Button>
      </DialogActions>
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
    <Dialog
      open={open}
      onClose={onClose}
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
      <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Códigos Alternos / Sustitutos
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
            Gestione los códigos adicionales o códigos de barras del producto
          </Typography>
        </Box>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>

        {/* ENCABEZADO DE INFO DEL PRODUCTO */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" sx={{ color: '#666' }}><strong>Clave General:</strong> {productoForm.clave_prod}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#333', fontWeight: 500 }}>{productoForm.descripcion}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>Costo unitario</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32', lineHeight: 1 }}>
              ${Number(productoForm.costo_unitario_iva).toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* CAJITAS PARA AGREGAR NUEVO */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, alignItems: 'flex-start' }}>
          <TextField
            sx={{ flex: 1, '& .MuiInputBase-root': { borderRadius: '8px' } }}
            size="small"
            variant="outlined"
            label="Nuevo Código / Barra"
            placeholder="Ej. 7501234..."
            value={nuevaClave}
            onChange={(e) => setNuevaClave(e.target.value)}
            disabled={saving}
          />
          <TextField
            sx={{ flex: 1.5, '& .MuiInputBase-root': { borderRadius: '8px' } }}
            size="small"
            variant="outlined"
            label="Descripción (Opcional)"
            placeholder="Ej. Caja 12 Pzas"
            value={nuevaDesc}
            onChange={(e) => setNuevaDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
            disabled={saving}
          />
          <Button
            variant="contained"
            onClick={handleAgregar}
            disabled={!nuevaClave.trim() || saving}
            sx={{
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', height: '40px', px: 2,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            {saving ? "..." : "+ Agregar"}
          </Button>
        </Box>

        {/* TABLA DE CÓDIGOS */}
        <TableContainer component={Paper} sx={{ maxHeight: 300, borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Código / Barra</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Descripción Específica</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '50px', borderBottom: '2px solid #000' }} align="center">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: '#666' }}>Cargando...</TableCell></TableRow>
              ) : datos.length > 0 ? (
                datos.map((s, idx) => (
                  <TableRow key={idx} hover sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1a365d', borderBottom: '1px solid #f1f3f4' }}>{s.codigo}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{s.descripcion}</TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <IconButton size="small" color="error" onClick={() => handleBorrar(s.codigo)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: '#999' }}>No hay códigos alternos registrados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
        >
          Cerrar
        </Button>
      </DialogActions>
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
      <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Programación Global de Costos
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
            Programe los futuros Costos. Se actualizarán automáticamente al llegar la fecha programada.
          </Typography>
        </Box>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" sx={{ color: '#333' }}>
            Aquí están <strong>todos</strong> los costos programados en el sistema. Modifique o agregue fechas futuras para la aplicación de nuevos costos.
          </Typography>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: 'none', mb: 2 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000', width: '200px' }}>Clave</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Fecha</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Costo Unitario</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Costo Paquete</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Costo Neto</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000', width: '50px' }} align="center">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: '#666' }}>Cargando costos...</TableCell></TableRow>
              ) : datos.length > 0 ? (
                datos.map((row) => (
                  <TableRow key={row._uid} hover sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        defaultValue={row.clave_prod || ''}
                        onBlur={(e) => handleBlur(row._uid, 'clave_prod', e.target.value)}
                        size="small" variant="standard" fullWidth placeholder="Ej. 1004"
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 0.5, fontWeight: 500, color: '#1a365d' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        type="date"
                        defaultValue={row.fecha ? row.fecha.substring(0, 10) : ''}
                        onBlur={(e) => handleBlur(row._uid, 'fecha', e.target.value)}
                        size="small" variant="standard" fullWidth InputLabelProps={{ shrink: true }}
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        type="number"
                        defaultValue={row.costo_unitario}
                        onBlur={(e) => handleBlur(row._uid, 'costo_unitario', e.target.value)}
                        size="small" variant="standard" fullWidth
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#666', fontWeight: 'bold' }}>$</Typography>, disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        type="number"
                        defaultValue={row.costo_paquete}
                        onBlur={(e) => handleBlur(row._uid, 'costo_paquete', e.target.value)}
                        size="small" variant="standard" fullWidth
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#666', fontWeight: 'bold' }}>$</Typography>, disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        type="number"
                        defaultValue={row.costoNeto}
                        onBlur={(e) => handleBlur(row._uid, 'costoNeto', e.target.value)}
                        size="small" variant="standard" fullWidth
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#666', fontWeight: 'bold' }}>$</Typography>, disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <IconButton size="small" color="error" onClick={() => handleDeleteRow(row._uid)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#999' }}>No hay costos programados en la tabla.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="text"
            size="small"
            onClick={handleAddRow}
            sx={{ fontWeight: 'bold', color: '#666', textTransform: 'none', '&:hover': { bgcolor: '#f5f5f5', color: '#333' } }}
          >
            + Agregar Nueva Fila
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{
            bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
            '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
          }}
        >
          {saving ? "Guardando..." : "Guardar Todos"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- COMPONENTE AISLADO PARA STOCK POR SUCURSAL ---
const ModalStockSucursal = ({ open, onClose, consumoApi, setMessage, productoForm, sucursales }: any) => {
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stockMasivo, setStockMasivo] = useState<number | string>('');

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

  const handleAplicarMasivo = () => {
    if (stockMasivo === '' || Number(stockMasivo) < 0) {
      alert("Ingrese una cantidad válida mayor o igual a 0.");
      return;
    }
    if (datos.length === 0) {
      alert("Primero agregue las sucursales a la lista (Puede usar el botón + Stock General).");
      return;
    }
    
    // Recorremos todas las filas y les inyectamos el valor masivo
    setDatos(prev => prev.map(row => ({ ...row, stock_minimo: Number(stockMasivo) })));
    
    // Opcional: Limpiamos la cajita después de aplicar
    setStockMasivo('');
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
    <Dialog
      open={open}
      onClose={onClose}
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
      <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            📦 Configuración de Stock por Sucursal
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
            Gestione el stock mínimo requerido por cada sucursal
          </Typography>
        </Box>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>

      {/* INFO DEL PRODUCTO Y BOTÓN STOCK GENERAL */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ color: '#666' }}><strong>Clave:</strong> {productoForm.clave_prod}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#333', fontWeight: 500 }}>{productoForm.descripcion}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>

            <TextField 
              size="small" 
              type="number" 
              placeholder="Cant." 
              value={stockMasivo} 
              onChange={(e) => setStockMasivo(e.target.value)}
              sx={{ 
                  width: '90px', 
                  bgcolor: '#fff', 
                  '& .MuiInputBase-root': { borderRadius: '8px', height: '36px' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' }
              }}
            />
            <Button 
              variant="contained" 
              onClick={handleAplicarMasivo} 
              sx={{ 
                bgcolor: '#000000', 
                color: 'white', 
                fontWeight: 600, 
                textTransform: 'none', 
                borderRadius: '8px', 
                height: '36px',
                px: 2,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)', 
                transition: 'all 0.3s ease',
                '&:hover': { 
                    bgcolor: '#333333', 
                    transform: 'translateY(-1px)', 
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)' 
                }
              }}
            >
              Aplicar a todas
            </Button>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Button
              variant="outlined"
              size="small"
              onClick={handleAddStockGeneral}
              sx={{ 
                  fontWeight: 'bold', 
                  color: '#333333', 
                  borderColor: '#cccccc', 
                  backgroundColor: '#ffffff',
                  borderRadius: '8px', 
                  height: '36px',
                  textTransform: 'none', 
                  '&:hover': { bgcolor: '#f5f5f5', borderColor: '#999999', color: '#000000' } 
              }}
            >
              + Stock General
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 350, borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: 'none', mb: 2 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Sucursal</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }} align="right">Stock Mínimo</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '50px', borderBottom: '2px solid #000' }} align="center">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: '#666' }}>Cargando stock...</TableCell></TableRow>
              ) : datos.length > 0 ? (
                datos.map((row) => (
                  <TableRow key={row._uid} hover sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        select
                        value={row.sucursal}
                        onChange={(e) => handleChange(row._uid, 'sucursal', e.target.value)}
                        size="small" variant="standard" fullWidth
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& .MuiSelect-select': { py: 0.5, fontWeight: 600, color: '#333333' } }}
                      >
                        {sucursales.map((s: any) => (
                          <MenuItem key={s.id} value={s.id}>{s.descripcion}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        type="number"
                        value={row.stock_minimo}
                        onChange={(e) => handleChange(row._uid, 'stock_minimo', e.target.value)}
                        size="small" variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{ width: '80px' }}
                        inputProps={{ style: { textAlign: 'right', fontWeight: 'bold' } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="text"
            size="small"
            onClick={handleAddRow}
            sx={{ fontWeight: 'bold', color: '#666', textTransform: 'none', '&:hover': { bgcolor: '#f5f5f5', color: '#333' } }}
          >
            + Agregar fila manual
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{
            bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
            '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
          }}
        >
          {saving ? "Guardando..." : "Guardar Stock"}
        </Button>
      </DialogActions>
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
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
      

      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>

        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" sx={{ color: '#666' }}><strong>Clave:</strong> {productoForm.clave_prod}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#333', fontWeight: 500 }}><strong>Descripción:</strong> {productoForm.descripcion}</Typography>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 500, borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: 'none', overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 1500 }}>
            <TableHead>
              <TableRow>
                {["Sucursal", "Descripción", "Entradas", "Salidas", "Existencias", "Ventas Periodo", "Ventas Promedio", "Días Muestra", "Unid. Paq. Traspaso", "Días Rotación", "Días Min.", "Días Max.", "Nuevo Mínimo", "Nuevo Máximo"].map((col, idx) => (
                  <TableCell key={idx} align={idx > 1 ? "right" : "left"} sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000', whiteSpace: 'nowrap' }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={14} align="center" sx={{ py: 3, color: '#666' }}>Consultando información...</TableCell></TableRow>
              ) : datos.length > 0 ? (
                datos.map((row, idx) => (
                  <TableRow key={idx} hover sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.sucursal}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid #f1f3f4' }}>{row.descripcion}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.entradas || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.salidas || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: '1px solid #f1f3f4' }}>{Number(row.existencias || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.venta_periodo || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.ventas_promedio || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.dias_muestra || 0)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.unidad_paq_traspaso || 0)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.dias_rotacion || 0)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.dias_min || 0)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.dias_max || 0)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2', borderBottom: '1px solid #f1f3f4' }}>{Number(row.nuevo_minimo || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#d32f2f', borderBottom: '1px solid #f1f3f4' }}>{Number(row.nuevo_maximo || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={14} align="center" sx={{ py: 4, color: '#999' }}>No hay información de stock para esta clave.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
        >
          Cerrar
        </Button>
      </DialogActions>
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
    <Dialog
      open={open}
      onClose={onClose}
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
            Proveedores Asignados
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
            Gestione los proveedores vinculados y sus descuentos para este producto
          </Typography>
        </Box>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>

        {/* INFO DEL PRODUCTO */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" sx={{ color: '#666' }}><strong>Clave General:</strong> {productoForm.clave_prod}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#333', fontWeight: 500 }}><strong>Descripción:</strong> {productoForm.descripcion}</Typography>
        </Box>

        {/* TABLA DE PROVEEDORES */}
        <TableContainer component={Paper} sx={{ maxHeight: 350, borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: 'none', mb: 2 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Proveedor</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '120px', borderBottom: '2px solid #000' }} align="center">Descuento</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '50px', borderBottom: '2px solid #000' }} align="center">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: '#666' }}>Cargando proveedores...</TableCell></TableRow>
              ) : datos.length > 0 ? (
                datos.map((row) => (
                  <TableRow key={row._uid} hover sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        select
                        value={row.cve_prov}
                        onChange={(e) => handleChange(row._uid, 'cve_prov', e.target.value)}
                        size="small" variant="standard" fullWidth
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& .MuiSelect-select': { py: 0.5, color: '#1a365d', fontWeight: 500 } }}
                      >
                        {proveedores.map((p: any) => (
                          <MenuItem key={p.id} value={p.id}>{p.descripcion}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <TextField
                        type="number"
                        value={row.descuento}
                        onChange={(e) => handleChange(row._uid, 'descuento', e.target.value)}
                        size="small" variant="standard"
                        InputProps={{ disableUnderline: true }}
                        inputProps={{ step: "0.01", min: "0", max: "1", style: { textAlign: 'center', fontWeight: 'bold' } }}
                        sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>
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

        {/* BOTÓN AGREGAR FILA */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="text"
            size="small"
            onClick={handleAddRow}
            sx={{ fontWeight: 'bold', color: '#666', textTransform: 'none', '&:hover': { bgcolor: '#f5f5f5', color: '#333' } }}
          >
            + Agregar Fila
          </Button>
        </Box>

      </DialogContent>

      {/* BOTONES INFERIORES */}
      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{
            bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
            '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
          }}
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogActions>
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
    } catch (e) { }
    return '';
  };
  const [sucursalSel, setSucursalSel] = useState<string>(sucursalUsuario());

// --- 1. EL NUEVO EFECTO (Dispara la búsqueda automática al abrir) ---
  useEffect(() => {
    if (open && productoForm.clave_prod) {
      ejecutarConsulta(true); // El "true" significa que es la carga inicial (todas las fechas)
    } else {
      setDatos([]); 
    }
  }, [open, productoForm.clave_prod]);

  // --- 2. LA NUEVA FUNCIÓN MAESTRA (Reemplaza la lógica anterior) ---
  const ejecutarConsulta = async (esCargaInicial: boolean = false) => {
    if (!sucursalSel) {
      if (!esCargaInicial) alert("Seleccione una sucursal para consultar.");
      return;
    }
    if (!esCargaInicial && fechaInicio > fechaFin) {
      alert("La fecha final debe ser mayor o igual a la inicial.");
      return;
    }

    setLoading(true);
    try {
      const params = {
        clave: productoForm.clave_prod,
        sucursal: sucursalSel, // Siempre usamos la sucursal del login/select
        // Si es la carga inicial, abrimos el filtro de fechas desde 2000 hasta 2099
        fecha_inicio: esCargaInicial ? '2000-01-01' : fechaInicio,
        fecha_fin: esCargaInicial ? '2099-12-31' : fechaFin
      };

      const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_kardex_sel', { params });
      setDatos(res.data || []);
      
      // Solo mostramos la alerta de "vacío" si el usuario dio clic en consultar
      if(!esCargaInicial && res.data.length === 0) {
        setMessage({ text: "No se encontraron movimientos con estos filtros.", type: 'info' });
      } 
    } catch (error) {
      console.error(error);
      setMessage({ text: "Error al consultar el Kardex", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- 3. EL BOTÓN CONSULTAR AHORA SOLO LLAMA A LA MAESTRA ---
  const handleConsultar = () => ejecutarConsulta(false); // El "false" respeta las fechas de las cajitas

  const handleExportExcelKardex = async () => {
    if (datos.length === 0) {
      alert("No hay movimientos para exportar. Primero realice una consulta.");
      return;
    }

    try {
      setMessage({ text: "⏳ Generando reporte de movimientos...", type: 'success' });
      const XLSX = await import('xlsx-js-style');

      // 1. Mapeamos los datos de la tabla al Excel con nombres claros
      const worksheetData = datos.map(row => ({
        "FECHA MOVIMIENTO": row.fecha_movto ? String(row.fecha_movto).replace('T', ' ').substring(0, 16) : '',
        "FOLIO": row.folio_movto,
        "CONCEPTO / TIPO": row.tipo_movimiento,
        "ENTRADA": Number(row.cantidad_entrada || 0),
        "SALIDA": Number(row.cantidad_salida || 0),
        "COSTO": Number(row.costo || 0),
        "USUARIO": row.usr
      }));

      // 2. Creamos el libro y la hoja
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // --- 🎨 ESTILO BERLLANO (Encabezado Gris y Negritas) ---
      const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1");
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          fill: { patternType: "solid", fgColor: { rgb: "D9D9D9" } },
          font: { bold: true, color: { rgb: "000000" } },
          alignment: { horizontal: "center" }
        };
      }

      // Ajuste automático de columnas
      const wscols = [
        { wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Kardex");

      // 3. Descarga del archivo con nombre descriptivo
      const nombreArchivo = `Kardex_${productoForm.clave_prod}_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(workbook, nombreArchivo);

      setMessage({ text: "✅ Kardex exportado correctamente", type: 'success' });
    } catch (error) {
      console.error(error);
      setMessage({ text: "Error al generar el Excel del Kardex", type: 'error' });
    }
  };

  // Sumatorias estilo Access
  const totalEntradas = datos.reduce((sum, row) => sum + Number(row.cantidad_entrada || 0), 0);
  const totalSalidas = datos.reduce((sum, row) => sum + Number(row.cantidad_salida || 0), 0);
  const diferencia = totalEntradas - totalSalidas;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '95vh'
        }
      }}
    >
      {/* ENCABEZADO OSCURO Y ELEGANTE */}
      <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            🗂️ Tarjeta de Almacén (KARDEX)
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
            Consulte los movimientos de entrada y salida por sucursal y periodo
          </Typography>
        </Box>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* INFO DEL PRODUCTO */}
        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" sx={{ color: '#666' }}><strong>Clave:</strong> {productoForm.clave_prod}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#333', fontWeight: 500 }}><strong>Producto:</strong> {productoForm.descripcion}</Typography>
        </Box>

        {/* ZONA DE FILTROS */}
        <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e0e0e0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Sucursal"
            value={sucursalSel}
            onChange={(e) => setSucursalSel(e.target.value)}
            sx={{ minWidth: 200, '& .MuiInputBase-root': { borderRadius: '8px' } }}
          >
            {sucursales.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.descripcion}</MenuItem>)}
          </TextField>
          <TextField
            type="date"
            size="small"
            label="Del"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150, '& .MuiInputBase-root': { borderRadius: '8px' } }}
          />
          <TextField
            type="date"
            size="small"
            label="Al"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150, '& .MuiInputBase-root': { borderRadius: '8px' } }}
          />
          <Button
            variant="contained"
            onClick={handleConsultar}
            disabled={loading}
            sx={{
              bgcolor: '#000000ff', color: 'white', fontWeight: 600, height: '40px', borderRadius: '8px', textTransform: 'none', px: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            {loading ? "Buscando..." : "Consultar Kardex"}
          </Button>

          <Button 
              variant="contained" 
              onClick={handleExportExcelKardex} 
              disabled={loading || datos.length === 0} 
              sx={{ 
                bgcolor: '#2e7d32', color: 'white', fontWeight: 600, height: '40px', borderRadius: '8px', textTransform: 'none', px: 3,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
                '&:hover': { bgcolor: '#1b5e20', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
              }}
            >
              📊 Exportar Excel
            </Button>
        </Box>

        {/* TABLA DE MOVIMIENTOS */}
        <TableContainer component={Paper} sx={{ flex: 1, minHeight: 250, maxHeight: 400, borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: 'none', overflowY: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Fecha</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Folio</TableCell>
                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Concepto</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Entrada</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Salida</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Costo</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: '#666' }}>Buscando movimientos...</TableCell></TableRow>
              ) : datos.length > 0 ? (
                datos.map((row, idx) => (
                  <TableRow key={idx} hover sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid #f1f3f4', fontWeight: 500, color: '#1a365d' }}>
                      {row.fecha_movto ? String(row.fecha_movto).replace('T', ' ').substring(0, 16) : ''}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.folio_movto}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.tipo_movimiento}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4', color: '#2e7d32', fontWeight: row.cantidad_entrada > 0 ? 'bold' : 'normal' }}>
                      {Number(row.cantidad_entrada) > 0 ? row.cantidad_entrada : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4', color: '#d32f2f', fontWeight: row.cantidad_salida > 0 ? 'bold' : 'normal' }}>
                      {Number(row.cantidad_salida) > 0 ? row.cantidad_salida : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>${Number(row.costo).toFixed(2)}</TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4', fontSize: '0.8rem', color: '#666' }}>{row.usr}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>Realice una búsqueda para ver los movimientos.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* SUMATORIAS AL ESTILO ACCESS */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', bgcolor: '#f8f9fa', p: 2, borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <Box textAlign="center">
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Total de Entradas</Typography>
            <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold', lineHeight: 1.2 }}>{totalEntradas.toFixed(2)}</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Total de Salidas</Typography>
            <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold', lineHeight: 1.2 }}>{totalSalidas.toFixed(2)}</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Diferencia</Typography>
            <Typography variant="h6" sx={{ color: diferencia < 0 ? '#d32f2f' : '#1a365d', fontWeight: 'bold', lineHeight: 1.2 }}>{diferencia.toFixed(2)}</Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
        >
          Cerrar Kardex
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default function CatProductos() {
  const { consumoApi } = useConsumoApi();

  const { session } = useSessionContext();

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
  const [marcasUnicasModal, setMarcasUnicasModal] = useState<{ id: number, desc: string }[]>([]);
  const [familiasFiltradasModal, setFamiliasFiltradasModal] = useState<MarcaFamiliaRel[]>([]);

  const [loadingDeptos, setLoadingDeptos] = useState(false);
  const [loadingClases, setLoadingClases] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [formData, setFormData] = useState(initialFormState);
  // ✅ PEGA ESTA NUEVA FUNCIÓN EN EL MISMO LUGAR:
  const setMessage = (msg: { text: string, type: 'success' | 'error' | 'warning' | 'info' } | null) => {
    if (!msg) return;

    // UX TÁCTICA: Si es el mensaje de la bandera (cuando el usuario da clic rápido en los checkbox de la tabla), 
    // mostramos un "Toast" pequeñito para no interrumpir su trabajo bloqueándole la pantalla.
    if (msg.text.includes("Banderas actualizadas")) {
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: msg.text.replace('✅ ', ''), showConfirmButton: false, timer: 2000
      });
      return;
    }

    // Alerta Pop-up Profesional para todo lo demás (Guardar producto, Errores de BD, etc)
    Swal.fire({
      title: msg.type === 'success' ? '¡Éxito!' : 'Atención',
      text: msg.text.replace('✅ ', '').replace('❌ ', ''), // Limpiamos los emojis de tu texto original
      icon: msg.type === 'error' ? 'error' : 'success',
      timer: msg.type === 'success' ? 2500 : undefined,
      showConfirmButton: msg.type !== 'success',
      confirmButtonColor: '#333'
    });
  }; const [openModal, setOpenModal] = useState(false);
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
  const [loadingSaveKit, setLoadingSaveKit] = useState(false);

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

  const handleAddCantidad = () => {
    setCantidadesDescarga([...cantidadesDescarga, { cantidad: 0 }]);
  };

  const handleDeleteCantidad = (index: number) => {
    const nuevas = [...cantidadesDescarga];
    nuevas.splice(index, 1);
    setCantidadesDescarga(nuevas);
  };

  const handleCantidadChange = (index: number, valor: any) => {
    const nuevas = [...cantidadesDescarga];
    nuevas[index] = { ...nuevas[index], cantidad: valor === '' ? '' : Number(valor) };
    setCantidadesDescarga(nuevas);
  };

  const handlePrecioLocalChange = (index: number, campo: string, valor: any) => {
    const copiaPrecios = [...precios];

    // Convertimos a número. Si el usuario borra todo el input, ponemos 0 para evitar errores
    const valorNumerico = valor === '' ? 0 : Number(valor);

    // Actualizamos tanto la versión en minúscula como en mayúscula 
    // para que la tabla y la API no se confundan
    copiaPrecios[index] = {
      ...copiaPrecios[index],
      [campo.toLowerCase()]: valorNumerico,
      [campo.charAt(0).toUpperCase() + campo.slice(1)]: valorNumerico
    };

    setPrecios(copiaPrecios);
  };




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
      const response = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_deptos', { params: { area: areaId || '%' } });
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
        sucursal: sucursal, obsoleto: formData.incluir_obsoletos ? 1 : 0
      };

      const response = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_productos_sel', { params, timeout: 120000 });
      const data = response.data;

      if (!Array.isArray(data)) { setRows([]); setLoading(false); return; }

      const rowsMapped: ProductoRow[] = data.map((item: any) => ({
        id: item.id, clave: item.Clave || '', descripcion: item.descripcion || item.Descripcion || '', marca: item.Marca || '',
        ex: Number(item.Ex) || 0, costo: Number(item.Costo) || 0, precio: Number(item.Precio) || 0,
        margen: Number(item.Margen) || 0, iva: (Number(item.IVA) || 0) * 100, area: item.Area || '',
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
    const sucursalLoggeada = getSucursalUsuario();
    setClaveSeleccionada(null);
   setProductoForm({
      ...initialProductoState,
      sucursal_origen: sucursalLoggeada !== 0 ? String(sucursalLoggeada) : ''
    });
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


      //const resPrecios = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_precios', { 
      //  params: { clave: row.clave } 
      //});
      // setPrecios(resPrecios.data || []);
      const resPrecios = await consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_precios', {
        params: { clave: row.clave }
      });

      // MAGIA 1: Convertimos el margen decimal a entero (ej. 0.15 -> 15)
      const preciosMapeados = (resPrecios.data || []).map((p: any) => ({
        ...p,
        margen: Number(p.margen ?? p.Margen ?? 0) * 100,
        Margen: Number(p.margen ?? p.Margen ?? 0) * 100
      }));
      setPrecios(preciosMapeados);

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
      // --- BLOQUE 1: CALCULAR COSTOS CON IVA ANTES DE ABRIR EL MODAL ---
      const redondear = (num: number) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
      const valTasaIva = Number(d.tasa_iva) || 0;
      const valCosto = Number(d.costo) || 0;
      const valCostoUnit = Number(d.costo_unitario) || 0;

      const calcCostoConIva = valCosto * (1 + valTasaIva);
      const calcCostoUnitIva = valCostoUnit * (1 + valTasaIva);
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
        // --- BLOQUE LOGÍSTICA Y EXTERNOS ---
        clave_proveedor: d.clave_prov || '',
        clave_sas: d.clave_sas || '',
        clave_sap: d.clave_sap || '', // Nota: clave_sap no está en tu BD, pero lo dejamos por si luego lo agregas
        finalidad: d.finalidad ?? '',
        fecha_alta: d.fecha_alta ? String(d.fecha_alta).split('T')[0] : '',
        fecha_act: d.fecha_act ? String(d.fecha_act).split('T')[0] : '',
        costo_sin_iva: d.costo,
        tasa_iva: d.tasa_iva,
        // --- BLOQUE 2: ASIGNAR CAMPOS DIRECTOS Y CALCULADOS ---
        costo_unitario: Number(d.costo_unitario) || 0,
        costo_promedio: Number(d.costo_promedio) || 0,
        costo_autorizado: Number(d.costo_unitario_autorizado) || 0,
        costo_con_iva: calcCostoConIva,
        costo_unitario_iva: calcCostoUnitIva,
        unidad_paq: d.unidad_paq,
        sucursal_origen: d.sucursal_origen,
        comision: d.comision,
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
        entrega_directa: !!d.entregaDirecta,
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
        "TASA IVA": `${Number(row.iva || 0).toFixed(2)}%`,
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

  // ✅ PEGA ESTA FUNCIÓN:
  const handleDelete = async (id: string) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede revertir.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      // Aquí en un futuro pondrás tu endpoint DELETE. Por ahora dejamos el aviso visual de éxito:
      setMessage({ text: 'Producto eliminado correctamente (Modo Desarrollo)', type: 'success' });
    }
  };

  const calculateCosts = (name: string, val: number) => {
    const tasa = name === 'tasa_iva' ? val : (productoForm.tasa_iva || 0);
    const paq = name === 'unidad_paq' ? val : (productoForm.unidad_paq || 1);
    let newForm = { ...productoForm, [name]: val };
    let valorIva = val; if (name === 'tasa_iva' && val > 1) { valorIva = val / 100; }

    // MAGIA: Forzamos matemáticamente a 2 decimales en cada cálculo
    const redondear = (num: number) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

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
    let val = type === 'checkbox' ? checked : value;

    // --- MAGIA VISUAL: IVA y Comisiones (De entero a decimal interno) ---
    if ((name === 'tasa_iva' || name === 'comision') && val !== '') {
      val = Number(val) / 100;
    }

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
      setProductoForm(prev => {
        let newForm = { ...prev, [name]: val };

        // Lógica de restricciones de la matriz (solo al encender un checkbox)
        if (type === 'checkbox' && val === true) {
          switch (name) {
            case 'es_insumo':
              newForm.es_servicio = false;
              newForm.es_producto = false;
              newForm.es_kit = false;
              break;

            case 'es_servicio':
            case 'es_kit':
              newForm.es_insumo = false;
              newForm.inventariable = false;
              newForm.entrega_directa = false;
              newForm.fraccionable = false;
              newForm.es_producto = false;
              newForm.controlado = false;
              newForm.producto_libre = false;
              break;

            case 'es_producto':
              newForm.es_insumo = false;
              newForm.es_servicio = false;
              newForm.es_kit = false;
              break;

            case 'inventariable':
            case 'entrega_directa':
            case 'fraccionable':
            case 'controlado':
            case 'producto_libre':
              newForm.es_servicio = false;
              newForm.es_kit = false;
              break;
          }
        }
        return newForm;
      });
    }
  };

  const handleSaveProducto = async () => {
    // 1. Validaciones básicas
    if (!productoForm.clave_prod || !productoForm.descripcion || !productoForm.familia) {
      setMessage({ text: "Clave, descripción y familia son obligatorios", type: 'error' });
      return;
    }
    const cantidadesValidas = cantidadesDescarga
      .map(c => Number(c.cantidad ?? c.Cantidad))
      .filter(n => !isNaN(n) && n > 0);

    // Usamos un Set (conjunto) que automáticamente elimina duplicados. 
    // Si el tamaño del Set es menor que el arreglo original, ¡hay un duplicado!
    const cantidadesUnicas = new Set(cantidadesValidas);
    if (cantidadesValidas.length !== cantidadesUnicas.size) {
      setMessage({ text: "❌ Error: Hay cantidades duplicadas en la pestaña de Logística.", type: 'error' });
      setModalTabValue(2); // Mandamos al usuario directo a la pestaña Logística para que lo corrija
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

      // 3. LÓGICA DE DECISIÓN DE URL Y MÉTODO HTTP
      let response;
      if (claveSeleccionada) {
        // EDITANDO: Usamos PUT porque la API tiene [HttpPut]
        response = await consumoApi.put('/api/CatProductosC/sp_bw_cat_combo_productos_upd', null, { params: paramsEnvio });
      } else {
        // NUEVO: Usamos POST porque la API tiene [HttpPost]
        response = await consumoApi.post('/api/CatProductosC/sp_bw_cat_combo_productos_inse', null, { params: paramsEnvio });
      }

      if (response.status === 200) {
        // 1. Preparamos los datos de la tabla de precios
        // Mapeamos para que los nombres coincidan con los parámetros de la API (clave_lista, precio, margen)
        //const payloadPrecios = precios.map(p => ({
        // clave_lista: Number(p.Lista || p.lista || p.clave_lista),
        //precio: Number(p.precio ?? p.Precio ?? 0),
        //margen: Number(p.margen ?? p.Margen ?? 0)
        //}));

        const payloadPrecios = precios.map(p => ({
          clave_lista: Number(p.Lista || p.lista || p.clave_lista),
          precio: Number(p.precio ?? p.Precio ?? 0),
          // MAGIA 2: Convertimos el entero de vuelta a decimal (ej. 15 -> 0.15)
          margen: Number(p.margen ?? p.Margen ?? 0) / 100
        }));

        // --- NUEVO: GUARDAR CANTIDADES ---
        const payloadCantidades = cantidadesDescarga
          .map(c => Number(c.cantidad ?? c.Cantidad))
          .filter(n => !isNaN(n) && n > 0); // Solo mandamos números válidos mayores a 0

        await consumoApi.post(`/api/CatProductosC/sp_bw_cat_producto_cantidades_save?clave=${productoForm.clave_prod}`, payloadCantidades);

        await consumoApi.put(`/api/CatProductosC/sp_bw_cat_producto_precios_update?clave=${productoForm.clave_prod}`, payloadPrecios);

        // 3. Finalizamos el flujo
        setMessage({
          text: claveSeleccionada ? "✅ Producto y Precios actualizados" : "✅ Producto registrado con éxito",
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

  // --- NUEVA LÓGICA: ACTUALIZACIÓN RÁPIDA DE BANDERAS DESDE EL DATAGRID (Con reglas de negocio) ---
  const processRowUpdate = async (newRow: ProductoRow, oldRow: ProductoRow) => {
    const banderas = ['inv', 'obs', 'cont', 'prom', 'kit', 'ins', 'serv', 'prod', 'prod_libre'];

    // 1. Detectar exactamente qué bandera cambió
    const changedField = banderas.find(b => (newRow as any)[b] !== (oldRow as any)[b]);
    if (!changedField) return oldRow;

    // 2. Clonamos la fila para aplicar las reglas de exclusión
    let updatedRow = { ...newRow };

    // 3. Reglas de negocio (Solo aplican si el usuario ENCENDIÓ un checkbox)
    if ((updatedRow as any)[changedField] === true) {
      switch (changedField) {
        case 'ins': // Si es insumo...
          updatedRow.serv = false;
          updatedRow.prod = false;
          updatedRow.kit = false;
          break;
        case 'serv': // Si es servicio o kit...
        case 'kit':
          updatedRow.ins = false;
          updatedRow.inv = false;
          updatedRow.prod = false;
          updatedRow.cont = false;
          updatedRow.prod_libre = false;
          break;
        case 'prod': // Si es producto...
          updatedRow.ins = false;
          updatedRow.serv = false;
          updatedRow.kit = false;
          break;
        case 'inv': // Si es inventariable, controlado o libre...
        case 'cont':
        case 'prod_libre':
          updatedRow.serv = false;
          updatedRow.kit = false;
          break;
      }
    }

    // 4. Preparamos el Payload con la fila ya validada
    try {
      const payload = {
        clave: updatedRow.clave,
        inv: updatedRow.inv,
        obs: updatedRow.obs,
        cont: updatedRow.cont,
        prom: updatedRow.prom,
        kit: updatedRow.kit,
        ins: updatedRow.ins,
        serv: updatedRow.serv,
        prod: updatedRow.prod,
        prod_libre: updatedRow.prod_libre
      };

      // 5. Enviamos a la BD
      const res = await consumoApi.put('/api/CatProductosC/sp_bw_cat_producto_update_banderas', payload);

      if (res.status === 200) {
        setMessage({ text: `✅ Banderas actualizadas para la clave: ${updatedRow.clave}`, type: 'success' });
        // Actualizamos la tabla visualmente con las reglas aplicadas
        setRows(prevRows => prevRows.map(r => r.id === updatedRow.id ? updatedRow : r));
        return updatedRow;
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.mensaje || "Error al actualizar las banderas.";
      setMessage({ text: `❌ ${errorMsg}`, type: 'error' });
      return oldRow; // Revertimos el cambio visual si falla la red/BD
    }

    return oldRow;
  };

  const handleProcessRowUpdateError = (error: any) => {
    setMessage({ text: "Error interno en la tabla al actualizar.", type: 'error' });
  };
  // -----------------------------------------------------------------------
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
    {
      field: 'margen',
      headerName: 'Margen',
      width: 100,
      type: 'number',
      renderCell: (params: GridRenderCellParams) => {
        const valor = Number(params.row.margen) || 0;
        return `${(valor * 100).toFixed(2)}%`;
      }
    },
    {
      field: 'iva',
      headerName: 'IVA',
      width: 80,
      type: 'number',
      valueFormatter: (params: any) => `${Number(params ?? 0).toFixed(2)}%`
    }, // --- BUSCA ESTO Y REEMPLÁZALO ---

    { field: 'area', headerName: 'Área', width: 150 },
    { field: 'depto', headerName: 'Depto.', width: 150 },
    { field: 'clase', headerName: 'Clase', width: 150 },

    // --- BORRA LAS LÍNEAS QUE DECÍAN valueFormatter: (v: any) => areas.find(...) ---
    { field: 'inv', headerName: 'INV', width: 60, type: 'boolean', editable: true },
    { field: 'obs', headerName: 'OBS', width: 60, type: 'boolean', editable: true },
    { field: 'cont', headerName: 'CONT', width: 60, type: 'boolean', editable: true },
    { field: 'prom', headerName: 'PROM', width: 60, type: 'boolean', editable: true },
    { field: 'kit', headerName: 'KIT', width: 60, type: 'boolean', editable: true },
    { field: 'ins', headerName: 'INS', width: 60, type: 'boolean', editable: true },
    { field: 'serv', headerName: 'SERV', width: 60, type: 'boolean', editable: true },
    { field: 'prod', headerName: 'PROD', width: 60, type: 'boolean', editable: true },
    { field: 'prod_libre', headerName: 'PROD. LIBRE', width: 100, type: 'boolean', editable: true },
  ], [areas, deptos, clases]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5', overflow: 'hidden' }}>
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>

      {/* --- NUEVO CONTENEDOR PRINCIPAL DEL ENCABEZADO --- */}
      <Box sx={{ flexShrink: 0, p: 3, pb: 0 }}>
        <Paper sx={{ p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', bgcolor: 'white' }}>

          {/* RECUADRO INTERIOR ELEGANTE (Nombre, Sucursal, Fecha, Usuario) */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '6px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem', textTransform: 'uppercase' }}>
                Catálogo de Productos
              </Typography>

            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replaceAll('/', '-')}
              </Typography>

            </Box>
          </Box>

          {/* ÁREA DE FILTROS ORIGINALES (Sin fondo gris feo, integrados limpios) */}
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
              <TextField {...commonProps} label='Descripción' name="descripcion" value={formData.descripcion || ''} onChange={handleInputChange} onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} />
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

      {/* AQUÍ COMIENZA LA CAJA DE LA TABLA (Ajustamos el padding para que encaje) */}
      <Box sx={{ flex: 1, minHeight: 0, p: 3, display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ flex: 1, width: '100%', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)', bgcolor: 'white', mb: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 30, 50, 100]}
            slots={{ toolbar: GridToolbar, pagination: CustomPagination }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={handleProcessRowUpdateError}

            // --- DISEÑO OFICIAL ---
            density="compact"

            // 1. APAGAR LA VIRTUALIZACIÓN (Esto permite que el CSS Sticky funcione)
            disableVirtualization

            sx={{
              border: 'none',
              height: '100%',

              // --- ESTILOS OFICIALES (BASE TURNOS DOBLES) ---
              '& .MuiDataGrid-columnHeaders': {
                borderBottom: '2px solid #000',
                fontSize: '1rem',
                fontWeight: 'bold'
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #e0e0e000' // Borde invisible para diseño limpio
              },
              '& .MuiDataGrid-cell--editable': { backgroundColor: '#f9fbfd', cursor: 'text' },
              '& .MuiDataGrid-cell--editing': { backgroundColor: '#fff', boxShadow: '0 0 5px rgba(25,118,210,0.5)' },

              // 2. MATAR EL TRANSFORM INTERNO DE MUI
              '& .MuiDataGrid-virtualScrollerContent': { transform: 'none !important' },
              '& .MuiDataGrid-virtualScrollerRenderZone': { transform: 'none !important' },

              // 3. CONGELAR COLUMNA 1: ACCIONES (Empieza en 0)
              '& .MuiDataGrid-cell[data-field="acciones"]': { position: 'sticky', left: 0, zIndex: 3, backgroundColor: '#fff' },
              '& .MuiDataGrid-columnHeader[data-field="acciones"]': { position: 'sticky', left: 0, zIndex: 4, backgroundColor: '#fff' },

              // 4. CONGELAR COLUMNA 2: CLAVE (Empieza en 100)
              '& .MuiDataGrid-cell[data-field="clave"]': { position: 'sticky', left: 100, zIndex: 3, backgroundColor: '#fff' },
              '& .MuiDataGrid-columnHeader[data-field="clave"]': { position: 'sticky', left: 100, zIndex: 4, backgroundColor: '#fff' },

              // 5. CONGELAR COLUMNA 3: DESCRIPCIÓN (Empieza en 220)
              '& .MuiDataGrid-cell[data-field="descripcion"]': {
                position: 'sticky',
                left: 220,
                zIndex: 3,
                backgroundColor: '#fff',
                boxShadow: '4px 0px 5px -2px rgba(0,0,0,0.1)' // Sombra elegante para notar el corte
              },
              '& .MuiDataGrid-columnHeader[data-field="descripcion"]': {
                position: 'sticky',
                left: 220,
                zIndex: 4,
                backgroundColor: '#fff',
                boxShadow: '4px 0px 5px -2px rgba(0,0,0,0.1)'
              },

              // MAGIA EXTRA: Iluminar la fila donde está el mouse para que el usuario no se pierda al hacer scroll
              '& .MuiDataGrid-row:hover .MuiDataGrid-cell': {
                backgroundColor: '#e3f2fd',
              }
            }}
          />
        </Paper>

        {/* BOTONES INFERIORES INTACTOS */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
          <Button variant="contained" onClick={handleOpenAdd} sx={{ backgroundColor: '#333333', color: 'white', borderRadius: '8px', fontWeight: 'bold', padding: '10px 24px' }}>
            + ALTA DE CLAVES
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
                  {/* RENGLON 1: CLAVE Y DESCRIPCIONES (SOLO ESTOS 3 EN LA FILA) */}
                  <Grid item xs={12} md={2}>
                    <TextField {...modalCommonProps} label="Clave del Producto" name="clave_prod" value={productoForm.clave_prod} onChange={handleProductoChange} disabled={!!claveSeleccionada} required />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField {...modalCommonProps} label="Descripción Ticket (Corta)" name="descripcion_corta" value={productoForm.descripcion_corta} onChange={handleProductoChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {/* Sin multiline, solo crecerá hacia la derecha ocupando la mitad del modal (md=6) */}
                    <TextField {...modalCommonProps} label="Descripción Completa" name="descripcion" value={productoForm.descripcion} onChange={handleProductoChange} />
                  </Grid>

                  {/* RENGLON 2: CLASIFICACIÓN (MARCA, FAMILIA, ÁREA, DEPTO, CLASE) */}
                  <Grid item xs={12} md={3}>
                    <TextField {...modalSelectProps} select label="Marca" name="marca" value={productoForm.marca} onChange={handleProductoChange}>
                      {marcasUnicasModal.map((m) => (<MenuItem key={m.id} value={m.id}>{m.desc}</MenuItem>))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField {...modalSelectProps} select label="Familia" name="familia" value={productoForm.familia} onChange={handleProductoChange} disabled={!productoForm.marca}>
                      {familiasFiltradasModal.length > 0 ? (
                        familiasFiltradasModal.map((f) => (<MenuItem key={f.id_familia} value={f.id_familia}>{f.familia}</MenuItem>))
                      ) : (
                        <MenuItem disabled>Seleccione marca</MenuItem>
                      )}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField {...modalSelectProps} select label="Área" name="area" value={productoForm.area} onChange={handleProductoChange}>
                      {areas.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField {...modalSelectProps} select label="Departamento" name="depto" value={productoForm.depto} onChange={handleProductoChange} disabled={!productoForm.area}>
                      {deptosModal.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={2}>
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
                    <Grid item xs={12} md={4}>
                      <TextField
                        {...modalCommonProps}
                        label="Tasa IVA (%)"
                        type="number"
                        name="tasa_iva"
                        value={Math.round(Number(productoForm.tasa_iva || 0) * 100)}
                        onChange={handleProductoChange}
                        inputProps={{ step: "1" }}
                        InputProps={{ endAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold' }}>%</Typography> }}
                      />
                    </Grid>
                    {/* APLICAMOS EL TOFIXED(2) DIRECTO EN EL VALUE */}
                    {/* APLICAMOS EL SÍMBOLO $ AL INICIO DE TODOS LOS COSTOS */}
                    <Grid item xs={12} md={4}>
                      <TextField {...modalCommonProps} label="Costo sin IVA" type="number" name="costo_sin_iva" value={Number(productoForm.costo_sin_iva).toFixed(2)} onChange={handleProductoChange} inputProps={{ step: "0.01" }} InputProps={{ startAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold', mr: 1 }}>$</Typography> }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField {...modalCommonProps} label="Costo con IVA" type="number" name="costo_con_iva" value={Number(productoForm.costo_con_iva).toFixed(2)} onChange={handleProductoChange} inputProps={{ step: "0.01" }} InputProps={{ startAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold', mr: 1 }}>$</Typography> }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField {...modalCommonProps} label="Costo Promedio" type="number" name="costo_promedio" value={Number(productoForm.costo_promedio).toFixed(2)} onChange={handleProductoChange} inputProps={{ step: "0.01" }} InputProps={{ startAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold', mr: 1 }}>$</Typography> }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField {...modalCommonProps} label="Costo Unitario" type="number" name="costo_unitario" value={Number(productoForm.costo_unitario).toFixed(2)} onChange={handleProductoChange} inputProps={{ step: "0.01" }} InputProps={{ startAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold', mr: 1 }}>$</Typography> }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField {...modalCommonProps} label="Cto. Unit. c. IVA" type="number" name="costo_unitario_iva" value={Number(productoForm.costo_unitario_iva).toFixed(2)} onChange={handleProductoChange} inputProps={{ step: "0.01" }} InputProps={{ startAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold', mr: 1 }}>$</Typography> }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField {...modalCommonProps} label="Costo Auto." type="number" name="costo_autorizado" value={Number(productoForm.costo_autorizado).toFixed(2)} onChange={handleProductoChange} inputProps={{ step: "0.01" }} InputProps={{ startAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold', mr: 1 }}>$</Typography> }} />
                    </Grid> </Grid>
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
                      <TextField
                        {...modalCommonProps}
                        label="Precio Promo"
                        type="number"
                        name="precio_promocion"
                        value={productoForm.precio_promocion}
                        onChange={handleProductoChange}
                        disabled={!productoForm.en_promocion}
                        // 👇 EL SÍMBOLO $ AL INICIO 👇
                        InputProps={{ startAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold', mr: 1 }}>$</Typography> }}
                      />
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
                              // Normalizamos los nombres de las columnas que vienen del SP
                              const numLista = p.Lista || p.lista || p.clave_lista;
                              const descLista = p["Lista de Precios"] || p["lista de precios"] || '';
                              const valPrecio = p.precio ?? p.Precio ?? 0;
                              const valMargen = p.margen ?? p.Margen ?? 0;

                              // --- Cálculo visual del Real % ---
                              const costoUnitario = Number(productoForm.costo_unitario) || 0;
                              const tasaIva = Number(productoForm.tasa_iva) || 0;
                              const costoConIva = costoUnitario * (1 + tasaIva);
                              let valReal = 0;
                              if (costoConIva > 0) {
                                valReal = (valPrecio - costoConIva) / costoConIva;
                              }

                              return (
                                <TableRow key={index} hover>
                                  <TableCell>{numLista}</TableCell>
                                  <TableCell>{descLista}</TableCell>

                                  {/* PRECIO EDITABLE */}
                                  <TableCell align="right">
                                    <TextField
                                      type="number"
                                      variant="standard"
                                      // Leemos p.precio (lo nuevo) o p.Precio (lo que viene de BD)
                                      value={p.precio ?? p.Precio ?? 0}
                                      onChange={(e) => handlePrecioLocalChange(index, 'precio', e.target.value)}
                                      onFocus={(e) => e.target.select()} // Selecciona todo al dar clic para borrar rápido
                                      onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()} // Evita cambios con el scroll
                                      inputProps={{
                                        step: "any",
                                        style: { textAlign: 'right', fontWeight: 'bold', width: '100px' }
                                      }}
                                      InputProps={{ startAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold', mr: 1 }}>$</Typography> }}
                                    />
                                  </TableCell>

                                  {/* MARGEN EDITABLE */}
                                  <TableCell align="right">
                                    <TextField
                                      type="number"
                                      variant="standard"
                                      value={p.margen ?? p.Margen ?? 0}
                                      onChange={(e) => handlePrecioLocalChange(index, 'margen', e.target.value)}
                                      onFocus={(e) => e.target.select()}
                                      onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                                      inputProps={{
                                        // MAGIA 3: Cambiamos "any" por "1" para que las flechitas suban de entero en entero
                                        step: "1",
                                        style: { textAlign: 'right', width: '80px' }
                                      }}
                                      InputProps={{ endAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold', ml: 0.5 }}>%</Typography> }}
                                    />
                                  </TableCell>

                                  {/* REAL % (SOLO LECTURA CALCULADO) */}
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
                              <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#999' }}>
                                {claveSeleccionada ? "Cargando precios..." : "Se generarán al guardar."}
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
                      <Grid item xs={12}><TextField {...modalCommonProps} label="Clave SAP" name="clave_sap" value={productoForm.clave_sap} onChange={handleProductoChange} /></Grid>
                      <Grid item xs={12}>
                        <TextField {...modalSelectProps} select label="Finalidad" name="finalidad" value={productoForm.finalidad} onChange={handleProductoChange}>
                          {finalidades.map((f) => (<MenuItem key={f.id} value={f.id}>{f.descripcion}</MenuItem>))}
                        </TextField>
                      </Grid><Grid item xs={12} md={3}>
                        <TextField
                          {...modalCommonProps}
                          label="Comisión (%)"
                          name="comision"
                          type="number"
                          value={Math.round(Number(productoForm.comision || 0) * 100)}
                          onChange={handleProductoChange}
                          inputProps={{ step: "1" }}
                          InputProps={{ endAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold' }}>%</Typography> }}
                        />
                      </Grid> </Grid>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={modalSectionStyle}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} /> Control Interno
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}><TextField {...modalSelectProps} select label="Sucursal Origen" name="sucursal_origen" value={productoForm.sucursal_origen} onChange={handleProductoChange}>{/* Mapeo dinámico de la API */}{sucursales.map((suc) => (<MenuItem key={suc.id} value={suc.id}>{suc.descripcion}</MenuItem>))}</TextField></Grid>
                      <Grid item xs={6}><TextField {...modalCommonProps} type="date" label="Fecha de Alta" value={productoForm.fecha_alta} InputLabelProps={{ shrink: true }} disabled sx={{ ...modalCommonProps.sx, '& .MuiInputBase-root': { bgcolor: '#f5f5f5' } }} /></Grid>
                      <Grid item xs={6}><TextField {...modalCommonProps} type="date" label="Última Modificación" value={productoForm.fecha_act} InputLabelProps={{ shrink: true }} disabled sx={{ ...modalCommonProps.sx, '& .MuiInputBase-root': { bgcolor: '#f5f5f5' } }} /></Grid>
                      <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Unidades Paq. TX" type="number" name="unidad_paq_traspaso" value={productoForm.unidad_paq_traspaso} onChange={handleProductoChange} /></Grid>
                      <Grid item xs={12} md={4}><TextField {...modalCommonProps} label="Plan B (Días Rotación)" name="dias_rotacion" value={productoForm.dias_rotacion} disabled sx={{ ...modalCommonProps.sx, '& .MuiInputBase-root': { bgcolor: '#f5f5f5' } }} /></Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={modalSectionStyle}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 4, height: 20, backgroundColor: '#d32f2f', borderRadius: 2 }} />
                      Cantidades a Descargar
                    </Typography>

                    <TableContainer component={Paper} sx={{ maxWidth: '100%', maxHeight: 250, borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Cantidad</TableCell>
                            <TableCell sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold', textAlign: 'center', width: '50px' }}>Acción</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cantidadesDescarga.map((c, index) => (
                            <TableRow key={index} hover>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  variant="standard"
                                  value={c.cantidad ?? c.Cantidad ?? 0}
                                  onChange={(e) => handleCantidadChange(index, e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  inputProps={{ step: "any", style: { textAlign: 'center' } }}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton size="small" color="error" onClick={() => handleDeleteCantidad(index)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={2} align="center">
                              <Button size="small" onClick={handleAddCantidad} sx={{ color: '#b71c1c', fontWeight: 'bold' }}>
                                + Agregar Fila
                              </Button>
                            </TableCell>
                          </TableRow>
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
                      { label: "Es Insumo", name: "es_insumo" },
                      { label: "Fraccionable", name: "fraccionable" },
                      { label: "Es Kit", name: "es_kit" },
                      { label: "Es Servicio", name: "es_servicio" },
                      { label: "Obsoleto", name: "obsoleto" },
                      { label: "Controlado", name: "controlado" },
                      { label: "Inventariable", name: "inventariable" },
                      { label: "Es Producto", name: "es_producto" },
                      { label: "Producto Libre", name: "producto_libre" },
                      { label: "Entrega Directa de Proveedor", name: "entrega_directa" }
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
      <Dialog
        open={openClonador}
        onClose={() => setOpenClonador(false)}
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
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Generar Clon
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Se creará un producto idéntico tomando como base la clave: {claveSeleccionada}
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton
            onClick={() => setOpenClonador(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 4, backgroundColor: '#ffffff', textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: '#333', mb: 4, fontWeight: 500 }}>
            Ingrese la nueva clave para el producto clonado.
          </Typography>

          <TextField
            fullWidth
            autoFocus
            label="Nueva Clave"
            variant="outlined"
            value={nuevaClaveClon}
            onChange={(e) => setNuevaClaveClon(e.target.value)}
            placeholder="Ej. NUEVA-CLAVE-123"
            InputLabelProps={{ shrink: true }}
            onKeyDown={(e) => e.key === 'Enter' && handleEjecutarClon()}
            sx={{
              '& .MuiInputBase-root': { height: '50px', borderRadius: '8px' }
            }}
          />
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa', justifyContent: 'center', gap: 2 }}>
          <Button
            onClick={() => setOpenClonador(false)}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEjecutarClon}
            disabled={loading || !nuevaClaveClon.trim()}
            sx={{
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            {loading ? "Clonando..." : "Confirmar Clonación"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL DE SUSTITUTOS --- */}
      <ModalSustitutos
        open={openSustitutos}
        onClose={() => setOpenSustitutos(false)}
        consumoApi={consumoApi}
        setMessage={setMessage}
        productoForm={productoForm}
      />

      {/* --- MODAL COMPONENTES KIT --- */}
      <Dialog
        open={openKit}
        onClose={() => setOpenKit(false)}
        maxWidth="md"
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
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Catálogo de Descargas - Kits
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Gestione los componentes que conforman este Kit
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton
            onClick={() => setOpenKit(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>

          {/* INFO DEL PRODUCTO PADRE */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" sx={{ color: '#666' }}><strong>Clave KIT:</strong> {productoForm.clave_prod}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: '#333', fontWeight: 500 }}>{productoForm.descripcion}</Typography>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Clave</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Descripción</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Cant.</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Costo c/IVA</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Costo s/IVA</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', width: '50px', borderBottom: '2px solid #000' }}>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* FILA DE CAPTURA DUAL CON FILTRADO EN TIEMPO REAL */}
                <TableRow sx={{ bgcolor: '#f8f9fa', borderBottom: '2px solid #ccc' }}>
                  {/* AUTOCOMPLETE CLAVE */}
                  <TableCell sx={{ width: '150px', borderBottom: '1px solid #e0e0e0' }}>
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
                        if (!search) return options.slice(0, 50);
                        return options.filter(o => String(o?.clave || "").toLowerCase().includes(search)).slice(0, 50);
                      }}
                      renderInput={(params) => <TextField {...params} label="Clave" variant="standard" />}
                    />
                  </TableCell>

                  {/* AUTOCOMPLETE DESCRIPCIÓN */}
                  <TableCell sx={{ minWidth: 250, borderBottom: '1px solid #e0e0e0' }}>
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
                        if (!search) return options.slice(0, 50);
                        return options.filter(o => String(o?.descripcion1 || "").toLowerCase().includes(search)).slice(0, 50);
                      }}
                      renderInput={(params) => <TextField {...params} label="Descripción del Componente" variant="standard" />}
                    />
                  </TableCell>

                  {/* CANTIDAD A DESCONTAR */}
                  <TableCell align="center" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                    <TextField
                      type="number" size="small" variant="standard"
                      value={nuevaCantKit} onChange={(e) => setNuevaCantKit(Number(e.target.value))}
                      sx={{ width: 60 }}
                      inputProps={{ style: { textAlign: 'center' } }}
                    />
                  </TableCell>

                  {/* PREVISUALIZACIÓN DE COSTOS */}
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32', borderBottom: '1px solid #e0e0e0' }}>
                    ${itemSeleccionado && itemSeleccionado.costo_iva != null ? Number(itemSeleccionado.costo_iva).toFixed(2) : "0.00"}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                    ${itemSeleccionado && itemSeleccionado.costo_sin_iva != null ? Number(itemSeleccionado.costo_sin_iva).toFixed(2) : "0.00"}
                  </TableCell>

                  {/* BOTÓN AGREGAR */}
                  <TableCell align="center" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddSelectedProduct}
                      sx={{ bgcolor: '#000000ff', color: 'white', minWidth: '40px', '&:hover': { bgcolor: '#333' } }}
                    >
                      +
                    </Button>
                  </TableCell>
                </TableRow>

                {/* LISTA DE COMPONENTES AGREGADOS */}
                {(componentesKit || []).map((item, idx) => (
                  <TableRow key={idx} hover sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4', fontWeight: 500 }}>{item.clave}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{item.descripcion}</TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(item.cantidad || 0).toFixed(3)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4', color: '#2e7d32', fontWeight: 500 }}>${Number(item.costo_iva || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4', color: '#666' }}>${Number(item.costo_sin_iva || 0).toFixed(2)}</TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>
                      <IconButton size="small" color="error" onClick={() => setComponentesKit(componentesKit.filter((_, i) => i !== idx))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {/* TOTALES FINALES */}
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell colSpan={2} align="right" sx={{ borderBottom: 'none' }}><strong>TOTALES:</strong></TableCell>
                  <TableCell align="center" sx={{ borderBottom: 'none' }}><strong>{componentesKit.reduce((sum, i) => sum + Number(i.cantidad || 0), 0).toFixed(3)}</strong></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32', borderBottom: 'none' }}>
                    ${componentesKit.reduce((sum, i) => sum + (Number(i.costo_iva || 0) * Number(i.cantidad || 0)), 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                    ${componentesKit.reduce((sum, i) => sum + (Number(i.costo_sin_iva || 0) * Number(i.cantidad || 0)), 0).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none' }} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button
            onClick={() => setOpenKit(false)}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveKit}
            variant="contained"
            disabled={loadingSaveKit}
            sx={{
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            {loadingSaveKit ? "Guardando..." : "Guardar Kit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL BITÁCORA DE LA CLAVE --- */}
      <Dialog
        open={openBitacora}
        onClose={() => setOpenBitacora(false)}
        maxWidth="lg"
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
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              📋 Bitácora de Movimientos (Historial)
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Consulta todos los cambios y actualizaciones realizados a esta clave
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton
            onClick={() => setOpenBitacora(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>

          <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <Typography variant="body2" sx={{ color: '#666' }}><strong>Clave:</strong> {productoForm.clave_prod}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#333', fontWeight: 500 }}><strong>Descripción Actual:</strong> {productoForm.descripcion}</Typography>
          </Box>

          {/* Tabla con scroll horizontal habilitado para ver los 39 campos en el orden de Access */}
          <TableContainer component={Paper} sx={{ maxHeight: 500, borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: 'none', overflowX: 'auto' }}>
            <Table stickyHeader size="small" sx={{ minWidth: 4000 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>ID</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap', borderBottom: '2px solid #000' }}>FECHA CAMBIO</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>IP</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>ESTATUS</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>CLAVE PROD</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap', borderBottom: '2px solid #000' }}>FECHA ALTA</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap', borderBottom: '2px solid #000' }}>FECHA ACTUALIZACION</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', minWidth: 250, borderBottom: '2px solid #000' }}>DESCRIPCION</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', minWidth: 150, borderBottom: '2px solid #000' }}>DESCRIPCION CORTA</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>SUCURSAL ORIGEN</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>MARCA</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>AREA</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>DEPTO</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>CLASE</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', minWidth: 200, borderBottom: '2px solid #000' }}>OBSERVACIONES</TableCell>

                  {/* Checkboxes */}
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>INVENTARIABLE</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>EXCENTOS</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>CONTROLADO</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>ES FRACCION</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>OBSOLETO</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>ES KIT</TableCell>

                  {/* Costos, precios y cantidades */}
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>TASA IVA</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>COSTO</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>COSTO UNITARIO</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>COSTO PROMEDIO</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>COSTO UNITARIO AUTORIZADO</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>UNIDAD PAQ</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>UNIDAD PAQUETE TRASPASO</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>CANTIDAD 1</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>CANTIDAD 2</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>CANTIDAD 3</TableCell>

                  {/* Promociones y otros */}
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>PROMOCION</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>PORCENTAJE PROMOCION</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>PRECIO PROMOCION</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap', borderBottom: '2px solid #000' }}>FECHA INICIO</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap', borderBottom: '2px solid #000' }}>FECHA FINAL</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>DIAS ROTACION</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>TIPO COSTEO</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>VERSION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingBitacora ? (
                  <TableRow><TableCell colSpan={39} align="center" sx={{ py: 3, color: '#666' }}>Consultando historial en el servidor...</TableCell></TableRow>
                ) : bitacoraDatos.length > 0 ? (
                  bitacoraDatos.map((row, idx) => (
                    <TableRow key={idx} hover sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f5f5f5' } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.id}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', color: '#1a365d', fontWeight: 600, borderBottom: '1px solid #f1f3f4' }}>
                        {row.fecha_cambio ? String(row.fecha_cambio).replace('T', ' ').substring(0, 16) : ''}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', borderBottom: '1px solid #f1f3f4', color: '#666' }}>{row.ip}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: row.estatus === 'BAJA' ? '#d32f2f' : 'inherit', borderBottom: '1px solid #f1f3f4' }}>
                        {row.estatus}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #f1f3f4' }}>{row.clave_prod}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid #f1f3f4' }}>
                        {row.fecha_alta ? String(row.fecha_alta).replace('T', ' ').substring(0, 16) : ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid #f1f3f4' }}>
                        {row.fecha_act ? String(row.fecha_act).replace('T', ' ').substring(0, 16) : ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300, borderBottom: '1px solid #f1f3f4' }}>{row.descripcion}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200, borderBottom: '1px solid #f1f3f4' }}>{row.descripcion_corta}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.sucursal_origen}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.marca}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.area}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.depto}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.clase}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#666', maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderBottom: '1px solid #f1f3f4' }}>{row.observacion}</TableCell>

                      {/* Checkboxes */}
                      <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.inventariable ? 'SÍ' : 'NO'}</TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.excentos ? 'SÍ' : 'NO'}</TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.controlado ? 'SÍ' : 'NO'}</TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.es_fraccion ? 'SÍ' : 'NO'}</TableCell>
                      <TableCell align="center" sx={{ color: row.obsoleto ? '#d32f2f' : 'inherit', fontWeight: row.obsoleto ? 'bold' : 'normal', borderBottom: '1px solid #f1f3f4' }}>{row.obsoleto ? 'SÍ' : 'NO'}</TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.es_kit ? 'SÍ' : 'NO'}</TableCell>

                      {/* Costos, precios y cantidades */}
                      <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.tasa_iva || 0)}</TableCell>
                      <TableCell align="right" sx={{ color: '#666', borderBottom: '1px solid #f1f3f4' }}>${Number(row.costo || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500, borderBottom: '1px solid #f1f3f4' }}>${Number(row.costo_unitario || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>${Number(row.costo_promedio || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>${Number(row.costo_unitario_autorizado || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.unidad_paq}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.unidad_paq_traspaso}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.cantidad1}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.cantidad2}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.cantidad3}</TableCell>

                      {/* Promociones y otros */}
                      <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.promocion ? 'SÍ' : 'NO'}</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>{Number(row.porcentaje_promocion || 0)}%</TableCell>
                      <TableCell align="right" sx={{ color: '#e65100', fontWeight: 'bold', borderBottom: '1px solid #f1f3f4' }}>${Number(row.precio_promocion || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem', borderBottom: '1px solid #f1f3f4' }}>{row.fecha_inicio ? String(row.fecha_inicio).split('T')[0] : ''}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem', borderBottom: '1px solid #f1f3f4' }}>{row.fecha_final ? String(row.fecha_final).split('T')[0] : ''}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.dias_rotacion}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.tipo_costeo}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.version}</TableCell>
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
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button
            onClick={() => setOpenBitacora(false)}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cerrar Historial
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- MODAL DE BITÁCORA DE PRECIOS --- */}
      <Dialog
        open={openBitacoraPrecios}
        onClose={() => setOpenBitacoraPrecios(false)}
        maxWidth="md"
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
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Bitácora de Cambios de Precios
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Consulte el historial de modificaciones de precios para esta clave
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton
            onClick={() => setOpenBitacoraPrecios(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>

          {/* INFO DEL PRODUCTO */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <Typography variant="body2" sx={{ color: '#666' }}><strong>Clave:</strong> {productoForm.clave_prod}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#333', fontWeight: 500 }}><strong>Descripción:</strong> {productoForm.descripcion}</Typography>
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>ID</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', whiteSpace: 'nowrap', borderBottom: '2px solid #000' }}>Fecha Cambio</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Estatus</TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>IP</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Clave Lista</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Precio</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', borderBottom: '2px solid #000' }}>Margen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingBitacoraPrecios ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: '#666' }}>Consultando cambios de precios...</TableCell></TableRow>
                ) : bitacoraPreciosDatos.length > 0 ? (
                  bitacoraPreciosDatos.map((row, idx) => (
                    <TableRow key={idx} hover sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f5f5f5' } }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.id}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', color: '#1a365d', fontWeight: 600, borderBottom: '1px solid #f1f3f4' }}>
                        {row.fecha_cambio ? String(row.fecha_cambio).replace('T', ' ').substring(0, 16) : ''}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: row.estatus === 'Actual' ? '#2e7d32' : '#666', borderBottom: '1px solid #f1f3f4' }}>
                        {row.estatus}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#666', borderBottom: '1px solid #f1f3f4' }}>{row.ip}</TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #f1f3f4' }}>{row.clave_lista}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #f1f3f4' }}>
                        ${Number(row.precio || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid #f1f3f4' }}>
                        {Number(row.margen || 0)}%
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
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button
            onClick={() => setOpenBitacoraPrecios(false)}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cerrar
          </Button>
        </DialogActions>
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
    </Box>
  );
}