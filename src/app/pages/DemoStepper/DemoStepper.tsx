import StepperFichas from "../../../features/DemoStepper/StepperFichas/StepperFichas";
import AutocompleteCliente from "../../../features/DemoStepper/AutocompleteCliente/AutocompleteCliente";
import { DemoStepperApis } from "./apis/DemoStepperApis";
import { FichaStepper, initialDataFichaStepper } from "./types/DemoStepperTypes";
import { useQuery } from "@tanstack/react-query";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useState } from 'react';

export default function DemoStepper() {
  const { consumoApi } = useConsumoApi();
  const [usuario, setUsuario] = useState(crypto.randomUUID()); // Add state for usuario
  const [idCliente, setIdcliente] = useState('')

  const createNewUser = () => { // Define createNewUser inside component
    setUsuario(crypto.randomUUID());
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
      <AutocompleteCliente setIdcliente={setIdcliente} />
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