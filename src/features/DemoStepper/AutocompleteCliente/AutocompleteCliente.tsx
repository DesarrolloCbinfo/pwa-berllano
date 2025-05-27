import * as React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useQuery } from "@tanstack/react-query";
import { AutocompleteClienteApis } from "./apis/AutocompleteClienteApis";
import { Cliente } from "./types/AutocompleteClienteTypes";
import { useEffect } from "react";
import { useFormularioStore } from "../../../app/pages/DemoStepper/store/useFormularioStore";
// interface props {
//   createNewUsuarioUUID: () => void;
// }
export default function AutocompleteCliente() {
  const { idCliente, setIdCliente, nombreCliente, setNombreCliente } = useFormularioStore();
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<Cliente[]>([]);
  const [nombre, setNombre] = React.useState("a"); // Add this line to manage the input value

  // Static client that will always be available
  const staticClient: Partial<Cliente> = {
    noCliente: "%",
    nombre: "Seleccione un cliente",
    apPaterno: "",
    apMaterno: "",
  } as Cliente; // Type assertion to Cliente since we're only using these properties

  const { consumoApi } = useConsumoApi();

  const {
    data: clientes = [],
    refetch: refetchClientes,
    isLoading,
  } = useQuery({
    queryKey: ["clientes", nombre],
    queryFn: async () => await consumoApi.get(AutocompleteClienteApis.get(nombre)).then((res) => res.data),
  });

  useEffect(() => {
    refetchClientes().then(() => {
      // Add the static client to the beginning of the options array
      setOptions([staticClient, ...clientes]);
    });
  }, [nombre, refetchClientes, clientes]);

  const handleOpen = () => {
    setOpen(true);
    (async () => {
      refetchClientes();

      setOptions([staticClient, ...clientes]);
    })();
  };

  const handleClose = () => {
    setOpen(false);
    setOptions([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.trim();

    const valueWithoutSpaces = inputValue.replace(/\s/g, "");

    if (valueWithoutSpaces.length === 0) {
      setNombre("a");
      return;
    }
    setNombre(valueWithoutSpaces);
  };

  return (
    <Autocomplete
      sx={{ width: 300 }}
      filterOptions={(x) => x}
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      isOptionEqualToValue={(option, value) => option.noCliente === value.noCliente}
      getOptionLabel={(option) =>
        option.noCliente === "%"
          ? option.nombre
          : `${option.nombre.trim()} ${option.apPaterno.trim()} ${option.apMaterno.trim()} ${option.noCliente}`
      }
      options={options}
      loading={isLoading}
      onInput={handleChange}
      onChange={(_: React.SyntheticEvent, value: Cliente | null) => {
        if (value) {
          // If a client is selected and it's different from the current one, call createNewUsuarioUUID
          if (value.noCliente !== idCliente) {
            // createNewUsuarioUUID();
          }
          setIdCliente(value.noCliente);
          setNombreCliente(`${value.nombre.trim()} ${value.apPaterno.trim()} ${value.apMaterno.trim()}`);
        }
      }}
      defaultValue={options.find((option) => option.noCliente === idCliente)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={nombreCliente.length === 0 ? "Buscar cliente" : nombreCliente}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            },
          }}
        />
      )}
    />
  );
}
