import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Globe,
  ArrowLeft,
  UserPlus,
  User,
  Phone,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default function Login() {
  // Navigation mode: "LANDING" | "STAFF_LOGIN" | "PORTAL_LOGIN" | "REGISTER"
  const [view, setView] = useState("LANDING");

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Registration state
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
    password: "",
    confirmPassword: "",
    role: "customer", // customer or vendor
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleStaffLogin = async (e) => {
    e?.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your email or username and password.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const loggedInUser = await login(identifier.trim(), password);

      // Staff (Admin / Accountant) go to internal accounting dashboard
      if (loggedInUser.role === "admin" || loggedInUser.role === "accountant") {
        navigate("/");
      } else {
        // If a contact user logged in via staff, direct them to their portal
        navigate("/portal");
      }
    } catch (err) {
      setError(err.userMessage || "Invalid staff credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePortalLogin = async (e) => {
    e?.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your email or username and password.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const loggedInUser = await login(identifier.trim(), password);

      if (loggedInUser.role === "contact") {
        navigate("/portal");
      } else {
        // Staff user logged in via portal, redirect to dashboard
        navigate("/");
      }
    } catch (err) {
      setError(err.userMessage || "Invalid portal credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!regForm.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!regForm.email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!regForm.password || regForm.password.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/auth/register", {
        name: regForm.name.trim(),
        email: regForm.email.trim(),
        phone: regForm.phone.trim() || null,
        city: regForm.city.trim() || null,
        state: regForm.state.trim() || null,
        pincode: regForm.pincode.trim() || null,
        password: regForm.password,
        role: regForm.role,
      });

      // Pre-fill login email and transition to portal login
      setIdentifier(regForm.email.trim());
      setSuccessMsg("Registration successful! Please sign in with your credentials.");
      setView("PORTAL_LOGIN");
    } catch (err) {
      setError(err.userMessage || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setIdentifier("");
    setPassword("");
    setError("");
    setSuccessMsg("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-canvas)",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "460px" }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 12px",
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(79, 70, 229, 0.3)",
            }}
          >
            <Building2 size={26} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Urban Furniture
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Double-Entry Accounting &amp; Financial Management
          </p>
        </div>

        {/* 1. FIRST SCREEN / LANDING PAGE: Staff Login vs Customer/Vendor Portal */}
        {view === "LANDING" && (
          <div className="card" style={{ padding: "32px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "6px",
                textAlign: "center",
              }}
            >
              Sign In to Urban Furniture
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              Select your access portal below to proceed
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Option A: Staff Login (Admin, Accountant / Invoicing User) */}
              <button
                type="button"
                className="card"
                onClick={() => {
                  resetForm();
                  setView("STAFF_LOGIN");
                }}
                style={{
                  cursor: "pointer",
                  padding: "20px",
                  textAlign: "left",
                  border: "2px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-surface)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.backgroundColor = "var(--primary-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
                    Staff Login
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    For <strong>Admin</strong> (Business Owner) &amp; <strong>Accountant</strong> (Invoicing User)
                  </div>
                </div>
                <ArrowRight size={18} style={{ color: "var(--primary)" }} />
              </button>

              {/* Option B: Customer / Vendor Portal */}
              <button
                type="button"
                className="card"
                onClick={() => {
                  resetForm();
                  setView("PORTAL_LOGIN");
                }}
                style={{
                  cursor: "pointer",
                  padding: "20px",
                  textAlign: "left",
                  border: "2px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-surface)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--info)";
                  e.currentTarget.style.backgroundColor = "var(--info-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Globe size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
                    Customer / Vendor Portal
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    External portal to view own orders, invoices, bills &amp; make payments
                  </div>
                </div>
                <ArrowRight size={18} style={{ color: "#0284c7" }} />
              </button>

              {/* Option C: Register New User */}
              <button
                type="button"
                className="card"
                onClick={() => {
                  resetForm();
                  setView("REGISTER");
                }}
                style={{
                  cursor: "pointer",
                  padding: "16px 20px",
                  textAlign: "left",
                  border: "2px dashed var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-surface)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--success)";
                  e.currentTarget.style.backgroundColor = "#f0fdf4";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <UserPlus size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>
                    Register New User
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Create a new Customer or Vendor account
                  </div>
                </div>
                <ArrowRight size={16} style={{ color: "#10b981" }} />
              </button>
            </div>
          </div>
        )}

        {/* 2. STAFF LOGIN SCREEN (Admin / Accountant) */}
        {view === "STAFF_LOGIN" && (
          <div className="card" style={{ padding: "28px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <button
                type="button"
                className="btn-icon"
                onClick={() => {
                  resetForm();
                  setView("LANDING");
                }}
                title="Back to portal selection"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Staff Login
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                  Admin &amp; Accountant Internal Access
                </p>
              </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: "16px" }}>{error}</div>}

            <form onSubmit={handleStaffLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="staff-identifier">
                  Email or Username
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    id="staff-identifier"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: "36px" }}
                    placeholder="admin@urbanfurniture.local or accountant"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={submitting}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label" htmlFor="staff-password">
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    id="staff-password"
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: "36px" }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                style={{ padding: "10px", fontSize: "14px" }}
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign In to Dashboard"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-color)",
                textAlign: "center",
              }}
            >
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: "13px" }}
                onClick={() => {
                  resetForm();
                  setView("PORTAL_LOGIN");
                }}
              >
                Switch to Customer / Vendor Portal Login
              </button>
            </div>
          </div>
        )}

        {/* 3. CUSTOMER / VENDOR PORTAL LOGIN SCREEN */}
        {view === "PORTAL_LOGIN" && (
          <div className="card" style={{ padding: "28px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <button
                type="button"
                className="btn-icon"
                onClick={() => {
                  resetForm();
                  setView("LANDING");
                }}
                title="Back to portal selection"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Customer / Vendor Portal
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                  Contact Access for Invoices, Bills &amp; Payments
                </p>
              </div>
            </div>

            {successMsg && (
              <div
                className="alert alert-success"
                style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}
              >
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {error && <div className="alert alert-danger" style={{ marginBottom: "16px" }}>{error}</div>}

            <form onSubmit={handlePortalLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="portal-identifier">
                  Email or Username
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    id="portal-identifier"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: "36px" }}
                    placeholder="contact email or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={submitting}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label" htmlFor="portal-password">
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    id="portal-password"
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: "36px" }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                style={{ padding: "10px", fontSize: "14px" }}
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign In to Portal"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-color)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  New contact?{" "}
                </span>
                <button
                  type="button"
                  className="btn-link"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                  onClick={() => {
                    resetForm();
                    setView("REGISTER");
                  }}
                >
                  Register new account
                </button>
              </div>
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: "12px", color: "var(--text-muted)" }}
                onClick={() => {
                  resetForm();
                  setView("STAFF_LOGIN");
                }}
              >
                Switch to Staff Login (Admin / Accountant)
              </button>
            </div>
          </div>
        )}

        {/* 4. REGISTER NEW USER SCREEN */}
        {view === "REGISTER" && (
          <div className="card" style={{ padding: "28px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <button
                type="button"
                className="btn-icon"
                onClick={() => {
                  resetForm();
                  setView("LANDING");
                }}
                title="Back to portal selection"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Register New User
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                  Create a new Customer or Vendor portal account
                </p>
              </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: "16px" }}>{error}</div>}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-role">
                  I am registering as *
                </label>
                <select
                  id="reg-role"
                  className="form-select"
                  value={regForm.role}
                  onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">
                  Full Name / Company Name *
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    id="reg-name"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: "36px" }}
                    placeholder="e.g. Acme Corp or Jane Doe"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">
                    Email Address *
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      id="reg-email"
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      placeholder="user@example.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">
                    Phone Number
                  </label>
                  <div style={{ position: "relative" }}>
                    <Phone
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      id="reg-phone"
                      type="tel"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      placeholder="+91 9876543210"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-city">
                    City
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      id="reg-city"
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      placeholder="e.g. Mumbai"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-state">
                    State
                  </label>
                  <input
                    id="reg-state"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Maharashtra"
                    value={regForm.state}
                    onChange={(e) => setRegForm({ ...regForm, state: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ maxWidth: "120px" }}>
                  <label className="form-label" htmlFor="reg-pincode">
                    Pincode
                  </label>
                  <input
                    id="reg-pincode"
                    type="text"
                    className="form-input"
                    placeholder="400001"
                    value={regForm.pincode}
                    onChange={(e) => setRegForm({ ...regForm, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">
                    Set Password *
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      id="reg-password"
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      placeholder="••••••••"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-confirmPassword">
                    Confirm Password *
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      id="reg-confirmPassword"
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      placeholder="••••••••"
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                style={{ padding: "10px", fontSize: "14px", marginTop: "8px" }}
                disabled={submitting}
              >
                {submitting ? "Registering..." : "Create Account & Proceed to Sign In"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-color)",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Already registered?{" "}
              </span>
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: "13px", fontWeight: 600 }}
                onClick={() => {
                  resetForm();
                  setView("PORTAL_LOGIN");
                }}
              >
                Sign In to Portal
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
          Odoo Hackathon Edition • Urban Furniture
        </div>
      </div>
    </div>
  );
}

