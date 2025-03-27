import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import Drawer from '@mui/material/Drawer'
import { Accordion, AccordionDetails, AccordionSummary, Divider, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { ArrowDownward } from '@mui/icons-material';

const pages = [
  {
    name: 'Pricing',
    url: '/'
  },
  {
    name: 'Blog',
    url: '/'
  }
]

const pagesAccordion = [
  {
    name: 'Catalagos',
    headers: [
      {
        name: 'header 1',
        pages: [
          {
            name: 'sub header 1',
            url: '/'
          },
          {
            name: 'sub header 2',
            url: '/'
          },
          {
            name: 'sub header 3',
            url: '/'
          },
        ] 
      },
      {
        name: 'header 2',
        pages: [
          {
            name: 'sub header 1',
            url: '/'
          }
        ]
      },
      {
        name: 'header 3',
        pages: [
          {
            name: 'sub header 1',
            url: '/'
          }
        ]
      }
    ]
  }
]

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];
const drawerWidth = 240

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
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant='h6' sx={{ my: 2}}>
        Berllano
      </Typography>
      <Divider />
      <List>
        {pagesAccordion.map((page) => (
          <Accordion>
            <AccordionSummary
              expandIcon={<ArrowDownward />}
              aria-controls={page.name}
              id={page.name}
            >
              <Typography>{page.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {page.headers.map((header) => (
                <>
                  <Typography variant='subtitle2' sx={{ textAlign: 'left'}}>{header.name}</Typography>
                  {header.pages.map((page) => (
                    <ListItem key={page.name} disablePadding>
                      <ListItemButton sx={{ textAlign: 'left' }}>
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
          <ListItem key={page.name} disablePadding>
            <ListItemButton sx={{ textAlign: 'left' }}>
              <ListItemText primary={page.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            LOGO
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <nav>
              <Drawer
                variant='temporary'
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                ModalProps={{
                  keepMounted: true
                }}
                sx={{
                  display: { xs: 'block', sm: 'none' },
                  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
              >
                {drawerContent}
              </Drawer>
            </nav>
          </Box>
          <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            LOGO
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.name}
              </Button>
            ))}
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
