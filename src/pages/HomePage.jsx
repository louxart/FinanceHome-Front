import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();

  // =========================
  // ESTADO USUARIO LOGUEADO
  // =========================
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserName(u.nombre || u.name || u.email || "Usuario");
      } catch {
        setUserName("Usuario");
      }
    }
  }, []);

  // =========================
  // ESTADOS BÁSICOS
  // =========================
  const [clientes, setClientes] = useState([]);
  const [inmuebles, setInmuebles] = useState([]);

  const [clienteMode, setClienteMode] = useState("existing"); // "existing" | "new"
  const [inmuebleMode, setInmuebleMode] = useState("existing");

  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [selectedInmuebleId, setSelectedInmuebleId] = useState("");

  const [clienteForm, setClienteForm] = useState({
    nombreCompleto: "",
    dni: "",
    correo: "",
    ingresoMensual: "",
  });

  const [inmuebleForm, setInmuebleForm] = useState({
    titulo: "",
    ubicacion: "",
    precioVenta: "",
    areaConstruida: "",
    habitaciones: "",
  });

  const [creditoForm, setCreditoForm] = useState({
    montoCredito: "",
    cuotaInicial: "",
    tasaAnual: "",
    tipoTasa: "Nominal",
    plazoMeses: "",
    moneda: "PEN",
    tipoCambio: "1.00",
  });

  const [simulacion, setSimulacion] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // =========================
  // CARGA INICIAL
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCli, resInm] = await Promise.all([
          api.get("/clientes"),
          api.get("/inmuebles"),
        ]);
        setClientes(resCli.data || []);
        setInmuebles(resInm.data || []);
      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
        setErrorMsg("No se pudieron cargar clientes/inmuebles.");
      }
    };
    fetchData();
  }, []);

  // =========================
  // HANDLERS CLIENTE
  // =========================
  const handleClienteSelect = (e) => {
    const id = e.target.value;
    setSelectedClienteId(id);

    if (!id) return;

    const c = clientes.find((cl) => String(cl.idCliente) === String(id));
    if (!c) return;

    setClienteMode("existing");
    setClienteForm({
      nombreCompleto: c.nombreCompleto || "",
      dni: c.dni || "",
      correo: c.correo || "",
      ingresoMensual: c.ingresoMensual ?? "",
    });
  };

  const handleNuevoCliente = () => {
    setClienteMode("new");
    setSelectedClienteId("");
    setClienteForm({
      nombreCompleto: "",
      dni: "",
      correo: "",
      ingresoMensual: "",
    });
  };

  const handleClienteInputChange = (field, value) => {
    setClienteForm((prev) => ({ ...prev, [field]: value }));
  };

  // =========================
  // HANDLERS INMUEBLE
  // =========================
  const handleInmuebleSelect = (e) => {
    const id = e.target.value;
    setSelectedInmuebleId(id);

    if (!id) return;

    const i = inmuebles.find((inm) => String(inm.idInmueble) === String(id));
    if (!i) return;

    setInmuebleMode("existing");
    setInmuebleForm({
      titulo: i.titulo || "",
      ubicacion: i.ubicacion || "",
      precioVenta: i.precioVenta ?? "",
      areaConstruida: i.areaConstruida ?? "",
      habitaciones: i.habitaciones ?? "",
    });
  };

  const handleNuevoInmueble = () => {
    setInmuebleMode("new");
    setSelectedInmuebleId("");
    setInmuebleForm({
      titulo: "",
      ubicacion: "",
      precioVenta: "",
      areaConstruida: "",
      habitaciones: "",
    });
  };

  const handleInmuebleInputChange = (field, value) => {
    setInmuebleForm((prev) => ({ ...prev, [field]: value }));
  };

  // =========================
  // HANDLERS CRÉDITO
  // =========================
  const handleCreditoChange = (field, value) => {
    setCreditoForm((prev) => ({ ...prev, [field]: value }));
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // =========================
  // SIMULAR CRÉDITO
  // =========================
  const handleSimularCredito = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSimulacion(null);
    setCuotas([]);

    try {
      setLoading(true);

      // 1) Registrar / actualizar cliente
      let clienteId = selectedClienteId;
      if (clienteMode === "new") {
        const resCli = await api.post("/clientes", {
          nombreCompleto: clienteForm.nombreCompleto,
          dni: clienteForm.dni,
          correo: clienteForm.correo,
          ingresoMensual: Number(clienteForm.ingresoMensual),
        });
        clienteId = resCli.data.idCliente;
      }

      // 2) Registrar / actualizar inmueble
      let inmuebleId = selectedInmuebleId;
      if (inmuebleMode === "new") {
        const resInm = await api.post("/inmuebles", {
          titulo: inmuebleForm.titulo,
          ubicacion: inmuebleForm.ubicacion,
          precioVenta: Number(inmuebleForm.precioVenta),
          areaConstruida: Number(inmuebleForm.areaConstruida),
          habitaciones: Number(inmuebleForm.habitaciones),
        });
        inmuebleId = resInm.data.idInmueble;
      }

      // 3) Usuario logueado
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      // 4) Registrar simulación
      const hoy = new Date().toISOString().slice(0, 10);

      const bodySimulacion = {
        fechaSimulacion: hoy,
        montoCredito: Number(creditoForm.montoCredito),
        cuotaInicial: Number(creditoForm.cuotaInicial),
        tasaAnual: Number(creditoForm.tasaAnual) / 100,
        tipoTasa: creditoForm.tipoTasa,
        plazoMeses: Number(creditoForm.plazoMeses),
        moneda: creditoForm.moneda,
        tipoCambio: Number(creditoForm.tipoCambio),
        usuario: user ? { idUsuario: user.idUsuario } : null,
        cliente: { idCliente: Number(clienteId) },
        inmueble: { idInmueble: Number(inmuebleId) },
      };

      const resSim = await api.post("/simulaciones", bodySimulacion);
      const simGuardada = resSim.data;

      setSimulacion(simGuardada);

      // 5) Obtener cronograma
      const resCuotas = await api.get(
        `/cuotas/simulacion/${simGuardada.idSimulacion}`
      );
      setCuotas(resCuotas.data || []);
    } catch (err) {
      console.error("Error al simular crédito:", err);
      setErrorMsg("No se pudo completar la simulación. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fh-home-root">
      <header className="fh-topbar">
        <div className="fh-topbar-left">
          <div className="fh-app-logo">FH</div>
          <span className="fh-app-name">Finance Home</span>
        </div>
      </header>

      <div className="fh-home-layout">
        <aside className="fh-sidebar">
          <div className="fh-sidebar-user">
            <span className="fh-sidebar-user-label">Usuario</span>
            <span className="fh-sidebar-user-name">
              {userName || "Invitado"}
            </span>
          </div>

          <button className="fh-sidebar-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </aside>

        <div className="fh-main-area">
          <header className="fh-home-header">
            <h1>Simulación Hipotecaria</h1>
            <p>
              Registra al cliente, la propiedad y calcula el crédito en un solo
              flujo.
            </p>
          </header>

          <main className="fh-home-shell">
            <section className="fh-card">
              <div className="fh-card-header">
                <h2>Datos del Cliente</h2>
                <div className="fh-toggle-group">
                  <button
                    type="button"
                    className={
                      clienteMode === "existing"
                        ? "fh-toggle active"
                        : "fh-toggle"
                    }
                    onClick={() => setClienteMode("existing")}
                  >
                    Cliente existente
                  </button>
                  <button
                    type="button"
                    className={
                      clienteMode === "new" ? "fh-toggle active" : "fh-toggle"
                    }
                    onClick={handleNuevoCliente}
                  >
                    Nuevo cliente
                  </button>
                </div>
              </div>

              <div className="fh-card-body fh-grid-2">
                <div className="fh-form-group fh-col-full">
                  <label>Cliente registrado</label>
                  <select
                    className="fh-input"
                    value={selectedClienteId}
                    onChange={handleClienteSelect}
                    disabled={clienteMode === "new"}
                  >
                    <option value="">Seleccione un cliente…</option>
                    {clientes.map((c) => (
                      <option key={c.idCliente} value={c.idCliente}>
                        {c.nombreCompleto} – DNI {c.dni}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fh-form-group">
                  <label>Nombre completo</label>
                  <input
                    className={`fh-input ${
                      clienteMode === "existing" ? "fh-disabled" : ""
                    }`}
                    type="text"
                    value={clienteForm.nombreCompleto}
                    onChange={(e) =>
                      handleClienteInputChange(
                        "nombreCompleto",
                        e.target.value
                      )
                    }
                    disabled={clienteMode === "existing"}
                  />
                </div>

                <div className="fh-form-group">
                  <label>DNI</label>
                  <input
                    className={`fh-input ${
                      clienteMode === "existing" ? "fh-disabled" : ""
                    }`}
                    type="text"
                    value={clienteForm.dni}
                    onChange={(e) =>
                      handleClienteInputChange("dni", e.target.value)
                    }
                    disabled={clienteMode === "existing"}
                  />
                </div>

                <div className="fh-form-group">
                  <label>Correo</label>
                  <input
                    className={`fh-input ${
                      clienteMode === "existing" ? "fh-disabled" : ""
                    }`}
                    type="email"
                    value={clienteForm.correo}
                    onChange={(e) =>
                      handleClienteInputChange("correo", e.target.value)
                    }
                    disabled={clienteMode === "existing"}
                  />
                </div>

                <div className="fh-form-group">
                  <label>Ingreso mensual (S/.)</label>
                  <input
                    className={`fh-input ${
                      clienteMode === "existing" ? "fh-disabled" : ""
                    }`}
                    type="number"
                    value={clienteForm.ingresoMensual}
                    onChange={(e) =>
                      handleClienteInputChange(
                        "ingresoMensual",
                        e.target.value
                      )
                    }
                    disabled={clienteMode === "existing"}
                  />
                </div>
              </div>
            </section>

            {/* ===== CARD INMUEBLE ===== */}
            <section className="fh-card">
              <div className="fh-card-header">
                <h2>Datos de la Propiedad</h2>
                <div className="fh-toggle-group">
                  <button
                    type="button"
                    className={
                      inmuebleMode === "existing"
                        ? "fh-toggle active"
                        : "fh-toggle"
                    }
                    onClick={() => setInmuebleMode("existing")}
                  >
                    Inmueble existente
                  </button>
                  <button
                    type="button"
                    className={
                      inmuebleMode === "new" ? "fh-toggle active" : "fh-toggle"
                    }
                    onClick={handleNuevoInmueble}
                  >
                    Nuevo inmueble
                  </button>
                </div>
              </div>

              <div className="fh-card-body fh-grid-2">
                <div className="fh-form-group fh-col-full">
                  <label>Inmueble registrado</label>
                  <select
                    className="fh-input"
                    value={selectedInmuebleId}
                    onChange={handleInmuebleSelect}
                    disabled={inmuebleMode === "new"}
                  >
                    <option value="">Seleccione un inmueble…</option>
                    {inmuebles.map((i) => (
                      <option key={i.idInmueble} value={i.idInmueble}>
                        {i.titulo} – S/ {i.precioVenta}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fh-form-group">
                  <label>Título del inmueble</label>
                  <input
                    className={`fh-input ${
                      inmuebleMode === "existing" ? "fh-disabled" : ""
                    }`}
                    type="text"
                    value={inmuebleForm.titulo}
                    onChange={(e) =>
                      handleInmuebleInputChange("titulo", e.target.value)
                    }
                    disabled={inmuebleMode === "existing"}
                  />
                </div>

                <div className="fh-form-group">
                  <label>Ubicación</label>
                  <input
                    className={`fh-input ${
                      inmuebleMode === "existing" ? "fh-disabled" : ""
                    }`}
                    type="text"
                    value={inmuebleForm.ubicacion}
                    onChange={(e) =>
                      handleInmuebleInputChange("ubicacion", e.target.value)
                    }
                    disabled={inmuebleMode === "existing"}
                  />
                </div>

                <div className="fh-form-group">
                  <label>Precio de venta (S/.)</label>
                  <input
                    className={`fh-input ${
                      inmuebleMode === "existing" ? "fh-disabled" : ""
                    }`}
                    type="number"
                    value={inmuebleForm.precioVenta}
                    onChange={(e) =>
                      handleInmuebleInputChange("precioVenta", e.target.value)
                    }
                    disabled={inmuebleMode === "existing"}
                  />
                </div>

                <div className="fh-form-group">
                  <label>Área construida (m²)</label>
                  <input
                    className={`fh-input ${
                      inmuebleMode === "existing" ? "fh-disabled" : ""
                    }`}
                    type="number"
                    value={inmuebleForm.areaConstruida}
                    onChange={(e) =>
                      handleInmuebleInputChange(
                        "areaConstruida",
                        e.target.value
                      )
                    }
                    disabled={inmuebleMode === "existing"}
                  />
                </div>

                <div className="fh-form-group">
                  <label>Habitaciones</label>
                  <input
                    className={`fh-input ${
                      inmuebleMode === "existing" ? "fh-disabled" : ""
                    }`}
                    type="number"
                    value={inmuebleForm.habitaciones}
                    onChange={(e) =>
                      handleInmuebleInputChange(
                        "habitaciones",
                        e.target.value
                      )
                    }
                    disabled={inmuebleMode === "existing"}
                  />
                </div>
              </div>
            </section>

            {/* ===== CARD CRÉDITO ===== */}
            <section className="fh-card">
              <div className="fh-card-header">
                <h2>Datos del Crédito</h2>
              </div>
              <form
                className="fh-card-body fh-grid-3"
                onSubmit={handleSimularCredito}
              >
                <div className="fh-form-group">
                  <label>Monto del crédito (S/.)</label>
                  <input
                    className="fh-input"
                    type="number"
                    value={creditoForm.montoCredito}
                    onChange={(e) =>
                      handleCreditoChange("montoCredito", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="fh-form-group">
                  <label>Cuota inicial (S/.)</label>
                  <input
                    className="fh-input"
                    type="number"
                    value={creditoForm.cuotaInicial}
                    onChange={(e) =>
                      handleCreditoChange("cuotaInicial", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="fh-form-group">
                  <label>Tasa anual (%)</label>
                  <input
                    className="fh-input"
                    type="number"
                    step="0.01"
                    value={creditoForm.tasaAnual}
                    onChange={(e) =>
                      handleCreditoChange("tasaAnual", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="fh-form-group">
                  <label>Tipo de tasa</label>
                  <select
                    className="fh-input"
                    value={creditoForm.tipoTasa}
                    onChange={(e) =>
                      handleCreditoChange("tipoTasa", e.target.value)
                    }
                  >
                    <option value="Nominal">Nominal</option>
                    <option value="Efectiva">Efectiva</option>
                  </select>
                </div>

                <div className="fh-form-group">
                  <label>Plazo (meses)</label>
                  <input
                    className="fh-input"
                    type="number"
                    value={creditoForm.plazoMeses}
                    onChange={(e) =>
                      handleCreditoChange("plazoMeses", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="fh-form-group">
                  <label>Moneda</label>
                  <select
                    className="fh-input"
                    value={creditoForm.moneda}
                    onChange={(e) =>
                      handleCreditoChange("moneda", e.target.value)
                    }
                  >
                    <option value="PEN">Soles (PEN)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>

                <div className="fh-form-group">
                  <label>Tipo de cambio</label>
                  <input
                    className="fh-input"
                    type="number"
                    step="0.01"
                    value={creditoForm.tipoCambio}
                    onChange={(e) =>
                      handleCreditoChange("tipoCambio", e.target.value)
                    }
                  />
                </div>

                <div className="fh-form-group fh-col-full fh-align-right">
                  <button
                    className="fh-primary-btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Calculando..." : "Simular Crédito"}
                  </button>
                </div>
              </form>
            </section>

            {simulacion && (
              <section className="fh-card">
                <div className="fh-card-header">
                  <h2>Resultados de la Simulación</h2>
                </div>
                <div className="fh-card-body fh-grid-3">
                  <div className="fh-stat">
                    <span className="fh-stat-label">
                      Cuota mensual aproximada
                    </span>
                    <span className="fh-stat-value">
                      S/. {simulacion.cuotaMensual?.toFixed(2)}
                    </span>
                  </div>
                  <div className="fh-stat">
                    <span className="fh-stat-label">VAN</span>
                    <span className="fh-stat-value">
                      S/. {simulacion.van?.toFixed(2)}
                    </span>
                  </div>
                  <div className="fh-stat">
                    <span className="fh-stat-label">TIR / TCEA</span>
                    <span className="fh-stat-value">
                      {((simulacion.tir || 0) * 100).toFixed(2)}% /{" "}
                      {((simulacion.tcea || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {cuotas.length > 0 && (
                  <div className="fh-card-body">
                    <h3>Cronograma (primeras 10 cuotas)</h3>
                    <div className="fh-table-wrapper">
                      <table className="fh-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Saldo inicial</th>
                            <th>Interés</th>
                            <th>Amortización</th>
                            <th>Cuota</th>
                            <th>Seguro</th>
                            <th>Cuota total</th>
                            <th>Saldo final</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cuotas.slice(0, 10).map((c) => (
                            <tr key={c.idCuota}>
                              <td>{c.numeroCuota}</td>
                              <td>S/. {c.saldoInicial.toFixed(2)}</td>
                              <td>S/. {c.interes.toFixed(2)}</td>
                              <td>S/. {c.amortizacion.toFixed(2)}</td>
                              <td>S/. {c.cuotaFija.toFixed(2)}</td>
                              <td>S/. {c.seguro.toFixed(2)}</td>
                              <td>S/. {c.cuotaTotal.toFixed(2)}</td>
                              <td>S/. {c.saldoFinal.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {errorMsg && <p className="fh-error-msg">{errorMsg}</p>}
          </main>

          <footer className="fh-footer">
            <span>Finance Home · Simulación Hipotecaria</span>
            <span>© 2025</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
