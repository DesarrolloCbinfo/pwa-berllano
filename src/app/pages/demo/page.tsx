import { Container, Input, MenuItem, Select, Typography } from "@mui/material";
import Navbar from "../../../components/Navbar";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { Demo } from "./apis/demo";
import { useEffect, useState } from "react";
import { FichaResponse, PreguntaResponse, SeccionResponse } from "./interfaces/IFicha";

interface Form {
  fichaId: number | null;
  seccionId: number | null;
  preguntaId: number | null;
  opcionId: number | null;
}

export default function Page() {
  const { consumoApi } = useConsumoApi();
  const [fichaData, setFichaData] = useState<FichaResponse[]>([]);
  const [seccionData, setSeccionData] = useState<SeccionResponse[]>([]);
  const [preguntaData, setPreguntaData] = useState<PreguntaResponse[]>([]);
  const [form, setForm] = useState<Form>({
    fichaId: null,
    seccionId: null,
    preguntaId: null,
    opcionId: null,
  });

  useEffect(() => {
    consumoApi.get(Demo.getFicha(1)).then((res) => {
      setFichaData(res.data);
    });
  }, []);

  useEffect(() => {
    if (form.fichaId) {
      consumoApi.get(Demo.getSeccion(form.fichaId)).then((res) => {
        setSeccionData(res.data);
      });
    }
  }, [form.fichaId]);

  useEffect(() => {
    if (form.seccionId) {
      consumoApi.get(Demo.getPregunta(form.seccionId)).then((res) => {
        setPreguntaData(res.data);
        if (res.data && res.data.length > 0) {
          setForm({ ...form, preguntaId: res.data[0].id });
        }
      });
    } else {
      setPreguntaData([]);
    }
  }, [form.seccionId]);

  return (
    <>
      <Navbar />
      <Container maxWidth="xl">
        {/* seleccione una ficha a visualizar */}
        <Typography variant="h5">Seleccione una ficha a visualizar</Typography>
        <Select
          value={form.fichaId}
          onChange={(e) => setForm({ ...form, fichaId: e.target.value === "" ? null : Number(e.target.value) })}
          sx={{ width: 200 }}
        >
          <MenuItem value="">Seleccione una ficha</MenuItem>
          {fichaData &&
            fichaData?.map((ficha: FichaResponse) => (
              <MenuItem key={ficha.id} value={ficha.id}>
                {ficha.nombre}
              </MenuItem>
            ))}
        </Select>

        <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: "1.5rem", md: "3rem" }, my: 2 }}>
          Demo
        </Typography>

        <Typography variant="h5">FICHA: {fichaData?.find((ficha) => ficha.id === form.fichaId)?.nombre}</Typography>
        <hr />
        <br />
        {/* Select section */}
        {form.fichaId && (
          <>
            <Typography variant="h5">Seleccione una sección</Typography>
            <Select
              value={form.seccionId}
              onChange={(e) =>
                setForm({ ...form, seccionId: e.target.value === "" ? null : Number(e.target.value), preguntaId: null })
              }
              sx={{ width: 200 }}
            >
              <MenuItem value="">Seleccione una sección</MenuItem>
              {seccionData?.map((seccion: SeccionResponse) => (
                <MenuItem key={seccion.id} value={seccion.id}>
                  {seccion.nombre}
                </MenuItem>
              ))}
            </Select>
          </>
        )}
        {/* Display selected section */}
        {form.seccionId && (
          <>
            <Typography variant="h5">
              SECCIÓN: {seccionData?.find((seccion) => seccion.id === form.seccionId)?.nombre}
            </Typography>
            <br />
            {/* Display questions for the selected section */}
            {preguntaData && preguntaData.length > 0 ? (
              preguntaData.map((pregunta: PreguntaResponse) => (
                <div key={pregunta.id} style={{ marginBottom: "20px" }}>
                  <Typography variant="h6">Pregunta: {pregunta.label}</Typography>
                  <Input name={pregunta.name} type={pregunta.type} fullWidth />
                </div>
              ))
            ) : (
              <Typography>No hay preguntas disponibles para esta sección</Typography>
            )}
          </>
        )}
      </Container>
    </>
  );
}
