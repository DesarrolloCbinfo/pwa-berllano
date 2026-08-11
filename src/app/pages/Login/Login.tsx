import React, { useState } from "react";
import { Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import useFetchData from "../../../hooks/useFetchData";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useMutation } from "@tanstack/react-query";
import { CatSucursalApis } from "../../pages/CatSucursal/apis/CatSucursalApis";
import { ICatSucursal } from "../../pages/CatSucursal/interfaces/ICatSucursal";
import { routes } from "../../../utils/Routes";
import styles from "./Login.module.css";
import useLogin from "./hooks/useLogin";
import { useSessionContext } from "../../../context/SessionProvider";
import { IUsuario } from "../../../interfaces/IUsuario";
import Swal from "sweetalert2";
import logoImage from "../../../assets/imgs/imgLogin.jpg";
import nombreLogo from "../../../assets/imgs/berllanoLogo.png";



const Login: React.FC = () => {

  useLogin()

  const navigate = useNavigate();
  const { setAuthToken } = useAuth(); // Obtener setAuthToken del contexto
  const dataSucursales = useFetchData<ICatSucursal>(CatSucursalApis.get);
  const { consumoApi } = useConsumoApi();
  const { setSession } = useSessionContext(); // Obtener setSession del contexto
  const [showPass, setShowPass] = useState(false);
const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    usuario: "",
    password: "",
  })

  
const [modalSucursal, setModalSucursal] = useState(false);
const [responseData, setResponseData] = useState<IUsuario | null>(null);
const [sucData, setSucData] = useState({ idSuc: 0, dSuc: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  // Función reutilizable para guardar sesión y navegar
  const finalizarSesion = (usuarioFinal: IUsuario) => {
    localStorage.setItem("userLoggedv2", JSON.stringify(usuarioFinal));
    setSession(usuarioFinal);
    
    // Crear objeto token compatible con AuthContext
    const tokenData = {
      claveDepartamento: usuarioFinal.idDepartamento || 0,
      clavePerfiles: usuarioFinal.clavePerfil || 0,
      contra: usuarioFinal.password || "",
      mensaje: "Autenticación exitosa",
      nombre: usuarioFinal.nombre || "",
      usuario: usuarioFinal.claveEmpleado || ""
    };
    
    setAuthToken(tokenData);
    navigate(routes.mainMenu);
  };

const handleNavigation = async () => {
  try {
    const response = await consumoApi.post(`/api/Usuario/authenticate`, form);
    console.log(response.data);

    if (response.data.acceso === 1) {
      // 1. Leemos qué sucursal nos mandó el servidor originalmente
      const idSucursalDefault = response.data.sucursal;

      // 2. Buscamos sus detalles en la lista de sucursales para tener el nombre y Cia
      const sucursalInfo = dataSucursales.find(s => s.sucursalId === idSucursalDefault);

      // 3. Armamos el objeto con la sucursal correcta
      const nuevoUsuarioBase = {
        ...response.data,
        sucursal: idSucursalDefault,
        idCia: sucursalInfo?.ciaId || 0,
        dSucursal: sucursalInfo?.nombre || "Sucursal"
      } as IUsuario;

      // 4. Si tiene sucursal fija (diferente de 0 y 99) entra directo
      const tieneSucursalAsignada =
        idSucursalDefault &&
        idSucursalDefault !== 99 &&
        idSucursalDefault !== 0;

      if (tieneSucursalAsignada) {
        finalizarSesion(nuevoUsuarioBase);
      } else {
        setResponseData(nuevoUsuarioBase);
        setModalSucursal(true);
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "No autorizado",
        text: "Usuario o contraseña incorrectos",
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo conectar con el servidor",
    });
  }
};

const handleChangeSucursal = (e: React.ChangeEvent<any>) => {
  const target = e.target as HTMLSelectElement;
  const idSucursal = Number(target.value);
  const suc = dataSucursales.find(s => s.sucursalId === idSucursal);
  setSucData({ idSuc: idSucursal, dSuc: suc?.nombre || "" });
};

const handleConfirmarSucursal = () => {
  if (sucData.idSuc === 0) {
    Swal.fire({
      icon: "error",
      title: "¡Favor de seleccionar sucursal!",
      text: "Es requerido seleccionar una sucursal para iniciar sesión.",
    });
    return;
  }

  const usuarioFinal = {
    ...responseData,
    sucursal: sucData.idSuc,
    dSucursal: sucData.dSuc,
    idCia: dataSucursales.find(s => s.sucursalId === sucData.idSuc)?.ciaId || 0,
  } as unknown as IUsuario;

  localStorage.setItem("userLoggedv2", JSON.stringify(usuarioFinal));
  setSession(usuarioFinal);

  const tokenData = {
    claveDepartamento: usuarioFinal.sucursal || 0,
    clavePerfiles: usuarioFinal.clavePerfil || 0,
    contra: usuarioFinal.password || "",
    mensaje: "Autenticación exitosa",
    nombre: usuarioFinal.nombre || "",
    usuario: usuarioFinal.claveEmpleado || ""
  };
  setAuthToken(tokenData);

  console.log("Sesión actualizada en contexto desde modal:", usuarioFinal);

  setModalSucursal(false);
  navigate(routes.mainMenu);
};



  const handleNavigationANTERIOR = async () => {
    console.log(form)
    try {
      const response = await consumoApi.post(`/api/Usuario/authenticate`, form)
      console.log(response.data)

      if(response.data.acceso === 1) {
        localStorage.setItem("userLoggedv2", JSON.stringify(response.data));
        
        // Crear objeto token compatible con AuthContext
        const tokenData = {
          claveDepartamento: response.data.idDepartamento || 0,
          clavePerfiles: response.data.clavePerfil || 0,
          contra: response.data.password || "",
          mensaje: "Autenticación exitosa",
          nombre: response.data.nombre || "",
          usuario: response.data.claveEmpleado || ""
        };
        
        setAuthToken(tokenData);
        navigate(routes.mainMenu);
      } 
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "No autorizado",
        text: "Usuario o contraseña incorrectos",
      })
    }
  }


    return (
    <>
      <div className={styles.container}>
        <div className={styles.flexContainer} >
          <figure>
            <img src={logoImage} alt="" />
          </figure>
          <div className={styles.formContainer}>
            <img
              src={nombreLogo}
              alt="FERANDI"
              style={{
                maxWidth: '100%',
                height: 48,
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto 10px'
              }}
            />
            <h1>Inicio de Sesión</h1>
            <p className={styles.subtitle}>Accede con tu usuario y contraseña</p>
<form
  onSubmit={async (e) => { e.preventDefault(); if (loading) return; setLoading(true); await handleNavigation(); setLoading(false); }}
>
 <FormGroup className={styles.formGroup}>
  <Label htmlFor="usuario" className={styles.srOnly}>Usuario</Label>
  <div className={styles.inputWrap}>
    <Input id="usuario" name="usuario" placeholder="Usuario"
           onChange={handleChange} type="text" bsSize="sm" autoComplete="username" />
  </div>
</FormGroup>

<FormGroup className={styles.formGroup}>
  <Label htmlFor="password" className={styles.srOnly}>Contraseña</Label>
  <div className={styles.inputWrap}>
    <Input id="password" name="password" placeholder="Contraseña"
           onChange={handleChange} type={showPass ? "text" : "password"} bsSize="sm"
           autoComplete="current-password" />
    <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v=>!v)}
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}>
      {showPass ? "🙈" : "👁️"}
    </button>
  </div>
</FormGroup>

  <Button type="submit" className={styles.button} disabled={loading}>
    {loading ? "Entrando…" : "Ingresar Sesión"}
  </Button>
</form>
          </div>
        </div>
      </div>
     <Modal isOpen={modalSucursal}>
  <ModalHeader>
    <h3>Seleccione la sucursal que quiere ingresar</h3>
  </ModalHeader>

  <ModalBody>
    <FormGroup>
      <Label for="sucursalSelect">Seleccione una sucursal:</Label>
      <Input 
        type="select" 
        id="sucursalSelect"
        onChange={handleChangeSucursal}
        value={sucData.idSuc}
      >
        <option value={0}>Seleccione una sucursal</option>
        {dataSucursales.map((sucursal) => (
          <option key={sucursal.sucursalId} value={sucursal.sucursalId}>
            {sucursal.nombre}
          </option>
        ))}
      </Input>
    </FormGroup>
  </ModalBody>

  <ModalFooter>
    <Button color="primary" onClick={handleConfirmarSucursal}>
      Confirmar
    </Button>
    <Button color="danger" onClick={() => setModalSucursal(false)}>
      Cancelar
    </Button>
  </ModalFooter>
</Modal>


      {/* <Modal isOpen={modalSucursal}>
        <ModalHeader>
          <div>
            <h3>Seleccione la sucursal que quiere ingresar</h3>
          </div>
        </ModalHeader>

        <ModalBody>
          <Input type="select" onChange={handleChange}>
            <option value={0}>Seleccione una sucursal</option>
            {dataSucursales.map((sucursal) => {
              return <option value={sucursal.sucursalId}>{sucursal.nombre}</option>;
            })}
          </Input>
        </ModalBody>

        <ModalFooter>
        </ModalFooter>
      </Modal> */}
    </>
  );

};
export default Login



// // old  login//
// interface LoginFormData {
//   usuario: string;
//   password: string;
// }

// interface Sucursal {
//   id_sucursal: number;
//   nombre: string;
// }

// interface LoginResponse {
//   usuario: string;
//   clavePerfiles: number;
//   contra: string;
//   nombre: string;
//   claveDepartamento: number;
//   mensaje: string;
// }



// const Login: React.FC = () => {
//   const [formData, setFormData] = useState<LoginFormData>({
//     usuario: "",
//     password: "",
//   });
//   const [errors, setErrors] = useState<Partial<LoginFormData>>({});
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [loginError, setLoginError] = useState<string | null>(null);
//   const [modalSucursal, setModalSucursal] = useState(false);
//   const [selectedSucursal, setSelectedSucursal] = useState<number>(0);
//   const [responseData, setResponseData] = useState<LoginResponse | null>(null);
//   const [showErrorAlert, setShowErrorAlert] = useState(false);

//   const dataSucursales: Sucursal[] = [
//     { id_sucursal: 1, nombre: "Araucarias" },
//     { id_sucursal: 2, nombre: "Plaza 1" },
//     { id_sucursal: 3, nombre: "Plaza 2" },
//     { id_sucursal: 4, nombre: "Veracruz" },
//     { id_sucursal: 5, nombre: "Dorado" },
//     { id_sucursal: 6, nombre: "Andamar" },
//     { id_sucursal: 7, nombre: "Juguete" },
//     { id_sucursal: 203, nombre: "Oficina" },
//   ];

//   const { setAuthToken } = useAuth();
//   const { consumoApi } = useConsumoApi();
//   const navigate = useNavigate();

//   const { mutate: attemptLogin } = useMutation({
//     mutationFn: async ({ usuario, password }: LoginFormData) => {
//       const response: LoginResponse = await consumoApi
//         .get(`/api/Login?usuario=${usuario}&password=${password}`)
//         .then((res) => res.data);

//       if (
//         response.mensaje !== "Usuario o contraseña incorrectos" &&
//         response.mensaje !== "Claves incorrectas"
//       ) {
//         console.log(response);
//         // Verificar si clavePerfiles es 13
//         if (response.claveDepartamento == 203) {
//           setResponseData(response);
//           setModalSucursal(true);
//         } else {
//           localStorage.setItem("token", JSON.stringify(response));
//           setAuthToken(response);
//           navigate("/");
//         }
//       } else {
//         setLoginError(response.mensaje);
//         return;
//       }
//     },
//   });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });

//     // Clear error when user types
//     if (errors[name as keyof LoginFormData]) {
//       setErrors({
//         ...errors,
//         [name]: undefined,
//       });
//     }
//   };

//   const handleSucursalChange = (event: any) => {
//     setSelectedSucursal(Number(event.target.value));
//     setShowErrorAlert(false);
//   };

//   const handleSucursalSubmit = () => {
//     if (selectedSucursal === 0) {
//       setShowErrorAlert(true);
//       return;
//     }

//     const sucursalSeleccionada = dataSucursales.find(
//       (s) => s.id_sucursal === selectedSucursal
//     );

//     if (responseData) {
//       const userDataWithSucursal = {
//         ...responseData,
//         claveDepartamento: selectedSucursal,
//         d_sucursal: sucursalSeleccionada?.nombre || "",
//       };

//       localStorage.setItem("token", JSON.stringify(userDataWithSucursal));
//       setAuthToken(userDataWithSucursal);
//       setModalSucursal(false);
//       navigate("/");
//     }
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   const validateForm = (): boolean => {
//     const newErrors: Partial<LoginFormData> = {};

//     if (!formData.usuario.trim()) {
//       newErrors.usuario = "El usuario es requerido";
//     }

//     if (!formData.password) {
//       newErrors.password = "La contraseña es requerida";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       return;
//     }

//     setIsLoading(true);
//     setLoginError(null);

//     try {
//       attemptLogin(formData);
//     } catch (error) {
//       console.error("Error de inicio de sesión:", error);
//       setLoginError("Error al iniciar sesión. Por favor, verifica tus credenciales.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <>
//       {/* Modal de selección de sucursal */}
//       <Dialog
//         open={modalSucursal}
//         onClose={() => setModalSucursal(false)}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle>
//           <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
//             Elige la sucursal
//           </Typography>
//         </DialogTitle>
//         <DialogContent>
//           {showErrorAlert && (
//             <Alert severity="error" sx={{ mb: 2 }}>
//               Selecciona una sucursal para iniciar sesión.
//             </Alert>
//           )}
//           <FormControl fullWidth sx={{ mt: 2 }}>
//             <InputLabel id="sucursal-select-label">Selecciona una sucursal...</InputLabel>
//             <Select
//               labelId="sucursal-select-label"
//               value={selectedSucursal}
//               label="Selecciona una sucursal..."
//               onChange={handleSucursalChange}
//             >
//               <MenuItem value={0} disabled>
//                 Selecciona una sucursal...
//               </MenuItem>
//               {dataSucursales.map((sucursal) => (
//                 <MenuItem key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
//                   {sucursal.nombre}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//         </DialogContent>
//         <DialogActions sx={{ p: 3, gap: 1 }}>
//           <Button
//             variant="outlined"
//             color="error"
//             onClick={() => {
//               setModalSucursal(false);
//               setSelectedSucursal(0);
//               setShowErrorAlert(false);
//             }}
//           >
//             Cancelar
//           </Button>
//           <Button variant="contained" color="primary" onClick={handleSucursalSubmit}>
//             Ingresar al sistema
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
//         <figure style={{ width: "100%" }}>
//           <img
//             src="/berllano-logo.jpg"
//             style={{
//               width: "100%",
//               height: "100%",
//               objectFit: "contain",
//               aspectRatio: "16/9",
//             }}
//           />
//         </figure>
//         <Paper
//           elevation={3}
//           sx={{
//             p: 4,
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             borderRadius: 2,
//           }}
//         >
//           <Typography
//             component="h1"
//             variant="h5"
//             sx={{
//               mb: 3,
//               fontWeight: "bold",
//             }}
//           >
//             Iniciar Sesión
//           </Typography>

//           {loginError && (
//             <Typography color="error" sx={{ mb: 2 }}>
//               {loginError}
//             </Typography>
//           )}

//           <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               id="usuario"
//               label="Usuario"
//               name="usuario"
//               autoComplete="username"
//               autoFocus
//               value={formData.usuario}
//               onChange={handleChange}
//               error={!!errors.usuario}
//               helperText={errors.usuario}
//               disabled={isLoading}
//               sx={{ mb: 2 }}
//             />

//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               name="password"
//               label="Contraseña"
//               type={showPassword ? "text" : "password"}
//               id="password"
//               autoComplete="current-password"
//               value={formData.password}
//               onChange={handleChange}
//               error={!!errors.password}
//               helperText={errors.password}
//               disabled={isLoading}
//               InputProps={{
//                 endAdornment: (
//                   <InputAdornment position="end">
//                     <IconButton
//                       aria-label="toggle password visibility"
//                       onClick={togglePasswordVisibility}
//                       edge="end"
//                     >
//                       {showPassword ? <VisibilityOff /> : <Visibility />}
//                     </IconButton>
//                   </InputAdornment>
//                 ),
//               }}
//               sx={{ mb: 3 }}
//             />

//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               disabled={isLoading}
//               sx={{
//                 mt: 2,
//                 mb: 2,
//                 py: 1.5,
//                 backgroundColor: "#1976d2",
//                 "&:hover": {
//                   backgroundColor: "#115293",
//                 },
//                 fontWeight: "bold",
//               }}
//             >
//               {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
//             </Button>
//           </Box>
//         </Paper>
//       </Container>
//     </>
//   );
// };

// export default Login;
