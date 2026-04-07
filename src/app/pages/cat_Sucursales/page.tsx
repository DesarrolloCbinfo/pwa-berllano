import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, CircularProgress, Alert, Typography, Grid, Paper, Checkbox } from '@mui/material';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { useSessionContext } from '../../../context/SessionProvider';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';

import PWABadge from '../../../PWABadge';

interface CatSucursal {
  cia: number;
  cve_sucursal: number;
  nombre: string;
  direccion: string | null;
  dias_devolucion: number;
  en_linea?: boolean | number;
  version: string;
  fecha_alta: string | null;
  fecha_act: string | null;
  validar_tx?: boolean | number;
  validar_rm?: boolean | number;
  clave_timbrador: number;
  min_records_val_tx: number;
  recibe_prov_all?: boolean | number;
  edita_costos_rm?: boolean | number;
  credito?: boolean | number;
  fondo?: string | number;
  montoAviso?: string | number;
  numeroAvisos?: string | number;
  importeCajaDespuesRetiros?: string | number;
}

export default function CatSucursales() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();
  const [rows, setRows] = useState<CatSucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar sucursal
  const [openAdd, setOpenAdd] = useState(false);
  const [cia, setCia] = useState('1');
  const [cve_sucursal, setCveSucursal] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [dias_devolucion, setDiasDevolucion] = useState('');
  const [en_linea, setEnLinea] = useState(false);
  const [version, setVersion] = useState('');
  const [validar_tx, setValidar_tx] = useState(false);
  const [clave_timbrador, setClave_timbrador] = useState('');
  const [recibe_prov_all, setRecibe_prov_all] = useState(false);
  const [edita_costos_rm, setEdita_costos_rm] = useState(false);
  const [credito, setCredito] = useState(false);
  const [fondo, setFondo] = useState('');
  const [importe_retiros, setImporte_retiros] = useState('');
  const [numeroAvisos, setNumeroAvisos] = useState('');
  const [importeCajaDespuesRetiros, setImporteCajaDespuesRetiros] =
    useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar sucursal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editCia, setEditCia] = useState('1'); //Cia no se edita
  const [editCveSucursal, setEditCveSucursal] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editDiasDevolucion, setEditDiasDevolucion] = useState('');
  const [editEnLinea, setEditEnLinea] = useState(false);
  const [editVersion, setEditVersion] = useState('');
  const [editValidarTx, setEditValidarTx] = useState(false);
  const [editClaveTimbrador, setEditClaveTimbrador] = useState('');
  const [editRecipeProvAll, setEditRecipeProvAll] = useState(false);
  const [editEditaCostosRm, setEditEditaCostosRm] = useState(false);
  const [editCredito, setEditCredito] = useState(false);
  const [editFondo, setEditFondo] = useState('');
  const [editImporte_retiros, setEditImporte_retiros] = useState('');
  const [editNumeroAvisos, setEditNumeroAvisos] = useState('');
  const [editImporteCajaDespuesRetiros, setEditImporteCajaDespuesRetiros] =
    useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Elementos para ver detalles
  const [openView, setOpenView] = useState(false);
  const [viewData, setViewData] = useState<CatSucursal | null>(null);

  // Elementos para eliminar sucursal
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNombre, setDeleteNombre] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Función para manejar cambios en campos boolean
  const handleBooleanChange = async (field: string, id: number, newValue: boolean) => {
    try {
      const currentRow = rows.find(r => r.cve_sucursal === id);
      if (!currentRow) return;

      // Preparar parámetros base - igual que handleUpdate pero con datos actuales
      const baseParams: any = {
        cia: 1,
        cve_sucursal: id,
        nombre: currentRow.nombre || '',
        direccion: currentRow.direccion || currentRow.nombre || 'SIN_DIRECCION', // Usar nombre como fallback
        dias_devolucion: currentRow.dias_devolucion || 0,
        version: currentRow.version || '',
        clave_timbrador: currentRow.clave_timbrador || 1,
        fondo: parseFloat(currentRow.fondo?.toString() || '0') || 0,
        montoAviso: currentRow.montoAviso === null ? null : parseFloat(currentRow.montoAviso?.toString() || '0') || 0,
        numeroAvisos: parseInt(currentRow.numeroAvisos?.toString() || '0') || 0,
        importeCajaDespuesRetiros: parseFloat(currentRow.importeCajaDespuesRetiros?.toString() || '0') || 0,
      };

      // Agregar campos boolean según el campo que se está actualizando
      if (field === 'en_linea') {
        baseParams.en_linea = newValue ? 1 : 0;
        baseParams.VALIDAR_TX = currentRow.validar_tx ? 1 : 0;
        baseParams.RECIBE_PROV_ALL = currentRow.recibe_prov_all ? 1 : 0;
        baseParams.EDITA_COSTOS_RM = currentRow.edita_costos_rm ? 1 : 0;
        baseParams.CREDITO = currentRow.credito ? 1 : 0;
      } else if (field === 'validar_tx') {
        baseParams.en_linea = currentRow.en_linea ? 1 : 0;
        baseParams.VALIDAR_TX = newValue ? 1 : 0;
        baseParams.RECIBE_PROV_ALL = currentRow.recibe_prov_all ? 1 : 0;
        baseParams.EDITA_COSTOS_RM = currentRow.edita_costos_rm ? 1 : 0;
        baseParams.CREDITO = currentRow.credito ? 1 : 0;
      } else if (field === 'recibe_prov_all') {
        baseParams.en_linea = currentRow.en_linea ? 1 : 0;
        baseParams.VALIDAR_TX = currentRow.validar_tx ? 1 : 0;
        baseParams.RECIBE_PROV_ALL = newValue ? 1 : 0;
        baseParams.EDITA_COSTOS_RM = currentRow.edita_costos_rm ? 1 : 0;
        baseParams.CREDITO = currentRow.credito ? 1 : 0;
      } else if (field === 'edita_costos_rm') {
        baseParams.en_linea = currentRow.en_linea ? 1 : 0;
        baseParams.VALIDAR_TX = currentRow.validar_tx ? 1 : 0;
        baseParams.RECIBE_PROV_ALL = currentRow.recibe_prov_all ? 1 : 0;
        baseParams.EDITA_COSTOS_RM = newValue ? 1 : 0;
        baseParams.CREDITO = currentRow.credito ? 1 : 0;
      } else if (field === 'credito') {
        baseParams.en_linea = currentRow.en_linea ? 1 : 0;
        baseParams.VALIDAR_TX = currentRow.validar_tx ? 1 : 0;
        baseParams.RECIBE_PROV_ALL = currentRow.recibe_prov_all ? 1 : 0;
        baseParams.EDITA_COSTOS_RM = currentRow.edita_costos_rm ? 1 : 0;
        baseParams.CREDITO = newValue ? 1 : 0;
      }

      console.log('Enviando parámetros:', baseParams);

      const response = await consumoApi.put(
        '/api/CatSucursales/sp_bw_cat_sucursales_upd',
        {},
        {
          params: baseParams
        }
      );

      if (response.data?.[0]?.codigo === 0) {
        // Actualizar el estado local con una nueva referencia para forzar re-render
        setRows(prevRows => {
          const updatedRows = prevRows.map(row => 
            row.cve_sucursal === id 
              ? { ...row, [field]: newValue }
              : row
          );
          console.log('Rows actualizadas:', updatedRows.find(r => r.cve_sucursal === id));
          return [...updatedRows]; // Crear nueva referencia
        });
        
        // Forzar refresh completo de los datos
        setTimeout(() => {
          fetchSucursales();
        }, 500);
        
        console.log('Campo actualizado exitosamente');
      } else {
        console.error('Error en respuesta:', response.data);
        alert(response.data?.[0]?.mensaje1 || 'Error al actualizar el campo');
      }
    } catch (err) {
      console.error('Error al actualizar campo boolean:', err);
      if (err instanceof Error && 'response' in err) {
        const errorResponse = (err as any).response?.data;
        console.error('Detalles del error:', errorResponse);
        
        // Mostrar detalles específicos de validación
        if (errorResponse?.errors) {
          console.error('Errores de validación:', errorResponse.errors);
          const errorMessages = Object.entries(errorResponse.errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          alert(`Errores de validación:\n${errorMessages}`);
        } else {
          alert(errorResponse?.title || 'Error al actualizar el campo');
        }
      } else {
        alert('Error al actualizar el campo');
      }
    }
  };

  // Función para validar y manejar cambios en campos numéricos (solo positivos)
  const handleNumericChange = (value: string, setter: (value: string) => void, allowZero: boolean = true, formatDecimals: boolean = false) => {
    // Solo permitir números, punto decimal y signo negativo para validación
    let numericValue = value.replace(/[^0-9.-]/g, '');
    
    // Si está vacío, permitir
    if (numericValue === '') {
      setter('');
      return;
    }
    
    // Limitar a 2 decimales si hay punto decimal
    if (numericValue.includes('.')) {
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        // Múltiples puntos, mantener solo el primero
        numericValue = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts[1] && parts[1].length > 2) {
        // Más de 2 decimales, truncar a 2
        numericValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    
    // Convertir a número para validar
    const numValue = parseFloat(numericValue);
    
    // Validar que no sea NaN y que sea positivo (o cero si se permite)
    if (!isNaN(numValue) && (allowZero ? numValue >= 0 : numValue > 0)) {
      // Si se requiere formato de 2 decimales, aplicarlo solo si no tiene decimales o si es un número redondo
      if (formatDecimals && !isNaN(numValue)) {
        // Si el valor no tiene decimales, formatear a 2 decimales
        if (!numericValue.includes('.')) {
          setter(numValue.toFixed(2));
        } else {
          // Si ya tiene decimales, mantener el valor truncado a 2 decimales
          setter(numericValue);
        }
      } else {
        setter(numericValue);
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
          <IconButton onClick={(e) => { e.stopPropagation(); handleEditOpen(params.row); }} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            color='error'
            onClick={(e) => { e.stopPropagation(); handleDeleteOpen(params.row); }}
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
    { field: 'cve_sucursal', headerName: 'Clave', width: 80, type: 'number' },
    { field: 'nombre', headerName: 'Sucursal', width: 150, type: 'string'},
    { field: 'en_linea',headerName: 'Activa', width: 150, renderCell: (params) => (<Checkbox 
          key={`en_linea-${params.row.cve_sucursal}-${params.value}`}
          checked={!!params.value}
      onChange={(e) => {
        e.stopPropagation();
        handleBooleanChange('en_linea', params.row.cve_sucursal, e.target.checked);
      }}
      size="small"
    />
    )
    },
    { field: 'direccion', headerName: 'Dirección', width: 250 },
    { field: 'dias_devolucion', headerName: 'Días Dev', width: 150 },
    { 
      field: 'RECIBE_PROV_ALL', 
      headerName: 'Recibe All Pro V', 
      width: 150,
      renderCell: (params) => (
        <Checkbox
          key={`recibe_prov_all-${params.row.cve_sucursal}-${params.value}`}
          checked={!!params.value}
          onChange={(e) => {
            e.stopPropagation();
            handleBooleanChange('recibe_prov_all', params.row.cve_sucursal, e.target.checked);
          }}
          size="small"
        />
      )
    },
    { 
      field: 'EDITA_COSTOS_RM', 
      headerName: 'Edita Cto RM', 
      width: 150,
      renderCell: (params) => (
        <Checkbox
          key={`edita_costos_rm-${params.row.cve_sucursal}-${params.value}`}
          checked={!!params.value}
          onChange={(e) => {
            e.stopPropagation();
            handleBooleanChange('edita_costos_rm', params.row.cve_sucursal, e.target.checked);
          }}
          size="small"
        />
      )
    },
    { 
      field: 'CREDITO', 
      headerName: 'Crédito', 
      width: 150,
      renderCell: (params) => (
        <Checkbox
          key={`credito-${params.row.cve_sucursal}-${params.value}`}
          checked={!!params.value}
          onChange={(e) => {
            e.stopPropagation();
            handleBooleanChange('credito', params.row.cve_sucursal, e.target.checked);
          }}
          size="small"
        />
      )
    },
    { 
      field: 'VALIDAR_TX', 
      headerName: 'Control TX', 
      width: 150,
      renderCell: (params) => (
        <Checkbox
          key={`validar_tx-${params.row.cve_sucursal}-${params.value}`}
          checked={!!params.value}
          onChange={(e) => {
            e.stopPropagation();
            handleBooleanChange('validar_tx', params.row.cve_sucursal, e.target.checked);
          }}
          size="small"
        />
      )
    },
    { 
      field: 'fondo', 
      headerName: 'Fondo de Caja', 
      width: 150,
      renderCell: (params) => (
        <span>
          ${parseFloat(params.value || 0).toFixed(2)}
        </span>
      )
    },
    { 
      field: 'importe_retiros', 
      headerName: 'Monto Aviso', 
      width: 150,
      renderCell: (params) => (
        <span>
          ${parseFloat(params.value || 0).toFixed(2)}
        </span>
      )
    },
    { 
      field: 'numeroAvisos', 
      headerName: 'Número Avisos', 
      width: 150 
    },
    { 
      field: 'importeCajaDespuesRetiros', 
      headerName: 'Importe en Caja Despues Retiros', 
      width: 150,
      renderCell: (params) => (
        <span>
          ${parseFloat(params.value || 0).toFixed(2)}
        </span>
      )
    },
    {
      field: 'fecha_alta',
      headerName: 'Fecha Alta',
      width: 180,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleString() : '-',
    },
    {
      field: 'fecha_act',
      headerName: 'Fecha Actualización',
      width: 180,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleString() : '-',
    },
    { field: 'clave_timbrador', headerName: 'Lista de Precios', width: 150 },
    { field: 'version', headerName: 'Abreviatura', width: 100 },
  ];

  const handleViewOpen = (row: CatSucursal) => {
    setViewData(row);
    setOpenView(true);
  };

  const handleEditOpen = (row: CatSucursal) => {
    console.log('Opening edit for row:', row);
    setEditId(row.cve_sucursal);
    setEditCveSucursal(row.cve_sucursal.toString());
    setEditNombre(row.nombre);
    setEditDireccion(row.direccion || '');
    setEditDiasDevolucion(row.dias_devolucion?.toString() || '0');
    setEditEnLinea((row.en_linea as boolean) || false);
    setEditVersion(row.version || '');
    setEditValidarTx((row.validar_tx as boolean) || false);
    setEditClaveTimbrador(row.clave_timbrador?.toString() || '1');
    setEditRecipeProvAll((row.recibe_prov_all as boolean) || false);
    setEditEditaCostosRm((row.edita_costos_rm as boolean) || false);
    setEditCredito((row.credito as boolean) || false);
    setEditFondo(row.fondo?.toString() || '');
    setEditImporte_retiros(row.importe_retiros?.toString() || '');
    setEditNumeroAvisos(row.numeroAvisos?.toString() || '');
    setEditImporteCajaDespuesRetiros(
      row.importeCajaDespuesRetiros?.toString() || '',
    );
    setTimeout(() => setOpenEdit(true), 0);
  };

  const handleDeleteOpen = async (row: CatSucursal) => {
    // Confirmación antes de eliminar
    const result = await Swal.fire({
      title: '¿Eliminar sucursal?',
      text: `¿Estás seguro de eliminar la sucursal "${row.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      setDeleteId(row.cve_sucursal);
      setDeleteNombre(row.nombre);
      // Ejecutar eliminación directamente
      try {
        setSaving(true);
        
        const response = await consumoApi.delete(
          '/api/CatSucursales/sp_bw_cat_sucursales_del',
          {
            params: {
              cve_sucursal: row.cve_sucursal
            }
          }
        );
        
        if (response.data?.[0]?.codigo === 0) {
          fetchSucursales();
          
          // Alerta de éxito
          Swal.fire({
            icon: 'success',
            title: '¡Sucursal eliminada!',
            text: `La sucursal "${row.nombre}" se eliminó exitosamente`,
            confirmButtonColor: '#3085d6',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: response.data?.[0]?.mensaje1 || 'Error al eliminar la sucursal',
            confirmButtonColor: '#d33',
          });
        }
      } catch (err) {
        console.error('Error al eliminar sucursal:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'Error al eliminar la sucursal',
          confirmButtonColor: '#d33',
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setSaving(true);
      
      const response = await consumoApi.delete(
        '/api/CatSucursales/sp_bw_cat_sucursales_del',
        {
          params: {
            cve_sucursal: deleteId
          }
        }
      );
      
      if (response.data?.[0]?.codigo === 0) {
        setOpenDelete(false);
        fetchSucursales();
        
        // Alerta de éxito
        Swal.fire({
          icon: 'success',
          title: '¡Sucursal eliminada!',
          text: `La sucursal "${deleteNombre}" se eliminó exitosamente`,
          confirmButtonColor: '#3085d6',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: response.data?.[0]?.mensaje1 || 'Error al eliminar la sucursal',
          confirmButtonColor: '#d33',
        });
      }
    } catch (err) {
      console.error('Error al eliminar sucursal:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: 'Error al eliminar la sucursal',
        confirmButtonColor: '#d33',
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchSucursales = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatSucursales/sp_bw_cat_sucursales_sel',
        {
          params: {
            cve_sucursal: 0
          }
        }
      );
      
      const data = response.data.map((item: any) => {
        console.log('Item de API:', item);
        const mappedItem = {
          ...item,
          validar_tx: item.VALIDAR_TX,
          recibe_prov_all: item.RECIBE_PROV_ALL,
          edita_costos_rm: item.EDITA_COSTOS_RM,
          credito: item.CREDITO,
          // Convertir campos numéricos null a 0 para mostrar en la tabla
          fondo: item.fondo || 0,
          importe_retiros: item.importe_retiros || 0,
          numeroAvisos: item.numeroAvisos || 0,
          importeCajaDespuesRetiros: item.importeCajaDespuesRetiros || 0,
        };
        console.log('Item mapeado:', mappedItem);
        return mappedItem;
      });
      
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSucursales();
  }, []);

  // Función para limpiar el formulario de agregar
  const clearAddForm = () => {
    setCveSucursal('');
    setNombre('');
    setDireccion('');
    setDiasDevolucion('0');
    setEnLinea(true);
    setVersion('');
    setValidar_tx(false);
    setClave_timbrador('1');
    setRecibe_prov_all(false);
    setEdita_costos_rm(false);
    setCredito(false);
    setFondo('');
    setImporte_retiros('');
    setNumeroAvisos('');
    setImporteCajaDespuesRetiros('');
  };

  const handleAdd = async () => {
    if (!nombre) {
      Swal.fire({
        icon: 'error',
        title: 'Campo requerido',
        text: 'Por favor, ingresa el nombre de la sucursal',
        confirmButtonColor: '#d33',
      });
      return;
    }

    try {
      setSaving(true);

      const response = await consumoApi.post(
        '/api/CatSucursales/sp_bw_cat_sucursales_add',
        {},
        {
          params: {
            cia: 1,
            cve_sucursal: parseInt(cve_sucursal) || 0,
            nombre,
            direccion: direccion || '',
            dias_devolucion: parseInt(dias_devolucion) || 0,
            en_linea: en_linea ? 1 : 0,
            version: version || '',
            VALIDAR_TX: validar_tx ? 1 : 0,
            clave_timbrador: parseInt(clave_timbrador) || 1,
            RECIBE_PROV_ALL: recibe_prov_all ? 1 : 0,
            EDITA_COSTOS_RM: edita_costos_rm ? 1 : 0,
            CREDITO: credito ? 1 : 0,
            fondo: parseFloat(fondo) || 0,
            importe_retiros: parseFloat(importe_retiros) || 0,
            numeroAvisos: parseInt(numeroAvisos) || 0,
            importeCajaDespuesRetiros: parseFloat(importeCajaDespuesRetiros) || 0,
          },
        },
      );

      if (response.data?.[0]?.codigo === 0) {
        await fetchSucursales();
        setOpenAdd(false);
        
        // Reset campos
        setNombre('');
        setDireccion('');
        setCveSucursal('');
        setDiasDevolucion('0');
        setEnLinea(true);
        setVersion('');
        setValidar_tx(false);
        setClave_timbrador('1');
        setRecibe_prov_all(false);
        setEdita_costos_rm(false);
        setCredito(false);
        setFondo('');
        setImporte_retiros('');
        setNumeroAvisos('');
        setImporteCajaDespuesRetiros('');

        // Alerta de éxito
        Swal.fire({
          icon: 'success',
          title: '¡Sucursal agregada!',
          text: `La sucursal "${nombre}" se agregó exitosamente`,
          confirmButtonColor: '#3085d6',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al agregar',
          text: response.data?.[0]?.mensaje1 || 'Error al agregar la sucursal',
          confirmButtonColor: '#d33',
        });
      }
    } catch (err: any) {
      console.error('Error al agregar sucursal:', err);
      console.error('Detalles del error:', err.response?.data);
      console.error('Status:', err.response?.status);
      console.error('Headers:', err.response?.headers);
      console.error('Config:', err.config);
      
      const errorMsg = err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(', ')
        : err.response?.data?.title || err.response?.data?.message || err.message || 'Error al agregar la sucursal';
      
      Swal.fire({
        icon: 'error',
        title: 'Error al agregar',
        text: errorMsg,
        confirmButtonColor: '#d33',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    // Validación de campos obligatorios
    if (!editId || !editNombre) {
      Swal.fire({
        icon: 'error',
        title: 'Campos requeridos',
        text: 'Por favor, ingresa la clave y el nombre de la sucursal',
        confirmButtonColor: '#d33',
      });
      return;
    }

    try {
      setSavingEdit(true);

      const response = await consumoApi.put(
        '/api/CatSucursales/sp_bw_cat_sucursales_upd',
        {}, // Cuerpo de la petición vacío
        {
          params: {
            cia: 1,
            cve_sucursal: editId,
            nombre: editNombre,
            direccion: editDireccion || editNombre || 'SIN_DIRECCION', // Usar nombre como fallback
            dias_devolucion: parseInt(editDiasDevolucion) || 0,
            en_linea: editEnLinea ? 1 : 0,
            version: editVersion || editNombre?.substring(0, 3)?.toUpperCase() || 'SIN_VER', // Usar nombre como fallback
            VALIDAR_TX: editValidarTx ? 1 : 0,
            clave_timbrador: parseInt(editClaveTimbrador) || 1,
            RECIBE_PROV_ALL: editRecipeProvAll ? 1 : 0,
            EDITA_COSTOS_RM: editEditaCostosRm ? 1 : 0,
            CREDITO: editCredito ? 1 : 0,
            fondo: parseFloat(editFondo) || 0,
            importe_retiros: parseFloat(editImporte_retiros) || 0,
            numeroAvisos: parseInt(editNumeroAvisos) || 0,
            importeCajaDespuesRetiros: parseFloat(editImporteCajaDespuesRetiros) || 0,
          },
        },
      );

      if (response.data?.[0]?.codigo === 0) {
        await fetchSucursales();
        setOpenEdit(false);
        
        // Alerta de éxito
        Swal.fire({
          icon: 'success',
          title: '¡Sucursal actualizada!',
          text: `La sucursal "${editNombre}" se actualizó exitosamente`,
          confirmButtonColor: '#3085d6',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al actualizar',
          text: response.data?.[0]?.mensaje1 || 'Error al actualizar la sucursal',
          confirmButtonColor: '#d33',
        });
      }
    } catch (err: any) {
      console.error('Error al actualizar sucursal:', err);
      console.error('Detalles completos del error:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: err.response?.config,
        params: err.response?.config?.params
      });
      
      const errorMsg = err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(', ')
        : err.response?.data?.title || err.response?.data?.message || err.message || 'Error al actualizar la sucursal';
      
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: errorMsg,
        confirmButtonColor: '#d33',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  if (error) {
    return <Alert severity='error'>Error al cargar los datos: {error}</Alert>;
  }

  return (
    <>
<Box sx={{ p: 3, bgcolor: '#ececec', minHeight: '100vh' }}>
        
{/* ENCABEZADO ESTILO ELEGANTE */}
        <Box sx={{ p: 3, borderRadius: '8px', mb: 3, boxShadow: '0 4px 8px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
          
          {/* RECUADRO INTERIOR */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                      CATÁLOGO DE SUCURSALES
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

          {/* BOTÓN DENTRO DEL CONTENEDOR, PERO FUERA DEL RECUADRO */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              variant='contained' 
              onClick={() => {
                clearAddForm();
                setOpenAdd(true);
              }}
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
              + AGREGAR SUCURSAL
            </Button>
          </Box>
        </Box>
 
{/* CONTENEDOR DE LA TABLA ESTILO ELEGANTE CON COLUMNAS FIJAS */}
        <Box sx={{ p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)', bgcolor: 'white' }}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns} // Aquí le pasas la variable que definiste arriba
              getRowId={(row) => row.cve_sucursal}
              pageSizeOptions={[5, 10, 25, 100]}
              disableRowSelectionOnClick
              initialState={{
                pinnedColumns: {
                  left: ['acciones', 'cve_sucursal', 'nombre'], // Refuerza el fijado al cargar
                },
              }}
              sx={{ 
                border: 'none',
                height: '100%',
                '& .MuiDataGrid-columnHeaders': { borderBottom: '2px solid #000', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: '#f5f5f5' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                '& .MuiDataGrid-row': { cursor: 'default', transition: 'all 0.2s ease' },
                '& .MuiDataGrid-row:hover': { bgcolor: '#fafafa' }
              }}
            />
          </Box>
        </Box>
      </Box>

      <Dialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          maxWidth='md'
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: '#424242', 
            color: 'white',
            py: 2.5,
            px: 3
          }}>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Agregar Nueva Sucursal
            </Typography>
            <Typography variant='body2' sx={{ color: '#e0e0e0', mt: 0.5 }}>
              Complete la información de la sucursal en los campos correspondientes
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Identificación de la Sucursal */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Identificación de la Sucursal
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Nombre '
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label='Dirección'
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Versión'
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Días Devolución'
                      value={dias_devolucion}
                      onChange={(e) => handleNumericChange(e.target.value, setDiasDevolucion, true)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Configuración y Operación */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Configuración y Operación
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Lista de precios *'
                      value={clave_timbrador}
                      onChange={(e) => handleNumericChange(e.target.value, setClave_timbrador, false)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Fondo de Caja'
                      value={fondo}
                      onChange={(e) => handleNumericChange(e.target.value, setFondo, true, true)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Monto Aviso'
                      value={importe_retiros}
                      onChange={(e) => handleNumericChange(e.target.value, setImporte_retiros, true, true)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Número Avisos'
                      value={numeroAvisos}
                      onChange={(e) => handleNumericChange(e.target.value, setNumeroAvisos, true)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Importe Caja Después Retiros'
                      value={importeCajaDespuesRetiros}
                      onChange={(e) => handleNumericChange(e.target.value, setImporteCajaDespuesRetiros, true, true)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Opciones de Configuración */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Opciones de Configuración
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: 'white', 
                  p: 2.5, 
                  borderRadius: 1,
                  border: '1px solid #e0e0e0'
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={en_linea}
                          onChange={(e) => setEnLinea(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            En Línea *
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Habilitar operación en línea *
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={validar_tx}
                          onChange={(e) => setValidar_tx(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Validar TX
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Validar transacciones
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={recibe_prov_all}
                          onChange={(e) => setRecibe_prov_all(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Recibe Proveedor All
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Recibir de todos los proveedores
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={edita_costos_rm}
                          onChange={(e) => setEdita_costos_rm(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Edita Costos RM
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Permitir edición de costos
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={credito}
                          onChange={(e) => setCredito(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Crédito
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Habilitar ventas a crédito
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setOpenAdd(false)}
              sx={{ textTransform: 'uppercase', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              variant='contained'
              onClick={handleAdd}
              disabled={saving}
              sx={{ 
                bgcolor: '#212121',
                textTransform: 'uppercase',
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  bgcolor: '#424242'
                }
              }}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openView}
          onClose={() => setOpenView(false)}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>Detalles de Sucursal</DialogTitle>

          <DialogContent sx={{ mt: 2 }}>
            {viewData && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Clave Sucursal
                  </Typography>
                  <Typography variant='body1'>{viewData.cve_sucursal}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Nombre
                  </Typography>
                  <Typography variant='body1'>{viewData.nombre}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Dirección
                  </Typography>
                  <Typography variant='body1'>{viewData.direccion || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Versión
                  </Typography>
                  <Typography variant='body1'>{viewData.version || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Días Devolución
                  </Typography>
                  <Typography variant='body1'>{viewData.dias_devolucion || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Clave Timbrador
                  </Typography>
                  <Typography variant='body1'>{viewData.clave_timbrador || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Fondo
                  </Typography>
                  <Typography variant='body1'>{viewData.fondo || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Monto Aviso
                  </Typography>
                  <Typography variant='body1'>{viewData.montoAviso || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Número Avisos
                  </Typography>
                  <Typography variant='body1'>{viewData.numeroAvisos || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666' }}>
                    Importe Caja Después Retiros
                  </Typography>
                  <Typography variant='body1'>{viewData.importeCajaDespuesRetiros || '-'}</Typography>
                </Box>
                
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                    Configuración
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant='caption' sx={{ color: '#999' }}>En Línea:</Typography>
                      <Typography variant='body2'>{viewData.en_linea ? 'Sí' : 'No'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' sx={{ color: '#999' }}>Validar TX:</Typography>
                      <Typography variant='body2'>{viewData.validar_tx ? 'Sí' : 'No'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' sx={{ color: '#999' }}>Recibe Prov All:</Typography>
                      <Typography variant='body2'>{viewData.recibe_prov_all ? 'Sí' : 'No'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' sx={{ color: '#999' }}>Edita Costos RM:</Typography>
                      <Typography variant='body2'>{viewData.edita_costos_rm ? 'Sí' : 'No'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' sx={{ color: '#999' }}>Crédito:</Typography>
                      <Typography variant='body2'>{viewData.credito ? 'Sí' : 'No'}</Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 1, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                  <Typography variant='caption' sx={{ color: '#999' }}>Fecha Alta:</Typography>
                  <Typography variant='body2'>
                    {viewData.fecha_alta ? new Date(viewData.fecha_alta).toLocaleString() : '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='caption' sx={{ color: '#999' }}>Fecha Actualización:</Typography>
                  <Typography variant='body2'>
                    {viewData.fecha_act ? new Date(viewData.fecha_act).toLocaleString() : '-'}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenView(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          maxWidth='md'
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: '#424242', 
            color: 'white',
            py: 2.5,
            px: 3
          }}>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Editar Sucursal: {editCveSucursal}
            </Typography>
            <Typography variant='body2' sx={{ color: '#e0e0e0', mt: 0.5 }}>
              Complete la información de la sucursal en los campos correspondientes
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Identificación de la Sucursal */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Identificación de la Sucursal
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Clave Sucursal'
                      value={editCveSucursal}
                      disabled
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Nombre *'
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      required
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label='Dirección'
                      value={editDireccion}
                      onChange={(e) => setEditDireccion(e.target.value)}
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Versión'
                      value={editVersion}
                      onChange={(e) => setEditVersion(e.target.value)}
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Días Devolución'
                      value={editDiasDevolucion}
                      onChange={(e) => handleNumericChange(e.target.value, setEditDiasDevolucion, true)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Configuración y Operación */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Configuración y Operación
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Clave Timbrador'
                      value={editClaveTimbrador}
                      onChange={(e) => setEditClaveTimbrador(e.target.value)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Fondo'
                      value={editFondo}
                      onChange={(e) => handleNumericChange(e.target.value, setEditFondo, true)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label='Monto Aviso'
                      value={editImporte_retiros}
                      onChange={(e) => handleNumericChange(e.target.value, setEditImporte_retiros, true)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Número Avisos'
                      value={editNumeroAvisos}
                      onChange={(e) => handleNumericChange(e.target.value, setEditNumeroAvisos, true)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Importe Caja Después Retiros'
                      value={editImporteCajaDespuesRetiros}
                      onChange={(e) => handleNumericChange(e.target.value, setEditImporteCajaDespuesRetiros, true)}
                      type='number'
                      fullWidth
                      size='small'
                      sx={{ bgcolor: 'white' }}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Opciones de Configuración */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  borderLeft: '3px solid #424242',
                  pl: 1.5
                }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    Opciones de Configuración
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: 'white', 
                  p: 2.5, 
                  borderRadius: 1,
                  border: '1px solid #e0e0e0'
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={editEnLinea}
                          onChange={(e) => setEditEnLinea(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            En Línea
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Habilitar operación en línea
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={editValidarTx}
                          onChange={(e) => setEditValidarTx(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Validar TX
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Validar transacciones
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={editRecipeProvAll}
                          onChange={(e) => setEditRecipeProvAll(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Recibe Proveedor All
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Recibir de todos los proveedores
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={editEditaCostosRm}
                          onChange={(e) => setEditEditaCostosRm(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Edita Costos RM
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Permitir edición de costos
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}>
                        <input
                          type='checkbox'
                          checked={editCredito}
                          onChange={(e) => setEditCredito(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            Crédito
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#666' }}>
                            Habilitar ventas a crédito
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setOpenEdit(false)}
              sx={{ textTransform: 'uppercase', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              variant='contained'
              onClick={handleUpdate}
              disabled={savingEdit}
              sx={{ 
                bgcolor: '#212121',
                textTransform: 'uppercase',
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  bgcolor: '#424242'
                }
              }}
            >
              {savingEdit ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
          <DialogTitle>Eliminar Sucursal</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Seguro que deseas eliminar la sucursal{' '}
              <strong>{deleteNombre}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              disabled={saving}
            >
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>

        
      <PWABadge />
    </>
  );
}
