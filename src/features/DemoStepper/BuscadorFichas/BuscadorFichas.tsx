import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import AutocompleteCliente from "../AutocompleteCliente/AutocompleteCliente";
import { useState, useMemo, useEffect } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  MRT_ColumnDef,
} from "material-react-table";
import { useQuery } from "@tanstack/react-query";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { BuscadorFichasApis } from "./apis/BuscadorFichasApis";
import { useFormularioStore } from "../../../app/pages/DemoStepper/store/useFormularioStore";

type Props = {
  onClose: () => void;
  open: boolean;
  handleModoFichaLectura: () => void;
};

export default function BuscadorFichas({
  onClose,
  open,
  handleModoFichaLectura,
}: Props) {
  const { consumoApi } = useConsumoApi();
  const { idCliente, setIdCliente, setUsuarioUUID, setNombreCliente } = useFormularioStore();
  const [fechas, setFechas] = useState({
    fechaInicial: "1/1/2025",
    fechaFinal: "12/12/2025",
  });
  console.log("Buscador")
  console.log(idCliente)
  const { data = [], refetch } = useQuery({
    queryKey: ["fichas"],
    queryFn: async () =>
      consumoApi
        .get(
          BuscadorFichasApis.getFormularioCliente(
            idCliente,
            "%",
            fechas.fechaInicial,
            fechas.fechaFinal
          )
        )
        .then((res) => res.data),
  });

  useEffect(() => {
    refetch();
  }, [idCliente, fechas]);

  const columns = useMemo<
    MRT_ColumnDef<{ nombre: string; fecha: string; cliente: string; usuario: string; idCliente: string }>[]
  >(
    () => [
      {
        accessorKey: "actions",
        header: "Acciones",
        size: 10,
        Cell: ({ row }) => {
          return (
            <Box>
              <Button
                variant="contained"
                onClick={() => {
                  setUsuarioUUID(row.original.usuario);
                  setIdCliente(row.original.idCliente);
                  setNombreCliente(row.original.cliente.trim());
                  handleModoFichaLectura();
                  onClose();
                }}
              >
                Ver Ficha
              </Button>
            </Box>
          );
        },
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
      },
      {
        accessorKey: "cliente",
        header: "Cliente",
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
        Cell: ({ row }) => {
          return row.original.fecha.split("T")[0];
        },
      },
    ],
    [handleModoFichaLectura, onClose, setIdCliente, setUsuarioUUID]
  );

  const table = useMaterialReactTable({
    columns,
    data,
  });

  return (
    <>
      <Dialog onClose={onClose} open={open} maxWidth="lg" fullWidth>
        <DialogTitle>Buscador de fichas</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 2, py: 2 }}>
            <AutocompleteCliente />
            <TextField
              id="f1"
              variant="outlined"
              label="Fecha Inicial"
              type="date"
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setFechas({ ...fechas, fechaInicial: e.target.value })}
              name="fechaInicial"
            />
            <TextField
              id="f2"
              variant="outlined"
              label="Fecha Final"
              type="date"
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setFechas({ ...fechas, fechaFinal: e.target.value })}
              name="fechaFinal"
            />
          </Box>
          <MaterialReactTable table={table} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
