import { ReactNode } from 'react';
import SidebarHorizontal from './SideBarHorizontal';
import { Box, Container, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import watermarkImage from '../assets/imgs/berllanoLogo.png'; // Importar imagen

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }

    window.addEventListener('storage', () => {
      if (!isAuthenticated()) {
        navigate('/login');
      }
    });

    return () => {
      window.removeEventListener('storage', () => {
        if (!isAuthenticated()) {
          navigate('/login');
        }
      });
    };
  }, [isAuthenticated, navigate, logout, token, children]);

  return (
    <>
      {
        isAuthenticated() ? 
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
            <SidebarHorizontal />
            <Container
              maxWidth="xl"
              sx={{
                mt: 2,
                pt: 2,
                flexGrow: 1,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {children}
            </Container>
            
            {/* Marca de agua con imagen importada */}
            <Box
              component="img"
              src={watermarkImage}
              alt="Marca de agua Berllano"
              sx={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: 'auto',
                opacity: 0.08,
                pointerEvents: 'none',
                zIndex: 0,
                userSelect: 'none',
                filter: 'grayscale(100%)',
              }}
            />
          </Box>
        : 
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Typography variant='h1'>
              Autenticando
            </Typography>
          </Box>
      }
    </>
  );
}