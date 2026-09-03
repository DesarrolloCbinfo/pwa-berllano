import { Box, Typography } from '@mui/material';
import { SwapHoriz, MoveToInbox, Tune } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../utils/Routes';

export default function InventarioPage() {
  const navigate = useNavigate();

  const opciones = [
    {
      id: 'traspaso',
      title: 'Traspaso de Mercancía',
      icon: SwapHoriz,
      path: routes.traspasoMercancia,
    },
    {
      id: 'recepcionTraspasos',
      title: 'Recepción de Traspasos',
      icon: MoveToInbox,
      path: routes.recepcionTraspasos,
    },
    {
      id: 'ajustesInventario',
      title: 'Ajustes al Inventario',
      icon: Tune,
      path: routes.ajustesInventario,
    },
     {
      id: 'NivelacionInventarioPage',
      title: 'nivelación Inventario',
      icon: Tune,
      path: routes.NivelacionInventarioPage,
    },
  ];

  return (
    <Box sx={{ p: 4, minHeight: 'calc(100vh - 64px)' }}>
      <Typography
        sx={{
          textAlign: 'center',
          mb: 4,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 700,
          fontSize: '1.75rem',
          color: '#111',
        }}
      >
        Inventario
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 2,
          maxWidth: 480,
          mx: 'auto',
        }}
      >
        {opciones.map((op) => {
          const Icon = op.icon;
          return (
            <Box
              key={op.id}
              onClick={() => navigate(op.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 2,
                minHeight: 96,
                bgcolor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
                '&:hover': {
                  bgcolor: '#eef0f2',
                  borderColor: '#c9cdd1',
                },
              }}
            >
              <Icon sx={{ fontSize: 28, color: '#1a1a1a', flexShrink: 0 }} />
              <Typography
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: '#1a1a1a',
                  lineHeight: 1.3,
                }}
              >
                {op.title}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
