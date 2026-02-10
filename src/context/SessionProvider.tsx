import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { IUsuario } from "../interfaces/IUsuario";

interface SessionContextProps {
  session: IUsuario | null;
  setSession: (user: IUsuario | null) => void;
  isLoading: boolean; // Añadimos un estado para controlar si la sesión está cargando
}

const SessionContext = createContext<SessionContextProps | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<IUsuario | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Inicialmente estamos cargando

  useEffect(() => {
    const loadSession = async () => {
      console.log("Iniciando carga de sesión...");
      try {
        const item = localStorage.getItem("userLoggedv2");
        console.log("Item en localStorage:", item ? "Existe" : "No existe");
        
        if (item) {
          try {
            const parsed = JSON.parse(item);
            console.log("Sesión parseada correctamente:", parsed);
            setSession(parsed);
          } catch (parseError) {
            console.error("Error al parsear JSON de sesión:", parseError);
            // Si hay un error al parsear, limpiamos el localStorage para evitar futuros errores
            localStorage.removeItem("userLoggedv2");
            setSession(null);
          }
        } else {
          // Si no hay item, confirmamos que no hay sesión
          console.log("No se encontró sesión en localStorage");
          setSession(null);
        }
      } catch (e) {
        console.error("Error general al cargar sesión:", e);
        setSession(null);
      } finally {
        // Independientemente del resultado, ya no estamos cargando
        console.log("Finalizando carga de sesión, estableciendo isLoading=false");
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  return (
    <SessionContext.Provider value={{ session, setSession, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = (): SessionContextProps => {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSessionContext debe usarse dentro de un <SessionProvider>");
  return context;
};
