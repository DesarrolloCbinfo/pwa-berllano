import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Paper, MenuItem
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import useConsumoApi from '../../../hooks/useConsumoApi'; 
import { useSessionContext } from '../../../context/SessionProvider';
import Swal from 'sweetalert2';

// --- INTERFACES ---
interface ValidacionRow {
  id: string;
  caja: number;
  no_venta: number;
  validar_admva: number;
  clave_prod: string;
  cant_producto: number;
  precio: number;
  cve_cliente: string;
  observacion: string;
  validado: number;
  permiteValidar: number;
}

interface Colaborador {
  id: number;
  nombre: string;
}

export default function ValidacionProductosServicios() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  // --- ESTADOS ---
  const [rows, setRows] = useState<ValidacionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaConsulta, setFechaConsulta] = useState<string>(() => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [colaboradorId, setColaboradorId] = useState<string>('');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);

  // --- COLUMNAS DEL DATAGRID ---
  const columns: GridColDef[] = [
    { 
      field: 'validar_admva', 
      headerName: 'Validar Admva.', 
      width: 130,
      headerAlign: 'center',
      align: 'center',
      type: 'boolean',
      valueGetter: (params) => params === 1
    },
    { 
      field: 'cve_cliente', 
      headerName: 'Cliente', 
      width: 150,
      headerAlign: 'center',
      align: 'left'
    },
    { 
      field: 'clave_prod', 
      headerName: 'Servicio', 
      width: 200,
      headerAlign: 'center',
      align: 'left'
    },
    { 
      field: 'cant_producto', 
      headerName: 'Cantidad', 
      width: 120,
      headerAlign: 'center',
      align: 'center',
      type: 'number'
    },
    { 
      field: 'precio', 
      headerName: 'Precio', 
      width: 120,
      headerAlign: 'center',
      align: 'right',
      type: 'number',
      valueFormatter: (params) => {
        if (params == null) return '';
        return `$${Number(params).toFixed(2)}`;
      }
    },
    { 
      field: 'validado', 
      headerName: 'Validado', 
      width: 120,
      headerAlign: 'center',
      align: 'center',
      type: 'boolean',
      valueGetter: (params) => params === 1
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => handleValidarServicio(params.row)}
          disabled={params.row.validado === 1}
        >
          Validar
        </Button>
      )
    }
  ];

  // --- CARGAR COLABORADORES ---
  const fetchColaboradores = async () => {
    try {
      const sucursalId = session?.sucursal?.toString() || null;
      const response = await consumoApi.get('/api/CatTrabajadoresValidacion/sp_bw_cat_trabajadoresvalidacion_sel', {
        params: {
          sucursalId: sucursalId,
          statusEmpleado: 1
        }
      });
      
      const mappedColaboradores = response.data.map((item: any) => ({
        id: item.clave_empleado,
        nombre: item.nombre_completo
      }));
      
      setColaboradores(mappedColaboradores);
    } catch (error) {
      console.error("Error cargando colaboradores", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los colaboradores'
      });
    }
  };

  // --- VALIDAR SERVICIO INDIVIDUAL ---
  const handleValidarServicio = async (row: ValidacionRow) => {
    const result = await Swal.fire({
      title: '¿Confirmar validación?',
      text: `¿Desea validar el servicio ${row.clave_prod} del cliente ${row.cve_cliente}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, validar',
      cancelButtonText: 'No'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await consumoApi.post('/api/CatTrabajadoresValidacion/validar', null, {
          params: {
            suc: session?.sucursal || 0,
            venta: row.no_venta,
            serv: row.clave_prod
          }
        });

        const resultado = response.data;

        if (resultado.codigo === 0) {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: resultado.mensaje1 || 'Servicio validado correctamente'
          });

          // Recargar datos
          await handleConsultar();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resultado.mensaje1 || 'No se pudo validar el servicio'
          });
        }
      } catch (error) {
        console.error('Error validando servicio:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo validar el servicio'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // --- VALIDAR SERVICIOS ---
  const handleValidar = async () => {
    const result = await Swal.fire({
      title: '¿Confirmar validación?',
      text: `¿Desea validar ${rows.length} servicio(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, validar',
      cancelButtonText: 'No'
    });

    if (result.isConfirmed) {
      setLoading(true);
      let exitosos = 0;
      let fallidos = 0;

      try {
        // Validar cada servicio individualmente
        for (const row of rows) {
          try {
            const response = await consumoApi.post('/api/CatTrabajadoresValidacion/validar', null, {
              params: {
                suc: session?.sucursal || 0,
                venta: row.no_venta,
                serv: row.clave_prod
              }
            });
            
            const resultado = response.data;
            if (resultado.codigo === 0) {
              exitosos++;
            } else {
              fallidos++;
            }
          } catch (error) {
            console.error(`Error validando servicio ${row.no_venta}:`, error);
            fallidos++;
          }
        }

        // Mostrar resultado
        if (fallidos === 0) {
          Swal.fire({
            icon: 'success',
            title: 'Validación exitosa',
            text: `Se validaron ${exitosos} servicio(s) correctamente`
          });
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Validación parcial',
            html: `<p>Exitosos: ${exitosos}</p><p>Fallidos: ${fallidos}</p>`
          });
        }
        
        // Recargar los datos después de validar
        handleConsultar();
      } catch (error) {
        console.error("Error en validación:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error durante la validación'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // --- CONSULTAR VALIDACIONES ---
  const handleConsultar = async () => {
    if (!fechaConsulta) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha requerida',
        text: 'Por favor seleccione una fecha de consulta'
      });
      return;
    }

    setLoading(true);
    try {
      // Convertir fecha de YYYY-MM-DD a YYYYMMDD
      const fechaFormateada = fechaConsulta.replace(/-/g, '');
      
      const response = await consumoApi.get('/api/CatTrabajadoresValidacion/consultar', {
        params: {
          sucursal: session?.sucursal || 0,
          fecha: fechaFormateada,
          colaborador: colaboradorId || ''
        }
      });

      // La API retorna un objeto con 'datos' y 'btnValidarEnabled'
      const datos = response.data?.datos || [];

      const mappedData = datos.map((item: any) => ({
        id: `${item.folio}-${Math.random()}`,
        caja: 1,
        no_venta: item.folio || 0,
        validar_admva: 0,
        clave_prod: item.claveServicio || item.clave_servicio || '',
        cant_producto: Number(item.cantProducto || item.cant_producto) || 0,
        precio: Number(item.precio) || 0,
        cve_cliente: item.cliente || '',
        observacion: '',
        validado: item.validado || 0,
        permiteValidar: 1
      }));

      setRows(mappedData);
      
      if (mappedData.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin resultados',
          text: 'No se encontraron servicios para los filtros seleccionados'
        });
      }
    } catch (error) {
      console.error("Error al consultar validaciones", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos'
      });
    } finally {
      setLoading(false);
    }
  };

  // --- CARGAR DATOS INICIALES ---
  useEffect(() => {
    fetchColaboradores();
  }, []);

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ENCABEZADO */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: '8px', 
        boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <Box sx={{ 
          borderBottom: '4px solid #000',
          pb: 2,
          mb: 3
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold',
              color: '#000',
              textAlign: 'center'
            }}
          >
            Validación
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 'bold',
              color: '#000',
              textAlign: 'center'
            }}
          >
            De Productos y Servicios
          </Typography>
        </Box>

        {/* FILTROS */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          alignItems: 'center',
          borderBottom: '2px solid #000',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 600, minWidth: '140px' }}>
              Fecha de consulta:
            </Typography>
            <TextField
              type="date"
              size="small"
              value={fechaConsulta}
              onChange={(e) => setFechaConsulta(e.target.value)}
              sx={{ 
                width: 180,
                '& .MuiInputBase-root': {
                  backgroundColor: '#fff'
                }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 600, minWidth: '100px' }}>
              Colaborador:
            </Typography>
            <TextField
              select
              size="small"
              value={colaboradorId}
              onChange={(e) => setColaboradorId(e.target.value)}
              sx={{ 
                minWidth: 250,
                '& .MuiInputBase-root': {
                  backgroundColor: '#fff'
                }
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {colaboradores.map((col) => (
                <MenuItem key={col.id} value={col.id}>
                  {col.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* BOTONES */}
          <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
            <Button
              variant="contained"
              onClick={handleConsultar}
              sx={{
                minWidth: 120,
                backgroundColor: '#c0c0c0',
                color: '#000',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#a0a0a0'
                }
              }}
            >
              Consultar
            </Button>
            
            <Button
              variant="contained"
              onClick={() => window.history.back()}
              sx={{
                minWidth: 120,
                backgroundColor: '#c0c0c0',
                color: '#000',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#a0a0a0'
                }
              }}
            >
              Salir
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* TABLA DE DATOS */}
      <Paper sx={{ 
        flex: 1, 
        p: 3, 
        borderRadius: '8px', 
        boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ 
          flex: 1, 
          width: '100%',
          '& .MuiDataGrid-root': {
            border: 'none'
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            borderBottom: '2px solid #000',
            fontSize: '0.95rem',
            fontWeight: 'bold'
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #e0e0e0'
          }
        }}>
          <DataGrid 
            rows={rows}
            columns={columns}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            density="compact"
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } }
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </Box>

        {/* BOTÓN VALIDAR - Solo aparece cuando hay registros */}
        {rows.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 3,
            pt: 2,
            borderTop: '1px solid #e0e0e0'
          }}>
            <Button
              variant="contained"
              onClick={handleValidar}
              sx={{
                minWidth: 120,
                backgroundColor: '#4caf50',
                color: '#fff',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#45a049'
                }
              }}
            >
              Validar
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
