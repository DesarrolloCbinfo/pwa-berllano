import { useEffect, useMemo, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useConsumoApi from "../../hooks/useConsumoApi";

export interface ProveedorOption {
  id: string;
  nombre: string;
}

interface ProveedorApiRow {
  id?: string | number;
  nombre?: string;
}

interface Props {
  value: ProveedorOption | null;
  onChange: (value: ProveedorOption | null) => void;
  label?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

const construirUrl = (busqueda: string) => {
  const params = new URLSearchParams({ page: "1", pageSize: "50" });
  const filtro = busqueda.trim();
  if (filtro) params.set("busqueda", filtro);
  return `/api/CatProveedores/sp_bw_cat_proveedores_sel?${params.toString()}`;
};

export default function ProveedorSelector({
  value,
  onChange,
  label = "Proveedor (opcional)",
  disabled,
  sx,
}: Props) {
  const { consumoApi } = useConsumoApi();
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setBusqueda(textoBusqueda.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [textoBusqueda]);

  const { data: proveedores = [], isFetching } = useQuery<ProveedorOption[]>({
    queryKey: ["proveedores-selector", busqueda],
    queryFn: async () => {
      const { data } = await consumoApi.get<ProveedorApiRow[]>(
        construirUrl(busqueda)
      );
      if (!Array.isArray(data)) return [];
      return data
        .map((item) => ({
          id: String(item.id ?? "").trim(),
          nombre: String(item.nombre ?? "").trim(),
        }))
        .filter((item) => item.id.length > 0);
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const opciones = useMemo(() => {
    if (!value) return proveedores;
    if (proveedores.some((proveedor) => proveedor.id === value.id)) {
      return proveedores;
    }
    return [value, ...proveedores];
  }, [proveedores, value]);

  return (
    <Autocomplete<ProveedorOption, false, false, false>
      options={opciones}
      value={value}
      onChange={(_, nuevo) => {
        onChange(nuevo);
        setTextoBusqueda("");
        setBusqueda("");
      }}
      onInputChange={(_, nuevo, reason) => {
        if (reason === "input" || reason === "clear") {
          setTextoBusqueda(nuevo);
          if (reason === "clear") setBusqueda("");
        }
      }}
      getOptionLabel={(option) =>
        option.nombre ? `${option.id} - ${option.nombre}` : option.id
      }
      isOptionEqualToValue={(option, seleccionado) => option.id === seleccionado.id}
      filterOptions={(opcionesServidor) => opcionesServidor}
      loading={isFetching}
      disabled={disabled}
      clearOnEscape
      size="small"
      sx={sx}
      noOptionsText="Sin proveedores"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Buscar proveedor..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isFetching ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
