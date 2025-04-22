import { useState, useEffect } from "react";
import useConsumoApi from "./useConsumoApi";

export default function useFetchData<Type>(url: string): Type[] {
  const [data, setData] = useState<Type[]>([])
  const { consumoApi } = useConsumoApi()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await consumoApi.get(url)
        setData(response.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  return data
}