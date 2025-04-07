import { Container, Typography } from "@mui/material";
import Navbar from "../../../components/Navbar";

export default function GeneradorFormularios() {
  return (
    <>
      <Navbar />
      <Container maxWidth="xl">
        <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '3rem' }, my: 2 }}>
          Generador de Formularios
        </Typography>
      </Container>
    </>
  )
}