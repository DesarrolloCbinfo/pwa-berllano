import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from '@mui/material';

interface DialogoValidacionProps {
  open: boolean;
  onClose: () => void;
  onConfirmar: () => void;
  usuario: string;
  setUsuario: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
}

export default function DialogoValidacion({
  open,
  onClose,
  onConfirmar,
  usuario,
  setUsuario,
  password,
  setPassword
}: DialogoValidacionProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirmar();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pb: 1 }}>
        Escriba los datos de un usuario con acceso a este módulo.
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ minWidth: 140, textAlign: 'right' }}>
              Nombre de usuario:
            </Box>
            <TextField
              fullWidth
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              size="small"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ minWidth: 140, textAlign: 'right' }}>
              Password:
            </Box>
            <TextField
              fullWidth
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 2 }}>
        <Button
          variant="contained"
          onClick={onConfirmar}
          sx={{ minWidth: 100 }}
        >
          Aceptar
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ minWidth: 100 }}
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
