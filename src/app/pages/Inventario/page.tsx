import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { Warehouse, SwapHoriz } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../utils/Routes';

export default function InventarioPage() {
  const navigate = useNavigate();

  const opciones = [
    {
      id: 'traspaso',
      title: 'Traspaso de Mercancía',
      description: 'Genera traspasos entre sucursales',
      icon: SwapHoriz,
      color: '#795548',
      path: routes.traspasoMercancia,
    },
  ];

  return (
    <Box sx={{ p: 4, minHeight: 'calc(100vh - 64px)' }}>
      <Typography variant="h4" sx={{ textAlign: 'center', mb: 4, fontWeight: 600 }}>
        Inventario
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {opciones.map((op) => {
          const Icon = op.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={op.id}>
              <Card
                onClick={() => navigate(op.path)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  backgroundColor: op.color,
                  color: 'white',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                  <Icon sx={{ fontSize: 48 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {op.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {op.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
