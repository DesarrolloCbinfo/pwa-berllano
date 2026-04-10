import React, { useState, useEffect, useMemo, useRef } from 'react'; // <--- Añadimos useRef
import { 
  Box, Typography, Button, TextField, Grid, 
  Snackbar, Alert, Paper, MenuItem, IconButton 
} from '@mui/material';
import { 
  DataGrid, GridColDef, GridToolbar, 
  GridPaginationModel, GridPagination, GridRenderCellParams // <--- Agregamos GridRenderCellParams
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete'; // <--- Agregamos DeleteIcon
import Swal from 'sweetalert2';

// OJO: Asegúrate de que esta línea exista para que no te salga el error de tu captura
import useConsumoApi from '../../../hooks/useConsumoApi'; 
import { useSessionContext } from '../../../context/SessionProvider';

const commonProps = {
  fullWidth: true, size: "small" as const, variant: "outlined" as const,
  sx: {
    '& .MuiInputBase-root': { height: '50px', alignItems: 'center', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderColor: '#999' } },
    '& .MuiInputLabel-root': { transform: 'translate(14px, 14px) scale(1)', color: '#666', fontWeight: 500 },
    '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)', color: '#333', fontWeight: 600 },
  }
};

const selectProps = {
    ...commonProps,
    SelectProps: { MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }
};

function CustomPagination() { return <GridPagination />; }

const initialFormState = { 
    cuenta: '', descripcion: '', no_cuenta: '', 
    tipo_cuenta: 1, banco: 0, cuenta_contable: '', tipo_poliza: 1 
};

export default function CuentasBancarias() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  const isSavingRef = useRef(false);

  const [rows, setRows] = useState<any[]>([]);
  // --- NUEVOS ESTADOS PARA LAS LISTAS ---
  const [tiposCuentas, setTiposCuentas] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  const [formData, setFormData] = useState(initialFormState);

  // Función interceptora para SweetAlert2
  const setMessage = (msg: { text: string, type: 'success' | 'error' | 'info' } | null) => {
    if (!msg) return;
    
    // Si es "info" (cuando editas directo en la tabla), lanzamos un Toast discreto
    if (msg.type === 'info') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: msg.text,
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    // Alertas estándar para éxito o validaciones (warning/error)
    Swal.fire({
      title: msg.type === 'success' ? '¡Éxito!' : 'Atención',
      text: msg.text,
      icon: msg.type === 'success' ? 'success' : (msg.type === 'error' ? 'error' : 'warning'),
      timer: msg.type === 'success' ? 2000 : undefined,
      showConfirmButton: msg.type !== 'success',
      confirmButtonColor: '#333'
    });
  };

  useEffect(() => { fetchCatalogos(); }, []);

  const fetchCatalogos = async () => {
      setLoading(true);
      try {
          // Cargamos las listas desplegables
          const resTipos = await consumoApi.get('/api/CuentasBancarias/sp_bw_cat_combo_tipos_cuentas');
          setTiposCuentas(Array.isArray(resTipos?.data) ? resTipos.data : []);

          const resBancos = await consumoApi.get('/api/CuentasBancarias/sp_bw_cat_combo_bancos');
          setBancos(Array.isArray(resBancos?.data) ? resBancos.data : []);

          // Cargamos la tabla principal
          const resTabla = await consumoApi.get('/api/CuentasBancarias/sp_bw_cat_cuentas_bancarias_sel');
          setRows(Array.isArray(resTabla?.data) ? resTabla.data : []);
      } catch (error) {
          setMessage({ text: 'Error al cargar catálogos.', type: 'error' });
      } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleAgregarNuevo = async () => {
        if (isSavingRef.current) return; 

        // Usamos 'info' para que dispare un warning visual
        if (!formData.cuenta.trim()) return setMessage({ text: "La Clave de la cuenta es obligatoria.", type: 'info' });
        if (!formData.descripcion.trim()) return setMessage({ text: "La descripción es obligatoria.", type: 'info' });

        isSavingRef.current = true;
        setSaving(true);
        try {
            const payload = {
                cia: 1,
                cuenta: formData.cuenta.toUpperCase(),
                descripcion: formData.descripcion.toUpperCase(),
                no_cuenta: formData.no_cuenta,
                tipo_cuenta: Number(formData.tipo_cuenta),
                banco: Number(formData.banco),
                cuenta_contable: formData.cuenta_contable,
                tipo_poliza: Number(formData.tipo_poliza)
            };

            const res = await consumoApi.post('/api/CuentasBancarias/sp_bw_cat_cuentas_bancarias_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `Cuenta bancaria agregada exitosamente.`, type: 'success' });
                fetchCatalogos();
                setFormData(initialFormState);
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al agregar el registro.", type: 'error' });
        } finally {
            isSavingRef.current = false;
            setSaving(false);
        }
    };

 const processRowUpdate = async (newRow: any, oldRow: any) => {
      if (
          newRow.Descripcion === oldRow.Descripcion &&
          newRow.No_cuenta === oldRow.No_cuenta &&
          newRow.Tipo_cuenta === oldRow.Tipo_cuenta &&
          newRow.Banco === oldRow.Banco &&
          newRow.cuenta_contable === oldRow.cuenta_contable &&
          newRow.Tipo_poliza === oldRow.Tipo_poliza
      ) return oldRow;

      try {
          const payload = {
              cia: newRow.Cia || 1,
              cuenta: newRow.Cuenta,
              descripcion: newRow.Descripcion?.toUpperCase() || '',
              no_cuenta: newRow.No_cuenta,
              tipo_cuenta: Number(newRow.Tipo_cuenta),
              banco: Number(newRow.Banco),
              cuenta_contable: newRow.cuenta_contable,
              tipo_poliza: Number(newRow.Tipo_poliza)
          };

          const res = await consumoApi.put('/api/CuentasBancarias/sp_bw_cat_cuentas_bancarias_upd', payload);
          if (res.status === 200) {
              setMessage({ text: " Cambios guardados automáticamente.", type: 'info' });
              return { ...newRow, Descripcion: payload.descripcion }; 
          } else throw new Error("Error en actualización");
      } catch (error) {
          setMessage({ text: "❌ Error al guardar los cambios.", type: 'error' });
          return oldRow;
      }
  };

const handleEliminar = async (clave: string) => {
      const confirmacion = await Swal.fire({
          title: '¿Estás seguro?',
          text: "¿Desea eliminar esta cuenta bancaria?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d32f2f',
          cancelButtonColor: '#333',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
      });

      if (!confirmacion.isConfirmed) return;

      setSaving(true);
      try {
          const res = await consumoApi.delete(`/api/CuentasBancarias/sp_bw_cat_cuentas_bancarias_del?cia=1&cuenta=${clave}`);
          if (res.status === 200) {
              setMessage({ text: "Cuenta bancaria eliminada.", type: 'success' });
              fetchCatalogos(); 
          }
      } catch (error: any) {
          setMessage({ text: error.response?.data?.mensaje || "Error al eliminar el registro.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

const columns = useMemo<GridColDef[]>(() => [
        { 
        field: 'acciones', headerName: 'Eliminar', width: 90, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            // IMPORTANTE: params.row.Cuenta lleva la "C" mayúscula porque así viene de tu SQL
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.Cuenta)}>
                <DeleteIcon />
            </IconButton>
        )
    },
    { field: 'Cuenta', headerName: 'Clave', width: 90, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    { field: 'Descripcion', headerName: 'Descripción', flex: 1, minWidth: 200, editable: true, align: 'left', headerAlign: 'center' },
    { field: 'No_cuenta', headerName: 'No. Cuenta', width: 150, editable: true, align: 'center', headerAlign: 'center' },
    { 
        field: 'Tipo_cuenta', headerName: 'Tipo Cta', width: 150, editable: true, align: 'center', headerAlign: 'center',
        type: 'singleSelect', valueOptions: tiposCuentas.map(t => ({ value: t.id, label: t.descripcion }))
    },
    { 
        field: 'Banco', headerName: 'Banco', width: 180, editable: true, align: 'center', headerAlign: 'center',
        type: 'singleSelect', valueOptions: bancos.map(b => ({ value: b.id, label: b.descripcion }))
    },
    { field: 'cuenta_contable', headerName: 'Cta Contable', width: 150, editable: true, align: 'center', headerAlign: 'center' },
    { field: 'Tipo_poliza', headerName: 'Tipo Póliza', width: 120, type: 'number', editable: true, align: 'center', headerAlign: 'center' },


  ], [tiposCuentas, bancos]);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      <Paper sx={{ p: 3, borderRadius: '8px' }}>

        {/* ENCABEZADO ESTILO ACCESS */}
        <Box sx={{ border: '1px solid #000000ff', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Catálogo de Cuentas Bancarias
                </Typography>
                
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                
            </Box>
        </Box>

        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12} md={1}>
                <TextField {...commonProps} label="Clave*" name="cuenta" value={formData.cuenta} onChange={handleInputChange} 
                    sx={{ width: '120px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} label="Descripción*" name="descripcion" value={formData.descripcion} onChange={handleInputChange} 
                    sx={{ width: '200px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={1}>
                <TextField {...commonProps} label="No. Cuenta" name="no_cuenta" value={formData.no_cuenta} onChange={handleInputChange} 
                    sx={{ width: '120px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={1}>
                <TextField {...selectProps} select label="Tipo Cta*" name="tipo_cuenta" value={formData.tipo_cuenta} onChange={handleInputChange}
                    sx={{ width: '120px', ...selectProps.sx }}>
                    {tiposCuentas.map(t => <MenuItem key={`t_${t.id}`} value={t.id}>{t.descripcion}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={1}>
                <TextField {...selectProps} select label="Banco*" name="banco" value={formData.banco} onChange={handleInputChange}
                    sx={{ width: '120px', ...selectProps.sx }}>
                    <MenuItem value={0}>-- SELECCIONE --</MenuItem>
                    {bancos.map(b => <MenuItem key={`b_${b.id}`} value={b.id}>{b.descripcion}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} label="Cta Contable" name="cuenta_contable" value={formData.cuenta_contable} onChange={handleInputChange} 
                    sx={{ width: '150px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={1}>
                <TextField {...commonProps} type="number" label="Tipo Póliza" name="tipo_poliza" value={formData.tipo_poliza} onChange={handleInputChange} 
                    sx={{ width: '100px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={2}>
                <Button variant="contained" onClick={handleAgregarNuevo} disabled={saving} fullWidth startIcon={<AddIcon />}
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
          <Paper sx={{ p: 3, width: '100%', mb: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)', backgroundColor: '#fff' }}>
            
            {/* EL SECRETO ESTÁ AQUÍ: Le damos un height estricto a esta caja */}
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid 
                  rows={Array.isArray(rows) ? rows : []} 
                  columns={columns} 
                  getRowId={(row) => row.Cuenta}
                  loading={loading || saving} 
                  paginationModel={paginationModel} 
                  onPaginationModelChange={setPaginationModel} 
                  pageSizeOptions={[50, 100, 500]} 
                  slots={{ toolbar: GridToolbar, pagination: CustomPagination }} 
                  slotProps={{ toolbar: { showQuickFilter: true } }} 
                  density="compact"
                  disableRowSelectionOnClick
                  processRowUpdate={processRowUpdate} 
                  onProcessRowUpdateError={(error) => console.error(error)}
                  sx={{ 
                      border: 'none', 
                      height: '100%', // <-- Y le decimos al DataGrid que llene ese 100%
                      '& .MuiDataGrid-columnHeaders': { borderBottom: '2px solid #000', fontSize: '1rem', fontWeight: 'bold' },
                      '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                      '& .MuiDataGrid-cell--editable': { backgroundColor: '#f9fbfd', cursor: 'text' }, 
                      '& .MuiDataGrid-cell--editing': { backgroundColor: '#fff', boxShadow: '0 0 5px rgba(25,118,210,0.5)' }
                  }} 
              />
            </Box>
            
          </Paper>
        </Box>



    </Box>
  );
}