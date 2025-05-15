import { Dialog, DialogTitle, DialogContent, Box, DialogActions, Button, TextField } from "@mui/material"
import AutocompleteCliente from "../AutocompleteCliente/AutocompleteCliente"
import { useState, useMemo, useEffect } from "react"
import { MaterialReactTable, useMaterialReactTable, MRT_ColumnDef } from 'material-react-table'
import { useQuery } from "@tanstack/react-query"
import useConsumoApi from "../../../hooks/useConsumoApi"
import { BuscadorFichasApis } from "./apis/BuscadorFichasApis"

type Props = {
  onClose: () => void;
  open: boolean;
  handleSetUsuario: (newUsuario: string) => void;
  handleModoFichaLectura: () => void;
}

export default function BuscadorFichas({ onClose, open, handleSetUsuario, handleModoFichaLectura }: Props) {
  const { consumoApi } = useConsumoApi()
  const [idCliente, setIdcliente] = useState('a')

  const { data = [], refetch } = useQuery({
    queryKey: ['fichas'],
    queryFn: async () => consumoApi.get(BuscadorFichasApis.getFormularioCliente(idCliente, '%', '1/1/2025', '12/12/2025')).then(res => res.data),
  })

  useEffect(() => {
    refetch()
  }, [idCliente])

  const columns = useMemo<MRT_ColumnDef<{ nombre: string, fecha: Date, usuario: string }>[]>(
    () => [
      {
        accessorKey: 'actions',
        header: "Acciones",
        size: 10,
        Cell: ({ row }) => {
          return (
            <Box>
              <Button variant="contained" onClick={() => {
                handleSetUsuario(row.original.usuario)
                handleModoFichaLectura()
                onClose()
              }}>
                Ver Ficha
              </Button>
            </Box>
          )
        }
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
      },
      {
        accessorKey: 'usuario',
        header: 'Usuario',
      }
    ]
  , [handleSetUsuario])

  const table = useMaterialReactTable({
    columns,
    data
  })

  return (
    <>
      <Dialog onClose={onClose} open={open} maxWidth="lg" fullWidth>
        <DialogTitle>Buscador de fichas</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
            <AutocompleteCliente setIdcliente={setIdcliente} />
            <TextField id="f1" variant="outlined" label="Fecha Inicial" type="date" InputLabelProps={{ shrink: true }} />
            <TextField id="f2" variant="outlined" label="Fecha Final" type="date" InputLabelProps={{ shrink: true }} />
          </Box>
          <MaterialReactTable
            table={table}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}