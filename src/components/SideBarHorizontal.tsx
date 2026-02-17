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
} from "@mui/material";

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

  const [anchorCatalogos, setAnchorCatalogos] = useState<null | HTMLElement>(null);
  const [anchorModuloComercial, setAnchorModuloComercial] = useState<null | HTMLElement>(null);
  const [anchorPerfil, setAnchorPerfil] = useState<null | HTMLElement>(null);

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
      <Toolbar sx={{ width: "70%", mx: "auto" }}>
        
        {/* LOGO */}
        <Box
          component="img"
          src={logoImage}
          alt="logo"
          sx={{ width: 160, mr: 2, cursor: "pointer" }}
          onClick={() => navigate(routes.mainMenu)}
        />

        

       

        {/* CATÁLOGOS */}
        <Button
          color="inherit"
          onClick={(e) => setAnchorCatalogos(e.currentTarget)}
        >
          CATÁLOGOS
        </Button>

        <Menu
          anchorEl={anchorCatalogos}
          open={openCatalogos}
          onClose={() => setAnchorCatalogos(null)}
        >
          <MenuItem onClick={() => navigate(routes.cat_clientes_form)}>
            Catálogo de clientes
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.cat_Proveedores)}>
            Catálogo de proveedores
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.cat_Clientes)}>
            Clientes
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.cat_Marcas)}>
            Marcas
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.AsignacionHorarios)}>
            Asignación de horarios
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.Cat_Marcas_Familias)}>
            Marcas familias
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.modulo_servicios_insumos)}>
            Servicios e insumos
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.modulo_porcentajes_puntos)}>
            Porcentajes y puntos
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.cat_Areas)}>
            Áreas
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.cat_Tipo_Descuento)}>
            Tipo de descuentos
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.cat_Compradores)}>
            Compradores
          </MenuItem>
          <MenuItem onClick={() => navigate(routes.cat_Sucursales)}>
            Sucursales
          </MenuItem>
        </Menu>

 {/* MODULO COMERCIAL */}
 <Button color="inherit" onClick={(e) => setAnchorModuloComercial(e.currentTarget)}>Modulo Comercial</Button>

        <Menu
          anchorEl={anchorModuloComercial}
          open={openModuloComercial}
          onClose={() => setAnchorModuloComercial(null)}

        >
            <MenuItem onClick={() => { setAnchorModuloComercial(null); navigate(routes.pos); }}>Punto de venta</MenuItem> 
            <MenuItem onClick={() => { setAnchorModuloComercial(null); navigate(routes.retiros); }}>Retiros</MenuItem>     
            <MenuItem onClick={() => { setAnchorModuloComercial(null); navigate(routes.corte_parcial); }}>Corte parcial</MenuItem>   
            <MenuItem onClick={() => { setAnchorModuloComercial(null); navigate(routes.corte_dia); }}>Corte Dia</MenuItem>
        </Menu>


        {/* PERFIL */}
        <Button
          color="inherit"
          onClick={(e) => setAnchorPerfil(e.currentTarget)}
        >
          PERFIL
        </Button>



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
    </AppBar>
  );
};

export default SidebarHorizontal;
