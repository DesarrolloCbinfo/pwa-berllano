// import { useState, useEffect } from "react";
// import { IUsuario } from "../interfaces/IUsuario";

// export default function useSession(): IUsuario | undefined {
//   const [session, setSession] = useState<IUsuario>()

//   useEffect(() => {
//     const item = localStorage.getItem("userLoggedv2");

//     if (item) {
//       try {
//         const parsedItem: IUsuario = JSON.parse(item);
// //        console.log("Parsed Item")
// //        console.log(parsedItem)
//         setSession(parsedItem)
//       } catch (error) {
//         console.error("Error al analizar JSON de localStorage:", error);
//       }
//     }
//   }, []);

//   return session
// }

import { IUsuario } from "../interfaces/IUsuario";
import { useSessionContext } from "../context/SessionProvider";

// Este hook ahora es un wrapper alrededor de useSessionContext para mantener compatibilidad
// con el código existente que utiliza useSession
export default function useSession(): IUsuario | null {
  // Utilizamos directamente el contexto de sesión en lugar de implementar nuestra propia lógica
  const { session } = useSessionContext();
  
  // Ya no necesitamos logs de depuración aquí, ya que la lógica está en SessionProvider
  // console.log('useSession utilizando el contexto de sesión');
  
  return session;
}
