import Navbar from "../../../components/Navbar"
import SelectFicha from "../../../features/DemoStepper/SelectFicha/SelectFicha";
import StepperFichas from "../../../features/DemoStepper/StepperFichas/StepperFichas";
import useFetchData from "../../../hooks/useFetchData";
import Container from '@mui/material/Container';
import { DemoStepperApis } from "./apis/DemoStepperApis";
import { Ficha } from "./types/DemoStepperTypes";
import { useState } from "react";

export default function DemoStepper() {
  const fichaData = useFetchData<Ficha>(DemoStepperApis.getFicha(1));
  const [ficha, setFicha] = useState(fichaData[0]);

  const handleFichaChange = (ficha: Ficha) => {
    setFicha(ficha)
  }

  console.log("Fichas Data")
  console.log(fichaData)

  console.log("Current Ficha")
  console.log(ficha)

  return (
    <>
      <Navbar />
      <Container maxWidth="xl">
        <SelectFicha fichaData={fichaData} handleFichaChange={handleFichaChange} />
        <StepperFichas />
      </Container>
    </>
  )
}