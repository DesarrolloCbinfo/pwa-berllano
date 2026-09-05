import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import useConsumoApi from "../../../hooks/useConsumoApi";
import "./styles/nivelacionInventario.css";
import Swal from "sweetalert2";
import { Box, Tabs, Tab, CircularProgress, Typography } from "@mui/material";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";

interface Periodo {
    id: number;
    f1: string;
    f2: string;
}

interface CatMarcas {
  id: number;
  marca: string;
  obsoleto: boolean;
}

interface CatArea {
  area: string
  descripcion: string
  version: string | null
  fecha_alta: string | null
  fecha_act: string | null
}

interface ResumenNivelacion01 {
  clave_prod: string;
  descripcion: string;
  marca: string;
  [key: string]: string | number | null | undefined;
}

interface ResumenNivelacion02 {
  SucOrigen: number;
  SucDestino: string;
  clave_prod: string;
  descripcion: string;
  marca: string;
  cantidad: number;
}

interface ResumenNivelacion03 {
  SucOrigen: number;
  SucDestino: string;
  SALIDAS: number;
}

const NivelacionInventarioPage: React.FC = () => {
      const { consumoApi } = useConsumoApi();

    const [folio, setFolio] = useState("");
    const [area, setArea] = useState("");
    const [areas, setAreas] = useState<CatArea[]>([]);
    const [marca, setMarca] = useState("");
    const [diasMinimo, setDiasMinimo] = useState("");
    const [diasStock, setDiasStock] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState<CatMarcas[]>([]);
    const [guardarDisabled, setGuardarDisabled] = useState(true);

    const [periodos, setPeriodos] = useState<Periodo[]>([
        {
            id: 1,
            f1: "",
            f2: ""
        }
    ]);

    const [tabValue, setTabValue] = useState(0);
    const [dataResumen01, setDataResumen01] = useState<ResumenNivelacion01[]>([]);
    const [dataResumen02, setDataResumen02] = useState<ResumenNivelacion02[]>([]);
    const [dataResumen03, setDataResumen03] = useState<ResumenNivelacion03[]>([]);
    const [loadingGuardar, setLoadingGuardar] = useState(false);


    useEffect(() => {
        fetchMarcas();
        fetchAreas();
    }, []);



  const fetchMarcas = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatMarcas/sp_bw_cat_marcas_sel?id=0',
      );
      // Filtrar la marca con id 0 (TODAS) para que no se muestre en la tabla
      const filteredData = response.data.filter((marca: CatMarcas) => marca.id !== 0);
      setRows(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };


    const fetchAreas = async () => {
    setLoading(true)
    try {
      const res = await consumoApi.get('/api/CatPermisosDeptos/sp_bw_cat_areas_sel?area=0')
      if (res.status === 200) {
        setAreas(res.data || [])
      }
    } catch (error: any) {
      postMessage({ text: "Error al cargar áreas", type: 'error' })
    } finally {
      setLoading(false)
    }
  }



    const handleBuscar = () => {
        console.log("Buscar folio:", folio);
    };

    const sucursalesResumen01 = useMemo(() => {
        const sucursales: string[] = [];
        const primerRegistro = dataResumen01[0];
        if (!primerRegistro) return sucursales;

        Object.keys(primerRegistro).forEach((key) => {
            const match = key.match(/^e(\d+)$/);
            if (match && !sucursales.includes(match[1])) {
                sucursales.push(match[1]);
            }
        });

        return sucursales.sort((a, b) => Number(a) - Number(b));
    }, [dataResumen01]);

    const columnsResumen01 = useMemo<MRT_ColumnDef<ResumenNivelacion01>[]>(
        () => [
            { accessorKey: "clave_prod", header: "Clave", size: 140 },
            { accessorKey: "descripcion", header: "Descripción", size: 260 },
            { accessorKey: "marca", header: "Marca", size: 180 },
            ...sucursalesResumen01.flatMap((suc) => [
                { accessorKey: `e${suc}`, header: `Exist ${suc}`, size: 90, align: "right" as const },
                { accessorKey: `stock_minimo${suc}`, header: `Stock mín ${suc}`, size: 110, align: "right" as const },
                { accessorKey: `desp${suc}`, header: `Desp ${suc}`, size: 90, align: "right" as const },
                { accessorKey: `dias${suc}`, header: `Días ${suc}`, size: 80, align: "right" as const },
                { accessorKey: `despDiario${suc}`, header: `Desp diario ${suc}`, size: 120, align: "right" as const },
                { accessorKey: `cantNecesaria${suc}`, header: `Cant necesaria ${suc}`, size: 140, align: "right" as const },
                { accessorKey: `stockResultado${suc}`, header: `Stock result ${suc}`, size: 130, align: "right" as const },
                { accessorKey: `Faltante${suc}`, header: `Faltante ${suc}`, size: 100, align: "right" as const },
                { accessorKey: `Excedente${suc}`, header: `Excedente ${suc}`, size: 110, align: "right" as const },
            ]),
        ],
        [sucursalesResumen01]
    );

    const columnsResumen02 = useMemo<MRT_ColumnDef<ResumenNivelacion02>[]>(
        () => [
            { accessorKey: "SucOrigen", header: "Sucursal origen", size: 140 },
            { accessorKey: "SucDestino", header: "Sucursal destino", size: 150 },
            { accessorKey: "clave_prod", header: "Clave", size: 120 },
            { accessorKey: "descripcion", header: "Descripción", size: 280 },
            { accessorKey: "marca", header: "Marca", size: 180 },
            { accessorKey: "cantidad", header: "Cantidad", size: 100, align: "right" },
        ],
        []
    );

    const columnsResumen03 = useMemo<MRT_ColumnDef<ResumenNivelacion03>[]>(
        () => [
            { accessorKey: "SucOrigen", header: "Sucursal origen", size: 150 },
            { accessorKey: "SucDestino", header: "Sucursal destino", size: 150 },
            {
                accessorKey: "SALIDAS",
                header: "Salidas",
                size: 130,
                align: "right",
                Cell: ({ cell }) => Number(cell.getValue<number>()).toFixed(3),
            },
        ],
        []
    );

const handleNivelacion = async () => {
    // Si la variable está vacía, nula o solo tiene espacios, asigna '%'
    const areaParam = area.trim() !== "" ? area : "%";
    const marcaParam = marca.trim() !== "" ? marca : "%";

    console.log({ area: areaParam, marca: marcaParam, diasMinimo, diasStock, periodos });

    try {
        // Mapeo según la prueba cURL: p1=diasStock, p2=marca, p3=diasMinimo, p4=area
        const response = await consumoApi.post(
            `/api/nivelacionInventario/sp_bw_nivelacionInventario?p1=${diasStock}&p2=${encodeURIComponent(marcaParam)}&p3=${diasMinimo}&p4=${encodeURIComponent(areaParam)}`,
            {}
        );

        const resultado = response.data?.[0];

        if (resultado && resultado.codigo === 0) {
            Swal.fire({
                icon: 'success',
                title: resultado.mensaje2 || '¡Éxito!',
                text: resultado.mensaje1 || 'Nivelación exitosa'
            });
            setGuardarDisabled(false); // Habilitar el botón Guardar

 try {
            const [res01, res02, res03] = await Promise.all([
                consumoApi.get(`/api/nivelacionInventario/sp_obtiene_resumenNivelacion01`),
                consumoApi.get(`/api/nivelacionInventario/sp_obtiene_resumenNivelacion02`),
                consumoApi.get(`/api/nivelacionInventario/sp_obtiene_resumenNivelacion03`),
            ]);

            setDataResumen01(res01.data || []);
            setDataResumen02(res02.data || []);
            setDataResumen03(res03.data || []);
            setTabValue(0);

            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Resúmenes generados correctamente.'
            });
        } catch (error: unknown) {
            console.error("Error al generar los resúmenes:", error);

            let mensaje = 'No se pudieron generar los resúmenes.';
            if (axios.isAxiosError(error)) {
                const data = error.response?.data as { mensaje1?: string } | undefined;
                mensaje = data?.mensaje1 || mensaje;
            }

            Swal.fire({
                icon: 'error',
                title: 'Error de red',
                text: mensaje
            });
        } finally {
            setLoadingGuardar(false);
        }

        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: resultado?.mensaje1 || 'Ocurrió un problema al procesar la nivelación.'
            });
        }

    } catch (error: unknown) {
        console.error("Error al guardar la nivelación:", error);

        let mensaje = 'No se pudo conectar con el servidor.';
        if (axios.isAxiosError(error)) {
            const data = error.response?.data as { mensaje1?: string } | undefined;
            mensaje = data?.mensaje1 || mensaje;
        }

        Swal.fire({
            icon: 'error',
            title: 'Error de red',
            text: mensaje
        });
    }


};

const handleGuardar = async () => {
       
     

    };

    return (
        <main className="nivelacion">

            {/* HEADER */}
            <header className="nivelacion__header">

                <div>
                    <span className="nivelacion__modulo">
                        Módulo de
                    </span>

                    <h1>
                        Generación de nivelaciones
                    </h1>
                </div>

                <div className="nivelacion__folio">

                    <label htmlFor="folio">
                        Folio
                    </label>

                    <div className="folio__control">

                        <input
                            id="folio"
                            type="text"
                            value={folio}
                            onChange={(e) => setFolio(e.target.value)}
                        />

                        <button onClick={handleBuscar}>
                            Buscar
                        </button>

                    </div>

                </div>

            </header>


            {/* CONTENIDO */}
            <section className="nivelacion__contenido">

                {/* FILTROS */}
                <div className="nivelacion__filtros">

                    <div className="campo">
                        <label htmlFor="area">
                            Áreas
                        </label>

                        <select
                            id="area"
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                        >
                            <option value="">
                                Seleccionar área
                            </option>

                            {areas.map((area) => (
                                <option key={area.area} value={area.descripcion}>
                                    {area.descripcion}
                                </option>
                            ))}
                        </select>
                    </div>


                    <div className="campo">
                        <label htmlFor="marca">
                            Marca
                        </label>

                        <select
                            id="marca"
                            value={marca}
                            onChange={(e) => setMarca(e.target.value)}
                        >
                            <option value="">
                                Seleccionar marca
                            </option>

                            {rows.map((marca) => (
                                <option key={marca.id} value={marca.marca}>
                                    {marca.marca}
                                </option>
                            ))}
                        </select>
                    </div>


                    <div className="campo">
                        <label htmlFor="diasMinimo">
                            Días mínimo excedente
                        </label>

                        <input
                            id="diasMinimo"
                            type="number"
                            value={diasMinimo}
                            onChange={(e) => setDiasMinimo(e.target.value)}
                        />
                    </div>


                    <div className="campo">
                        <label htmlFor="diasStock">
                            Días stock a provisionar
                        </label>

                        <input
                            id="diasStock"
                            type="number"
                            value={diasStock}
                            onChange={(e) => setDiasStock(e.target.value)}
                        />
                    </div>

                </div>


                {/* PERIODOS */}
                <div className="nivelacion__periodos">

                    <h2>
                        Períodos
                    </h2>

                    <div className="periodos__tabla">

                        <table>

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Fecha inicial</th>
                                    <th>Fecha final</th>
                                </tr>
                            </thead>

                            <tbody>

                                {periodos.map((periodo) => (

                                    <tr key={periodo.id}>

                                        <td>
                                            {periodo.id}
                                        </td>

                                        <td>
                                            <input
                                                type="date"
                                                value={periodo.f1}
                                                onChange={(e) => {
                                                    setPeriodos(prev =>
                                                        prev.map(p =>
                                                            p.id === periodo.id
                                                                ? { ...p, f1: e.target.value }
                                                                : p
                                                        )
                                                    );
                                                }}
                                            />
                                        </td>

                                        <td>
                                            <input
                                                type="date"
                                                value={periodo.f2}
                                                onChange={(e) => {
                                                    setPeriodos(prev =>
                                                        prev.map(p =>
                                                            p.id === periodo.id
                                                                ? { ...p, f2: e.target.value }
                                                                : p
                                                        )
                                                    );
                                                }}
                                            />
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>

            </section>


            {/* ACCIONES */}
            <section className="nivelacion__acciones">

                <button
                    className="btn btn--primary"
                    onClick={handleNivelacion}
                >
                    Nivelación
                </button>

                <button
                    className="btn btn--secondary" 
                    onClick={handleGuardar}
                >
                    Guardar
                </button>

            </section>

            {/* RESÚMENES */}
            <section className="nivelacion__resumenes">

                {loadingGuardar && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loadingGuardar && (dataResumen01.length > 0 || dataResumen02.length > 0 || dataResumen03.length > 0) && (
                    <>
                        <Tabs
                            value={tabValue}
                            onChange={(_e, v) => setTabValue(v)}
                            sx={{ mb: 2 }}
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            <Tab label="Resumen Nivelación 1" />
                            <Tab style={{ backgroundColor: '#ED7B64' , color: '#000000'}} label="Resumen Nivelación 2" />
                            <Tab style={{ backgroundColor: '#61CC61' , color: '#000000'}} label="Resumen Nivelación 3" />
                        </Tabs>

                        {tabValue === 0 && (
                            dataResumen01.length > 0
                                ? (
                                    <MaterialReactTable
                                        columns={columnsResumen01}
                                        data={dataResumen01}
                                        enableStickyHeader
                                        initialState={{ density: 'compact' }}
                                        muiTablePaperProps={{ sx: { maxWidth: '100%', overflowX: 'auto' } }}
                                    />
                                )
                                : (
                                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                        No hay datos de resumen de nivelación.
                                    </Typography>
                                )
                        )}

                        {tabValue === 1 && (
                            dataResumen02.length > 0
                                ? (
                                    <MaterialReactTable
                                        columns={columnsResumen02}
                                        data={dataResumen02}
                                        enableStickyHeader
                                        initialState={{ density: 'compact' }}
                                        muiTablePaperProps={{ sx: { maxWidth: '100%', overflowX: 'auto' } }}
                                    />
                                )
                                : (
                                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                        No hay movimientos.
                                    </Typography>
                                )
                        )}

                        {tabValue === 2 && (
                            dataResumen03.length > 0
                                ? (
                                    <MaterialReactTable
                                        columns={columnsResumen03}
                                        data={dataResumen03}
                                        enableStickyHeader
                                        initialState={{ density: 'compact' }}
                                        muiTablePaperProps={{ sx: { maxWidth: '100%', overflowX: 'auto' } }}
                                    />
                                )
                                : (
                                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                        No hay salidas.
                                    </Typography>
                                )
                        )}
                    </>
                )}

            </section>

        </main>
    );
};

export default NivelacionInventarioPage;