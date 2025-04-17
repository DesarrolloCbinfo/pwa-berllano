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

const pages = [
  {
    name: "Generar Formularios",
    url: "/generadorFormularios",
  },
  {
    name: "Blog",
    url: "/",
  },
  {
    name: "Demo",
    url: "/demo",
  },
];

const pagesAccordion = [
  {
    name: "Catalagos",
    headers: [
      {
        name: "header 1",
        pages: [
          {
            name: "sub header 1",
            url: "/",
          },
          {
            name: "sub header 2",
            url: "/",
          },
          {
            name: "sub header 3",
            url: "/",
          },
        ],
      },
      {
        name: "header 2",
        pages: [
          {
            name: "sub header 1",
            url: "/",
          },
        ],
      },
      {
        name: "header 3",
        pages: [
          {
            name: "sub header 1",
            url: "/",
          },
        ],
      },
    ],
  },
];

const settings = ["Profile", "Account", "Dashboard", "Logout"];
const drawerWidth = 240;

export default function Navbar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const drawerContent = (
    <Box sx={{ textAlign: "center" }}>
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
          <Accordion>
            <AccordionSummary expandIcon={<ArrowDownward />} aria-controls={page.name} id={page.name}>
              <Typography>{page.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {page.headers.map((header) => (
                <>
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
                </>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
        {pages.map((page) => (
          <NavLink to={page.url} style={{ textDecoration: "none", color: "black" }}>
            <ListItem key={page.name} disablePadding>
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
    <AppBar position="static" sx={{ backgroundColor: "white" }}>
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
              onClick={handleOpenNavMenu}
              sx={{ color: "black" }}
            >
              <MenuIcon />
            </IconButton>
            <nav>
              <Drawer
                variant="temporary"
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                ModalProps={{
                  keepMounted: true,
                }}
                sx={{
                  display: { xs: "block", sm: "none" },
                  "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
                }}
              >
                {drawerContent}
              </Drawer>
            </nav>
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
              <Box sx={{ my: 2 }}>
                <NavLink to={page.url}>
                  <Button key={page.name} onClick={handleCloseNavMenu} sx={{ color: "black" }}>
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
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
