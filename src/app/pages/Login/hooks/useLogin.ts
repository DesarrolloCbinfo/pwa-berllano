import { useState, useEffect } from "react";
import useConsumoApi from "../../../../hooks/useConsumoApi";
import { useNavigate } from "react-router-dom";
import { UsuarioApis } from "../../../../apis/UsuarioApis";
import { routes } from "../../../../utils/Routes";
import { IUsuario } from "../../../../interfaces/IUsuario";

interface ILogin {
  usuario: string
  password: string
}

export default function useLogin(): void {
  const [login, setLogin] = useState<ILogin>({
    usuario: "",
    password: ""
  })
  const navigate = useNavigate()
  const { consumoApi } = useConsumoApi();

  // useEffect(() => {
  //   const item = localStorage.getItem("userLoggedv2");

  //   if (item) {
  //     try {
  //       const parsedItem: IUsuario = JSON.parse(item);
  //       login.usuario = parsedItem.claveEmpleado?.toString()?? ""
  //       login.password = parsedItem.password
  //     } catch (error) {
  //     //  console.error("Error al analizar JSON de localStorage:", error);
  //     }
  //   }

  //   filtroSeguridad()
  // }, []);


useEffect(() => {
    const item = localStorage.getItem("userLoggedv2");
  
    if (item) {
      try {
        const parsedItem: IUsuario = JSON.parse(item);
  
        if (!parsedItem.claveEmpleado) {
          localStorage.removeItem("userLoggedv2"); // Si no hay usuario válido, limpiar
          return;
        }
  
        login.usuario = parsedItem.claveEmpleado?.toString() ?? "";
        login.password = parsedItem.password;
  
        filtroSeguridad();
      } catch (error) {
        localStorage.removeItem("userLoggedv2"); // Si hay error, eliminar sesión
      }
    }
  }, []);

  const filtroSeguridad = async () => {

//     try {
//       const response = await consumoApi.post(UsuarioApis.autenticacion, login)

//       if(response.status === 200) {
//         navigate(routes.mainMenu)
//       }
//     } catch (error) {
// //      console.log(error)
//     }
  }
}