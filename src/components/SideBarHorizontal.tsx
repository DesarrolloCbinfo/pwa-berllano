import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Button,
  Menu,
  MenuItem,
  Box,
  Card,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Select,
  FormControl,
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  Divider,
  ListItemButton,
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import { IUsuario } from "../interfaces/IUsuario";
import Swal from "sweetalert2";
import "../assets/styles/sidebar.css";
import logoImage from "../assets/imgs/berllanoLogo.png";
import useFetchData from "../hooks/useFetchData";
import { ICatSucursal } from "../app/pages/CatSucursal/interfaces/ICatSucursal";
import { CatSucursalApis } from "../app/pages/CatSucursal/apis/CatSucursalApis";
import useSession from "../hooks/useSession";
import { useSessionContext } from "../context/SessionProvider";
import { routes } from "../utils/Routes";
import { versionSistema } from "../utils/constGenerales";


const SidebarHorizontal = () => {
  const navigate = useNavigate();
  const session = useSession();
  const { setSession } = useSessionContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorCatalogos, setAnchorCatalogos] = useState<null | HTMLElement>(null);
  const [anchorModuloComercial, setAnchorModuloComercial] = useState<null | HTMLElement>(null);
  const [anchorPerfil, setAnchorPerfil] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openCatalogos = Boolean(anchorCatalogos);
  const openModuloComercial = Boolean(anchorModuloComercial);
  const openPerfil = Boolean(anchorPerfil);

  // Datos y funciones necesarias
  const dataSucursales = useFetchData<ICatSucursal>(CatSucursalApis.get);

  const handleSucursalSelect = (event: any) => {
    const selectedId = Number(event.target.value);

    if (!session || Number.isNaN(selectedId) || selectedId === 0 || selectedId === session.sucursal) {
      return;
    }

    const selectedSucursal = dataSucursales.find(
      (sucursal) => sucursal.sucursalId === selectedId
    );

    if (!selectedSucursal) {
      return;
    }

    const updatedSession: IUsuario = {
      ...session,
      sucursal: selectedSucursal.sucursalId,
      dSucursal: selectedSucursal.nombre,
    };

    localStorage.setItem("userLoggedv2", JSON.stringify(updatedSession));
    setSession(updatedSession);
  };

  const clearUserData = () => {
    localStorage.removeItem("userLoggedv2");
    localStorage.removeItem("timerExpiration");
    sessionStorage.clear();
    setSession(null);
  };

  const cierraSesion = () => {
    Swal.fire({
      title: "Se cerrará la sesión. ¿Deseas continuar?",
      showDenyButton: true,
      confirmButtonText: "Cerrar",
      denyButtonText: `Cancelar`,
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Sesión terminada",
          showConfirmButton: false,
          timer: 1500,
        });
        clearUserData();
        localStorage.removeItem("userLoggedv2");
        navigate(routes.login);
      }
    });
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#adb4b1ff" }}>
      <Toolbar sx={{ 
        width: isMobile ? "100%" : "70%", 
        mx: "auto",
        px: isMobile ? 1 : 2,
        minHeight: isMobile ? '56px' : '64px'
      }}>
        
        {/* Botón de menú hamburguesa en móvil */}
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* LOGO */}
        <Box
          component="img"
          src={logoImage}
          alt="logo"
          sx={{ 
            width: isMobile ? 100 : 160, 
            mr: isMobile ? 'auto' : 2, 
            cursor: "pointer" 
          }}
          onClick={() => navigate(routes.mainMenu)}
        />

 {/* MODULO COMERCIAL - Oculto en móvil */}
        {!isMobile && (
          <Button color="inherit" onClick={(e) => setAnchorModuloComercial(e.currentTarget)}>
            MÓDULO COMERCIAL
          </Button>
        )}

        <Menu
          anchorEl={anchorModuloComercial}
          open={openModuloComercial}
          onClose={() => setAnchorModuloComercial(null)}
        >
            <MenuItem onClick={() => { setAnchorModuloComercial(null); navigate(routes.pos); }}>Punto de venta</MenuItem> 
            <MenuItem onClick={() => { setAnchorModuloComercial(null); navigate(routes.retiros); }}>Retiros</MenuItem>     
            <MenuItem onClick={() => { setAnchorModuloComercial(null); navigate(routes.corte_parcial); }}>Corte parcial</MenuItem>   
            <MenuItem onClick={() => { setAnchorModuloComercial(null); navigate(routes.corte_dia); }}>Corte Dia</MenuItem>
            <MenuItem onClick={() => { setAnchorModuloComercial(null); navigate(routes.carteleraDigital); }}>Cartelera Digital</MenuItem>
        </Menu>

        {/* PERFIL - Oculto en móvil */}
        {!isMobile && (
          <Button
            color="inherit"
            onClick={(e) => setAnchorPerfil(e.currentTarget)}
          >
            PERFIL
          </Button>
        )}


{/* --- cambios del recuadro aqui --- */}
        <Box sx={{ flexGrow: 1 }} />


        <Box sx={{ 
          display: isMobile ? 'none' : 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end', 
          justifyContent: 'center',
          mr: 2, 
          px: 2, 
          py: 0.5,
          bgcolor: 'rgba(255, 255, 255, 0.4)', 
          borderRadius: '8px',
          border: '1px solid rgba(0,0,0,0.1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a365d', lineHeight: 1.2, textTransform: 'uppercase' }}>
            {session?.nombre ? session.nombre : 'Cargando...'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#333', fontWeight: 600, lineHeight: 1 }}>
            {session?.dSucursal ? `Sucursal: ${session.dSucursal}` : 'Cargando...'}
          </Typography>
        </Box>
        {/* --- aqui termina --- */}



        <Menu
          anchorEl={anchorPerfil}
          open={openPerfil}
          onClose={() => setAnchorPerfil(null)}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Card elevation={3}>
              <CardHeader
                title={`📅 ${new Date().toLocaleString()}`}
                sx={{ textAlign: "center", fontSize: 12 }}
              />
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={`Nombre: ${session?.nombre}`}
                  />
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary={`Sucursal: ${session?.dSucursal}`}
                  />
                </ListItem>

                <ListItem>
                  <FormControl fullWidth size="small">
                    <Select
                      value={session?.sucursal ?? ""}
                      onChange={handleSucursalSelect}
                    >
                      {dataSucursales.length === 0 ? (
                        <MenuItem disabled>
                          <CircularProgress size={16} />
                        </MenuItem>
                      ) : (
                        dataSucursales.map((s) => (
                          <MenuItem key={s.sucursalId} value={s.sucursalId}>
                            {s.nombre}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </ListItem>

                <ListItem>
                  <ListItemText primary={`Versión: ${versionSistema}`} />
                </ListItem>
              </List>
            </Card>
          </Box>

          <MenuItem
            onClick={cierraSesion}
            sx={{ color: "error.main", fontWeight: "bold" }}
          >
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>

      {/* Drawer para menú móvil */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: '#f5f5f5'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#adb4b1ff' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d' }}>
            Menú
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider />
        
        {/* Información del usuario */}
        <Box sx={{ p: 2, backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a365d' }}>
            {session?.nombre || 'Usuario'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            {session?.dSucursal || 'Sucursal'}
          </Typography>
        </Box>

        <List>
          {/* Módulo Comercial */}
          <ListItemButton onClick={() => { navigate(routes.pos); setDrawerOpen(false); }}>
            <ListItemText primary="Punto de Venta" />
          </ListItemButton>
          <ListItemButton onClick={() => { navigate(routes.retiros); setDrawerOpen(false); }}>
            <ListItemText primary="Retiros" />
          </ListItemButton>
          <ListItemButton onClick={() => { navigate(routes.corte_parcial); setDrawerOpen(false); }}>
            <ListItemText primary="Corte Parcial" />
          </ListItemButton>
          <ListItemButton onClick={() => { navigate(routes.corte_dia); setDrawerOpen(false); }}>
            <ListItemText primary="Corte Día" />
          </ListItemButton>
          <ListItemButton onClick={() => { navigate(routes.carteleraDigital); setDrawerOpen(false); }}>
            <ListItemText primary="Cartelera Digital" />
          </ListItemButton>

          <Divider sx={{ my: 1 }} />

          <Divider sx={{ my: 1 }} />

          {/* Perfil y Cerrar Sesión */}
          <ListItemButton onClick={() => { setDrawerOpen(false); setAnchorPerfil(document.body); }}>
            <ListItemText primary="Perfil" />
          </ListItemButton>
          <ListItemButton onClick={() => { setDrawerOpen(false); cierraSesion(); }} sx={{ color: 'error.main' }}>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </List>
      </Drawer>
    </AppBar>
  );
};

export default SidebarHorizontal;
