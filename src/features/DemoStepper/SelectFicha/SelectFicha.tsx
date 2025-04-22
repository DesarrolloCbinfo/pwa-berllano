import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from "@mui/material"
import { Ficha } from "../../../app/pages/DemoStepper/types/DemoStepperTypes"
import { useState } from "react"

type Props = {
  fichaData: Ficha[]
  handleFichaChange: (ficha: Ficha) => void
}

export default function SelectFicha({ fichaData, handleFichaChange }: Props) {
  const [fichaId, setFichaId] = useState('');

  const handleChange = (event: SelectChangeEvent) => {
    setFichaId(event.target.value)
    handleFichaChange(fichaData.find(ficha => ficha.id === Number(event.target.value))!)
  }

  return (
    <FormControl sx={{ width: "400px", my: 4 }}>
      <InputLabel id="ficha">Ficha</InputLabel>
      <Select
        labelId="ficha"
        id="ficha"
        label="Ficha"
        value={fichaId}
        onChange={handleChange}
      >
        { fichaData.map((ficha) => (
          <MenuItem key={ficha.id} value={ficha.id}>{ ficha.nombre }</MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}