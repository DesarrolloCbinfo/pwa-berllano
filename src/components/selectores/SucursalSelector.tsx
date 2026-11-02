import { useEffect, useMemo } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import useConsumoApi from "../../hooks/useConsumoApi";

export interface SucursalOption {
  cve_sucursal: number;
  nombre: string;
}

interface SucursalApiRow {
  cve_sucursal?: number | string;
  nombre?: string;
}

interface Props {
  value: SucursalOption | null;
  onChange: (value: SucursalOption) => void;
  defaultSucursalId?: number;
  autoSelect?: boolean;
  label?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export default function SucursalSelector({
  value,
  onChange,
  defaultSucursalId,
  autoSelect = true,
  label = "Sucursal destino",
  disabled,
  sx,
}: Props) {
  const { consumoApi } = useConsumoApi();

  const { data: sucursales = [], isFetching } = useQuery<SucursalOption[]>({
    queryKey: ["sucursales-selector"],
    queryFn: async () => {
      const { data } = await consumoApi.get<SucursalApiRow[]>(
        "/api/CatSucursales/sp_bw_cat_sucursales_sel",
        { params: { cve_sucursal: 0 } }
      );
      if (!Array.isArray(data)) return [];
      return data
        .map((item) => ({
          cve_sucursal: Number(item.cve_sucursal) || 0,
          nombre: String(item.nombre ?? "").trim(),
        }))
        .filter(
          (item) =>
            item.cve_sucursal > 0 && item.nombre.toUpperCase() !== "TODAS"
        )
        .sort((a, b) => a.cve_sucursal - b.cve_sucursal);
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!autoSelect || value || sucursales.length === 0) return;
    const predeterminada =
      sucursales.find((sucursal) => sucursal.cve_sucursal === defaultSucursalId) ??
      sucursales[0];
    if (predeterminada) onChange(predeterminada);
  }, [autoSelect, value, sucursales, defaultSucursalId, onChange]);

  const opciones = useMemo(() => {
    if (!value) return sucursales;
    if (sucursales.some((sucursal) => sucursal.cve_sucursal === value.cve_sucursal)) {
      return sucursales;
    }
    return [value, ...sucursales];
  }, [sucursales, value]);

  return (
    <Autocomplete<SucursalOption, false, boolean, false>
      options={opciones}
      value={value}
      onChange={(_, nueva) => {
        if (nueva) onChange(nueva);
      }}
      getOptionLabel={(option) => option.nombre}
      isOptionEqualToValue={(option, seleccionada) =>
        option.cve_sucursal === seleccionada.cve_sucursal
      }
      disableClearable
      loading={isFetching}
      disabled={disabled}
      size="small"
      sx={sx}
      noOptionsText="Sin sucursales"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
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
