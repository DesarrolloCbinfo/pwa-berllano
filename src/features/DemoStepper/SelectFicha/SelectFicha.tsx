import { FormControl, InputLabel, Select, MenuItem } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import useConsumoApi from "../../../hooks/useConsumoApi"
import { SelectFichaApis } from "./apis/SelectFichaApis"
import { useFormularioStore } from "../../../app/pages/DemoStepper/store/useFormularioStore"

type Ficha = {
  id: number,
  cia: number,
  nombre: string,
  descripcion: string,
  sucursalId: number
}

export default function SelectFicha() {
  const { consumoApi } = useConsumoApi()
  const { idFicha, setIdFicha } = useFormularioStore()

  const { data: fichas } = useQuery<Ficha[]>({
    queryKey: ["fichasSelector"],
    queryFn: async () =>
      await consumoApi.get(SelectFichaApis.getFichas('1')).then((res) => res.data)
  })

  return (
    <FormControl sx={{ width: "400px", mt: 4 }}>
      <InputLabel id="ficha">Ficha</InputLabel>
      <Select
        labelId="ficha"
        id="ficha"
        label="Ficha"
        value={idFicha}
        onChange={(e) => setIdFicha(e.target.value)}
      >
        { 
          fichas?.map((ficha) => (
            <MenuItem key={ficha.id} value={ficha.id}>{ ficha.nombre }</MenuItem>
          ))
        }
      </Select>
    </FormControl>
  )
}