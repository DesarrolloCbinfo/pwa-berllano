import StepperFichas from "../../../features/DemoStepper/StepperFichas/StepperFichas";
import AutocompleteCliente from "../../../features/DemoStepper/AutocompleteCliente/AutocompleteCliente";
import { DemoStepperApis } from "./apis/DemoStepperApis";
import { FichaStepper, initialDataFichaStepper } from "./types/DemoStepperTypes";
import { useQuery } from "@tanstack/react-query";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useState } from 'react';
import BuscadorFichas from "../../../features/DemoStepper/BuscadorFichas/BuscadorFichas";
import { Button } from "@mui/material";

export default function DemoStepper() {
  const { consumoApi } = useConsumoApi();
  const [usuario, setUsuario] = useState<string>(crypto.randomUUID()); // Add state for usuario
  const [idCliente, setIdcliente] = useState('')

  const [dialogBuscador, setDialogBuscador] = useState(false)

  const createNewUser = () => { // Define createNewUser inside component
    setUsuario(crypto.randomUUID());
  };

  const handleCloseDialogBuscador = () => {
    setDialogBuscador(false);
  };

  const handleSetUsuario = (newUsuario: string) => {
    setUsuario(newUsuario);
    refetchFichaStepper();
  };

  //conseguir usuario con get
//  console.log("UUID Usuario")
//  console.log(usuario)

  //conseguir ficha con get
  const ficha = 2;

  //conseguir ficha con get de fichas asignadas a algun usuario
  const { data: fichaStepper = initialDataFichaStepper, refetch: refetchFichaStepper } = useQuery<FichaStepper>({ 
    queryKey: ['fichaStepper', ficha, usuario], // Include ficha and usuario in queryKey
    queryFn: async () => await consumoApi.get(DemoStepperApis.getFichaStepper(ficha, usuario)).then((res) => res.data)
  });

  console.log("Ficha Stepper")
  console.log(fichaStepper)

  console.log("Id Cliente")
  console.log(idCliente)

  return (
    <>
      <Button variant="contained" onClick={() => setDialogBuscador(true)} sx={{ width: 'fit-content' }}>Abrir Buscador de Formularios</Button>
      <BuscadorFichas
        open={dialogBuscador} 
        onClose={handleCloseDialogBuscador} 
        handleSetUsuario={handleSetUsuario} 
      />
      <AutocompleteCliente
        setIdcliente={setIdcliente} 
      />
      <StepperFichas
        fichaStepper={fichaStepper} 
        usuario={usuario} 
        cliente={idCliente}
        createNewUser={createNewUser} 
        refetchFichaStepper={refetchFichaStepper} 
      />
    </>
  )
}