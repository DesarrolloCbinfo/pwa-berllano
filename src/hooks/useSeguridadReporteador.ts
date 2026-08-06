// import { useEffect, useState } from "react";
// import { Usuario } from "../../models/Usuario";
// import { jezaApi } from "../../api/jezaApi";

//       /* PASO1 */
//   const [session, setSession] = useState<Usuario[]>([]);
//   /* PASO2 */
//   useEffect(() => {
//     const item = localStorage.getItem("userLogged");
//     if (item !== null) {
//       const parsedItem = JSON.parse(item);
//       setSession(parsedItem);
//     }
//   }, []);

//   const useSeguridad =async ()=>{

//     const response = await jezaApi.get(`/Permiso?usuario=${session.map((usuario) => usuario.id)}&modulo=CAT_EMPRE_DEL`);

//      alert (response)
//   }

// export default useSeguridad;
//----------------------------------------------------------------------------------------------------------------------------------------------------------------
import { useEffect, useState } from "react";
import { Usuario } from "../models/Usuario";
import useConsumoApi from "./useConsumoApi";
import Swal from "sweetalert2";
import { AxiosError } from 'axios';
const useSeguridad = () => {
  const [session, setSession] = useState<Usuario[]>([]);
  const { consumoApi } = useConsumoApi();

  // const filtroSeguridad = async (modulo: string): Promise<boolean> => {
  //   console.log(`/Permiso?usuario=${session.map((usuario) => usuario.id)}&modulo=${modulo}`);
  //   if (session.length > 0) {
  //     const response = await jezaApi.get(`/Permiso?usuario=${session.map((usuario) => usuario.id)}&modulo=${modulo}`);

  //     if (response.data[0].permiso === false) {
  //       Swal.fire({
  //         icon: "error",
  //         title: `${response.data[0].mensaje}`,
  //         text: `Su perfil de usuario no cuenta con los permisos necesarios para realizar esta acción. Si necesita obtener los permisos adecuados, por favor, póngase en contacto con el equipo de sistemas.`,
  //       });
  //       console.log(response.data[0].permiso);
  //       return false; // No se otorga el permiso
  //     }
  //   }else{
  //      Swal.fire({
  //         icon: "error",
  //         title: "",
  //         text: `Su perfil de usuario no cuenta con los permisos necesarios para realizar esta acción. Si necesita obtener los permisos adecuados, por favor, póngase en contacto con el equipo de sistemas.`,
  //       });
  //   }

  //   return true; // Se otorga el permiso
  // };

  useEffect(() => {
    const item = localStorage.getItem("userLoggedv2");
    if (item !== null) {
      try {
        const parsedItem = JSON.parse(item);
        setSession(parsedItem); // Aquí estableces el valor de session con parsedItem
      } catch (error) {
        console.error("Error parsing JSON from localStorage:", error);
      }
    }
  }, []);

  // const filtroSeguridad = async (modulo: string): Promise<boolean> => {
   
  //   if (session.length === 0) {
  //     // Manejar el caso cuando session está vacío
  //     // Swal.fire({
  //     //   icon: "error",
  //     //   title: "",
  //     //   text: `[session length=0]Su perfil de usuario no cuenta con los permisos necesarios para realizar esta acción. Si necesita obtener los permisos adecuados, por favor, póngase en contacto con el equipo de sistemas.`,
  //     // });
  //     return false; // No se otorga el permiso
  //   }

  //   // Ahora, session tiene elementos, puedes usar session.map
  //   console.log(`/Permiso?usuario=${session.map((usuario) => usuario.id)}&modulo=${modulo}`);

  //   const response = await jezaApi.get(`/Permiso?usuario=${session.map((usuario) => usuario.id)}&modulo=${modulo}`);
  //   // if(session){
  //   // }
  //   if(response.data.token == 'Se ha denegado la autorización para esta solicitud.'){
  //     alert("Reiniciamos")
  //   }
  //   if (response.data[0].permiso == false) {
  //     Swal.fire({
  //       icon: "error",
  //       title: `${response.data[0].mensaje}`,
  //       text: `Su perfil de usuario no cuenta con los permisos necesarios para realizar esta acción. Si necesita obtener los permisos adecuados, por favor, póngase en contacto con el equipo de sistemas.`,
  //     });
  //     console.log(response.data[0].permiso);
  //     return false; // No se otorga el permiso
  //   }

  //   return true; // Se otorga el permiso
  // };

  const filtroSeguridad = async (modulo: string): Promise<boolean> => {
    try {
      if (session.length === 0) {
        // Manejar el caso cuando session está vacío
        Swal.fire({
          icon: "error",
          title: "",
          text: `Su perfil de usuario no cuenta con los permisos necesarios para realizar esta acción. Si necesita obtener los permisos adecuados, por favor, póngase en contacto con el equipo de sistemas.`,
        });
        return false; // No se otorga el permiso
      }
  
      console.log(`/Permiso?usuario=${session.map((usuario) => usuario.id)}&modulo=${modulo}`);
  
      const response = await consumoApi.get(`/Permiso?usuario=${session.map((usuario) => usuario.id)}&modulo=${modulo}`);
  
      if (response.data[0].permiso === false) {
        Swal.fire({
          icon: "error",
          title: `${response.data[0].mensaje}`,
          text: `Su perfil de usuario no cuenta con los permisos necesarios para realizar esta acción. Si necesita obtener los permisos adecuados, por favor, póngase en contacto con el equipo de sistemas.`,
        });
  
        console.log(response.data[0].permiso);
        return false; // No se otorga el permiso
      }
  
      return true; // Se otorga el permiso
  
    } catch (error) {
      // Manejar el error, incluida la verificación del estado 401
      if (error.response && error.response.status === 401) {
        const responseData = error.response.data;
  
        if (responseData.Message === 'Se ha denegado la autorización para esta solicitud.') {
          // alert("Reiniciamos");
          Swal.fire({
            icon: "error",
            title: "Tiempo de sesión expirado",
            text: "Favor de iniciar sesión nuevamente",
            confirmButtonColor: "#3085d6",
            allowOutsideClick: false,
            // showCancelButton: true,
            // cancelButtonText: "Cancelar",
          }).then((result) => {
            if (result.isConfirmed) {
              // Redirigir al usuario a la página de inicio de sesión
              window.location.href = 'https://217.216.95.62:5001/'; // Puedes ajustar la ruta según tu configuración
            } else {
              // Puedes manejar otras acciones si el usuario cancela la alerta
            }
          });
        }
      }
          // Puedes redirigir al usuario o realizar otras acciones según tu lógica
       
      // Manejar otros errores si es necesario
      console.error("Error en la solicitud:", error);
      return false; // No se otorga el permiso por error
    }
  
};

  //   useEffect(() => {
  //     fetchData();
  //   }, [session]);

  // Resto de tu lógica
  return { session, filtroSeguridad };
};

export default useSeguridad;
