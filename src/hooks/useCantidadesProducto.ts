import { useState, useEffect } from 'react';
import useConsumoApi from './useConsumoApi';

interface Cantidad {
  cantidad: number;
}

export default function useCantidadesProducto(claveProd: string | null) {
  const [cantidades, setCantidades] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { consumoApi } = useConsumoApi();

  useEffect(() => {
    if (!claveProd) {
      setCantidades([]);
      return;
    }

    const fetchCantidades = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await consumoApi.get(`/api/PuntoDeVenta/sp_fw_pos_cat_productos_cantidades_sel?clave_prod=${claveProd}`);
        
        if (response.data && Array.isArray(response.data)) {
          const cantidadesArray = response.data.map((item: Cantidad) => item.cantidad);
          setCantidades(cantidadesArray.sort((a, b) => a - b)); // Ordenar de menor a mayor
        } else {
          setCantidades([]);
        }
      } catch (err) {
        console.error('Error al obtener cantidades:', err);
        setError('No se pudieron cargar las cantidades disponibles');
        setCantidades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCantidades();
  }, [claveProd]); // Solo dependemos de claveProd

  return { cantidades, loading, error };
}
