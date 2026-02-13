import { ReactNode, useEffect, useState } from 'react';
import SidebarHorizontal from './SideBarHorizontal';
import { Box, Container, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { useSessionContext } from '../context/SessionProvider';
import watermarkImage from '../assets/imgs/berllanoLogo.png'; // Importar imagen

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { session, isLoading } = useSessionContext(); // Obtener datos de sesión y estado de carga
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Esperar a que la sesión termine de cargar
    if (isLoading) return;

    // Evitar bucle infinito - solo ejecutar una vez
    if (!isChecking) return;

    // Verificar autenticación básica
    if (!isAuthenticated()) {
      navigate('/login');
      setIsChecking(false);
      return;
    }

    // Verificar si hay datos de sesión válidos
    if (!session || !session.claveEmpleado) {
      console.log('No hay sesión válida, redirigiendo a login');
      navigate('/login');
      setIsChecking(false);
      return;
    }

    // Si todo está bien, permitir acceso
    console.log('Sesión válida, permitiendo acceso');
    setIsChecking(false);

    window.addEventListener('storage', () => {
      if (!isAuthenticated() || !session || !session.claveEmpleado) {
        navigate('/login');
      }
    });

    return () => {
      window.removeEventListener('storage', () => {
        if (!isAuthenticated() || !session || !session.claveEmpleado) {
          navigate('/login');
        }
      });
    };
  }, [isChecking, isLoading, session]); // Dependemos de isLoading y session

  // Mostrar estado de carga mientras verificamos
  if (isChecking) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant='h6'>
          Verificando sesión...
        </Typography>
      </Box>
    );
  }

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