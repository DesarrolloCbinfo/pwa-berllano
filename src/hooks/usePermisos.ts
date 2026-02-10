import { useState, useEffect } from "react";
import useConsumoApi from "./useConsumoApi";
import { useNavigate } from "react-router-dom";
import { UsuarioApis } from "../apis/UsuarioApis";
import { IPermiso } from "../interfaces/IPermiso";
import { routes } from "../utils/Routes";
import Swal from "sweetalert2";
import { IUsuario } from "../interfaces/IUsuario";

export default function usePermisos(modulo: string): boolean {
  const [permiso, setPermiso] = useState<IPermiso>({
    usuario: 0,
    modulo: modulo
  })
  const [result, setResult] = useState<boolean>(false)
  const navigate = useNavigate()
  const { consumoApi } = useConsumoApi();

  useEffect(() => {
    const item = localStorage.getItem("userLoggedv2");

    if (item) {
      try {
        const parsedItem: IUsuario = JSON.parse(item);
//        console.log("Parsed Item")
//        console.log(parsedItem)
        permiso.usuario = parsedItem.id? parsedItem.id : 0
      } catch (error) {
        console.error("Error al analizar JSON de localStorage:", error);
      }
    }

    filtroSeguridad()
  }, []);

  const filtroSeguridad = async () => {
    if (permiso.usuario === 0) {
      Swal.fire({
        icon: "error",
        title: "Sesión no iniciada",
        text: "Por favor inicie sesión para continuar"
      })
        .then(() => navigate(routes.login))
      return false
    }

//    console.log("usuario")
//    console.log(permiso)
    try {
      const response = await consumoApi.post(UsuarioApis.permiso, permiso)
//      console.log(response.data)
      setResult(response.data.permiso)
    } catch (error) {
      console.log(error)
    }
  }

  return result
}