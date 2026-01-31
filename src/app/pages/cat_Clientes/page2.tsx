import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  IconButton,
  Toolbar,
  Divider
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Email as EmailIcon
} from '@mui/icons-material';

interface ClienteData {
  clave_cliente: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  ciudad: string;
  cp: string;
  sucursal: string;
  genero: string;
  telefono: string;
  colonia: string;
  estado: string;
  alta: string;
  clave_registro: string;
  suspendido: boolean;
}

const CatClientesForm: React.FC = () => {
  const [clienteData, setClienteData] = useState<ClienteData>({
    clave_cliente: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    ciudad: '',
    cp: '',
    sucursal: '',
    genero: '',
    telefono: '',
    colonia: '',
    estado: '',
    alta: '',
    clave_registro: '',
    suspendido: false
  });

  const [currentRecord, setCurrentRecord] = useState(1);
  const [totalRecords, setTotalRecords] = useState(100);

  const handleInputChange = (field: keyof ClienteData, value: string | boolean) => {
    setClienteData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const navigationButtons = [
    { icon: <FirstPageIcon />, label: 'Primero', action: () => setCurrentRecord(1) },
    { icon: <NavigateBeforeIcon />, label: 'Anterior', action: () => setCurrentRecord(Math.max(1, currentRecord - 1)) },
    { icon: <NavigateNextIcon />, label: 'Siguiente', action: () => setCurrentRecord(Math.min(totalRecords, currentRecord + 1)) },
    { icon: <LastPageIcon />, label: 'Último', action: () => setCurrentRecord(totalRecords) }
  ];

  const actionButtons = [
    { icon: <SearchIcon />, label: 'Buscar', color: 'primary' as const },
    { icon: <AddIcon />, label: 'Agregar', color: 'success' as const },
    { icon: <DeleteIcon />, label: 'Eliminar', color: 'error' as const },
    { icon: <SaveIcon />, label: 'Guardar', color: 'warning' as const }
  ];

  const printButtons = [
    { icon: <PrintIcon />, label: 'Imprimir Hoja', color: 'info' as const },
    { icon: <PrintIcon />, label: 'Imprimir Todo', color: 'info' as const },
    { icon: <EmailIcon />, label: 'Email APP', color: 'secondary' as const }
  ];

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
          Catálogo de Clientes
        </Typography>

        {/* Formulario */}
        <Box sx={{ mb: 4 }}>
          {/* Primera fila */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Clave del Cliente"
                value={clienteData.clave_cliente}
                onChange={(e) => handleInputChange('clave_cliente', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={clienteData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Apellido Paterno"
                value={clienteData.apellido_paterno}
                onChange={(e) => handleInputChange('apellido_paterno', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Apellido Materno"
                value={clienteData.apellido_materno}
                onChange={(e) => handleInputChange('apellido_materno', e.target.value)}
                size="small"
              />
            </Box>
          </Box>

          {/* Segunda fila */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="E-mail"
                value={clienteData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Ciudad"
                value={clienteData.ciudad}
                onChange={(e) => handleInputChange('ciudad', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="C.P."
                value={clienteData.cp}
                onChange={(e) => handleInputChange('cp', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Sucursal</InputLabel>
                <Select
                  value={clienteData.sucursal}
                  label="Sucursal"
                  onChange={(e) => handleInputChange('sucursal', e.target.value)}
                >
                  <MenuItem value="1">Sucursal 1</MenuItem>
                  <MenuItem value="2">Sucursal 2</MenuItem>
                  <MenuItem value="3">Sucursal 3</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Tercera fila */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Género</InputLabel>
                <Select
                  value={clienteData.genero}
                  label="Género"
                  onChange={(e) => handleInputChange('genero', e.target.value)}
                >
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Femenino</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Teléfono"
                value={clienteData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Colonia"
                value={clienteData.colonia}
                onChange={(e) => handleInputChange('colonia', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Estado"
                value={clienteData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                size="small"
              />
            </Box>
          </Box>

          {/* Cuarta fila */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'flex-start' } }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Alta"
                value={clienteData.alta}
                onChange={(e) => handleInputChange('alta', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Clave Registro"
                value={clienteData.clave_registro}
                onChange={(e) => handleInputChange('clave_registro', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={clienteData.suspendido}
                    onChange={(e) => handleInputChange('suspendido', e.target.checked)}
                    color="primary"
                  />
                }
                label="Suspendido"
              />
            </Box>
            <Box sx={{ flex: 1 }} />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Barra de herramientas */}
        <Toolbar sx={{ gap: 2, py: 1 }}>
          {/* Navegación */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {navigationButtons.map((btn, index) => (
              <IconButton
                key={index}
                onClick={btn.action}
                size="small"
                title={btn.label}
              >
                {btn.icon}
              </IconButton>
            ))}
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Acciones */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {actionButtons.map((btn, index) => (
              <Button
                key={index}
                variant="contained"
                color={btn.color}
                size="small"
                startIcon={btn.icon}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                {btn.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Impresión */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {printButtons.map((btn, index) => (
              <Button
                key={index}
                variant="outlined"
                color={btn.color}
                size="small"
                startIcon={btn.icon}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                {btn.label}
              </Button>
            ))}
          </Box>
        </Toolbar>

        {/* Indicador de registro */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Registro {currentRecord} de {totalRecords}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default CatClientesForm;