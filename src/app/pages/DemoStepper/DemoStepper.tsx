import StepperFichas from "../../../features/DemoStepper/StepperFichas/StepperFichas";
import AutocompleteCliente from "../../../features/DemoStepper/AutocompleteCliente/AutocompleteCliente";
import { DemoStepperApis } from "./apis/DemoStepperApis";
import { FichaStepper, initialDataFichaStepper } from "./types/DemoStepperTypes";
import { useQuery } from "@tanstack/react-query";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useState } from "react";
import BuscadorFichas from "../../../features/DemoStepper/BuscadorFichas/BuscadorFichas";
import { Button } from "@mui/material";
import { Typography, Box } from "@mui/material";
import { useFormularioStore } from "./store/useFormularioStore";

export default function DemoStepper() {
  const { consumoApi } = useConsumoApi();
  const { usuarioUUID, createNewUsuarioUUID, idCliente, nombreCliente } = useFormularioStore();
  const [modoFicha, setModoFicha] = useState<"nueva" | "lectura">("nueva");

  const [dialogBuscador, setDialogBuscador] = useState(false);

  const handleCloseDialogBuscador = () => {
    setDialogBuscador(false);
  };

  const handleSetModoFichaLectura = () => {
    setModoFicha("lectura");
  };

  //conseguir ficha con get
  const ficha = 2;

  //conseguir ficha con get de fichas asignadas a algun usuario
  const { data: fichaStepper = initialDataFichaStepper, refetch: refetchFichaStepper } = useQuery<FichaStepper>({
    queryKey: ["fichaStepper", ficha, usuarioUUID], // Include ficha and usuario in queryKey
    queryFn: async () =>
      await consumoApi.get(DemoStepperApis.getFichaStepper(ficha, usuarioUUID)).then((res) => res.data),
  });

  console.log("Ficha Stepper");
  console.log(fichaStepper);

  return (
    <>
      <Button variant="contained" onClick={() => setDialogBuscador(true)} sx={{ width: "fit-content", mb: 2 }}>
        Abrir Buscador de Formularios
      </Button>
      <BuscadorFichas
        open={dialogBuscador}
        onClose={handleCloseDialogBuscador}
        handleModoFichaLectura={handleSetModoFichaLectura}
      />
      <Typography variant="h6" sx={{ mb: 2 }}>
        Cliente a registrar en formulario {nombreCliente}
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <AutocompleteCliente createNewUsuarioUUID={createNewUsuarioUUID} />
        <Button
          variant="contained"
          onClick={() => {
            setModoFicha("nueva");
            createNewUsuarioUUID();
          }}
        >
          Nuevo Registro
        </Button>
      </Box>
      {idCliente !== "%" && idCliente !== "a" && idCliente !== "" && (
        <StepperFichas
          fichaStepper={fichaStepper}
          usuario={usuarioUUID}
          cliente={idCliente}
          createNewUser={createNewUsuarioUUID}
          refetchFichaStepper={refetchFichaStepper}
          modoFicha={modoFicha}
        />
      )}
    </>
  );
}
