import React, { useState,useEffect } from "react";
import useConsumoApi from "../../../hooks/useConsumoApi";
import "./styles/nivelacionInventario.css";

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

    const handleNivelacion = () => {
        console.log({
            area,
            marca,
            diasMinimo,
            diasStock,
            periodos
        });

        setGuardarDisabled(true);
    };

    const handleGuardar = () => {
        console.log("Guardar");
        setGuardarDisabled(!false);
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
                                <option key={area.area} value={area.area}>
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
                                <option key={marca.id} value={marca.id}>
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
                    className="btn btn--secondary" disabled={guardarDisabled}
                    onClick={handleGuardar}
                >
                    Guardar
                </button>

            </section>

        </main>
    );
};

export default NivelacionInventarioPage;