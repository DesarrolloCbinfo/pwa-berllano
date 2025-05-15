import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useMutation } from "@tanstack/react-query";

interface LoginFormData {
  usuario: string;
  password: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    usuario: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const { setAuthToken } = useAuth();
  const { consumoApi } = useConsumoApi();
  const navigate = useNavigate();

  const { mutate: attemptLogin } = useMutation({
    mutationFn: async ({ usuario, password }: LoginFormData) => {
      const response = await consumoApi
        .get(`/api/Login?usuario=${usuario}&password=${password}`)
        .then((res) => res.data);

      if (response.mensaje !== "Usuario o contraseña incorrectos") {
        localStorage.setItem("token", JSON.stringify(response));
        setAuthToken(response);
        navigate("/");
      } else {
        setLoginError(response.mensaje);
        return;
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user types
    if (errors[name as keyof LoginFormData]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.usuario.trim()) {
      newErrors.usuario = "El usuario es requerido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError(null);

    try {
      attemptLogin(formData);
    } catch (error) {
      console.error("Error de inicio de sesión:", error);
      setLoginError("Error al iniciar sesión. Por favor, verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
        <figure style={{ width: "100%" }}>
          <img
            src="/public/berllano-logo.jpg"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              aspectRatio: "16/9",
            }}
          />
        </figure>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 2,
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            sx={{
              mb: 3,
              fontWeight: "bold",
            }}
          >
            Iniciar Sesión
          </Typography>

          {loginError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {loginError}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="usuario"
              label="Usuario"
              name="usuario"
              autoComplete="username"
              autoFocus
              value={formData.usuario}
              onChange={handleChange}
              error={!!errors.usuario}
              helperText={errors.usuario}
              disabled={isLoading}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                backgroundColor: "#1976d2",
                "&:hover": {
                  backgroundColor: "#115293",
                },
                fontWeight: "bold",
              }}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default Login;
