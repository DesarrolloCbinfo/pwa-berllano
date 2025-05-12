import { ReactNode } from 'react';
import Navbar from './Navbar';
import { Box, Container, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

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
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Container 
              maxWidth="xl" 
              sx={{ 
                mt: 2, 
                mb: 4, 
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {children}
            </Container>
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