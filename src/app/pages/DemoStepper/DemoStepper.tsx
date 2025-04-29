import Navbar from "../../../components/Navbar"
import StepperFichas from "../../../features/DemoStepper/StepperFichas/StepperFichas";
import Container from '@mui/material/Container';
import { DemoStepperApis } from "./apis/DemoStepperApis";
import { FichaStepper, initialDataFichaStepper } from "./types/DemoStepperTypes";
import { useQuery } from "@tanstack/react-query";
import useConsumoApi from "../../../hooks/useConsumoApi";

export default function DemoStepper() {
  const { consumoApi } = useConsumoApi();

  //conseguir usuario con get
  const usuario = 999;

  //conseguir ficha con usuario y get
  const ficha = 2;

  //conseguir ficha con get de fichas asignadas a algun usuario
  const { data: fichaStepper = initialDataFichaStepper, refetch: refetchFichaStepper } = useQuery<FichaStepper>({ 
    queryKey: ['fichaStepper'],
    queryFn: async () => await consumoApi.get(DemoStepperApis.getFichaStepper(ficha, usuario)).then((res) => res.data)
  });

  //Hacer refetch de la ficha cuando se cambie la seccion y conservar en que seccion se quedo el usuario

  console.log("Ficha Stepper")
  console.log(fichaStepper)

  return (
    <>
      <Navbar />
      <Container maxWidth="xl">
        <StepperFichas fichaStepper={fichaStepper} usuario={usuario} refetchFichaStepper={refetchFichaStepper} />
      </Container>
    </>
  )
}