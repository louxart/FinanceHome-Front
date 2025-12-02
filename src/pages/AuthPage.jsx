import { useState } from "react";
import { useNavigate } from "react-router-dom";  
import "./AuthPage.css";
import api from "../apiClient";

export default function AuthPage() {
  const navigate = useNavigate();               

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await api.post("/usuarios/login", {
        email: loginEmail,
        password: loginPassword,
      });

      console.log("Login OK:", res.data);

      localStorage.setItem("user", JSON.stringify(res.data));

      navigate("/home");
    } catch (err) {
      console.error("Error en login:", err);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Body:", err.response.data);
      }
      setErrorMsg("Credenciales inválidas o usuario no encontrado.");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await api.post("/usuarios", {
        nombre: regNombre,
        email: regEmail,
        passwordHash: regPassword,
      });

      console.log("Registro OK:", res.data);
      alert("Usuario registrado correctamente. Ahora puedes iniciar sesión.");

      setIsRegisterMode(false);
      setLoginEmail(regEmail);
      setLoginPassword("");
    } catch (err) {
      console.error("Error en registro:", err);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Body:", err.response.data);
      }
      setErrorMsg("No se pudo registrar el usuario (revisa la consola).");
    }
  };

  return (
    <div className="auth-page-root">
      <h1 className="app-title">Finance Home</h1>

      <div className={`container ${isRegisterMode ? "active" : ""}`}>
        <div className="form-box login">
          <form onSubmit={handleLoginSubmit}>
            <h1>Iniciar Sesión</h1>
            <div className="input-box">
              <input
                type="email"
                placeholder="Email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="forgot-link">
              <a href="#">¿Olvidaste tu contraseña?</a>
            </div>
            <button type="submit" className="btn">
              Iniciar Sesión
            </button>
          </form>
        </div>

        <div className="form-box register">
          <form onSubmit={handleRegisterSubmit}>
            <h1>Registro</h1>
            <div className="input-box">
              <input
                type="text"
                placeholder="Nombre"
                required
                value={regNombre}
                onChange={(e) => setRegNombre(e.target.value)}
              />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input
                type="email"
                placeholder="Email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <i className="bx bxs-envelope"></i>
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <button type="submit" className="btn">
              Registro
            </button>
          </form>
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hola, Bienvenido!</h1>
            <p>¿Ya tienes una cuenta?</p>
            <button
              type="button"
              className="btn register-btn"
              onClick={() => setIsRegisterMode(true)}
            >
              Registro
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>¡Bienvenido otra vez!</h1>
            <p>¿Ya tienes una cuenta?</p>
            <button
              type="button"
              className="btn login-btn"
              onClick={() => setIsRegisterMode(false)}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>

      {errorMsg && <p className="global-error">{errorMsg}</p>}
    </div>
  );
}
