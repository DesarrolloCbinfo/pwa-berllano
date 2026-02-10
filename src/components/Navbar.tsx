import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { ArrowDownward } from "@mui/icons-material";
import { NavLink } from "react-router";
import BerllanoLogo from "../assets/berllano-logo.jpg";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

type Page = {
  name: string;
  url: string;
};

type Header = {
  name: string;
  pages: Page[];
};

type PageAccordion = {
  name: string;
  headers: Header[];
};

function createPage(name: string, url: string): Page {
  return {
    name,
    url,
  };
}

function createHeader(name: string, pages: Page[]): Header {
  return {
    name,
    pages,
  };
}

function createPageAccordion(name: string, headers: Header[]): PageAccordion {
  return {
    name,
    headers,
  };
}






const pages: Page[] = [
  // createPage("Generar Formularios", "/generadorFormularios"),
  // createPage("Demo", "/demo"),
  createPage("Formularios", "/demoStepper"),
  createPage("Recepción", "/recepcion"),
  createPage("Catalogos", "/catalogos"),
  // Acceso rápido al módulo de Punto de Venta
  createPage("Punto de Venta", "/pos"),
];

const pagesAccordion: PageAccordion[] = [
  createPageAccordion("Catálogos", [
    createHeader("Catálogo 1", [
      createPage("Subcatálogo 1", "/"),
      createPage("Subcatálogo 2", "/"),
      createPage("Subcatálogo 3", "/"),
    ]),
    createHeader("Catálogo 2", [createPage("Subcatálogo 1", "/")]),
    createHeader("Catálogo 3", [createPage("Subcatálogo 1", "/")]),
  ]),
];

const settings = ["Profile", "Account", "Dashboard", "Logout"];
const drawerWidth = 240;

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const { logout } = useAuth();

  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    console.log("Toggle drawer:", !mobileOpen);
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setMobileOpen(false);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const drawerContent = (
    <Box sx={{ textAlign: "center", width: drawerWidth }}>
      <Box
        component="img"
        sx={{
          maxHeight: 100,
          maxWidth: 100,
          mx: "auto",
          my: 2,
        }}
        alt="Berllano logo"
        src={BerllanoLogo}
      />
      <Divider />
      <List>
        {pagesAccordion.map((page) => (
          <Accordion key={page.name}>
            <AccordionSummary
              expandIcon={<ArrowDownward />}
              aria-controls={page.name}
              id={page.name}
            >
              <Typography>{page.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {page.headers.map((header, headerIndex) => (
                <React.Fragment key={headerIndex}>
                  <Typography variant="subtitle2" sx={{ textAlign: "left" }}>
                    {header.name}
                  </Typography>
                  {header.pages.map((page) => (
                    <ListItem key={page.name} disablePadding>
                      <ListItemButton sx={{ textAlign: "left" }}>
                        <ListItemText primary={page.name} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </React.Fragment>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
        {pages.map((page) => (
          <NavLink
            to={page.url}
            style={{ textDecoration: "none", color: "inherit" }}
            key={page.name}
          >
            <ListItem disablePadding>
              <ListItemButton sx={{ textAlign: "left" }}>
                <ListItemText primary={page.name} />
              </ListItemButton>
            </ListItem>
          </NavLink>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <NavLink to={"/"} style={{ textDecoration: "none" }}>
            <Box sx={{ color: "white", display: { xs: "none", md: "flex" } }}>
              <Box
                component="img"
                sx={{
                  maxHeight: 100,
                  maxWidth: 100,
                }}
                alt="Berllano logo"
                src={BerllanoLogo}
              />
            </Box>
          </NavLink>

          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleDrawerToggle}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              container={window.document.body}
              variant="temporary"
              open={mobileOpen}
              onClose={handleCloseNavMenu}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: "block", md: "none" },
                "& .MuiDrawer-paper": {
                  boxSizing: "border-box",
                  width: drawerWidth,
                  zIndex: (theme) => theme.zIndex.appBar + 1,
                },
              }}
            >
              {drawerContent}
            </Drawer>
          </Box>
          <Box sx={{ color: "white", display: { xs: "flex", md: "none" }, flexGrow: 1 }}>
            <NavLink to={"/"} style={{ textDecoration: "none", color: "white" }}>
              <Box
                component="img"
                sx={{
                  maxHeight: 100,
                  maxWidth: 100,
                }}
                alt="Berllano logo"
                src={BerllanoLogo}
              />
            </NavLink>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Box sx={{ my: 2 }} key={page.name}>
                <NavLink to={page.url}>
                  <Button
                    key={page.name}
                    onClick={handleCloseNavMenu}
                    color="inherit"
                  >
                    {page.name}
                  </Button>
                </NavLink>
              </Box>
            ))}
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="Remy Sharp" src={BerllanoLogo} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography sx={{ textAlign: "center" }}>{setting}</Typography>
                </MenuItem>
              ))}
              <MenuItem
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <Typography sx={{ textAlign: "center" }}>Cerrar Sesión</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
