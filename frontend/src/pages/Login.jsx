import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState({ type: "", text: "" });
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Register state
  const [regFname, setRegFname] = useState("");
  const [regLname, setRegLname] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regErrors, setRegErrors] = useState({});
  const [regMsg, setRegMsg] = useState({ type: "", text: "" });
  const [regSubmitting, setRegSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg({ type: "", text: "" });
    setLoginSubmitting(true);
    try {
      const res = await api.post("/login", { email: loginEmail.trim(), password: loginPassword });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        setLoginMsg({ type: "ok", text: "Login successful!" });
        setTimeout(() => {
          navigate(res.data.user.is_admin ? "/admin/dashboard" : "/dashboard");
        }, 700);
      } else {
        setLoginMsg({ type: "fail", text: res.data.message || "Login failed." });
      }
    } catch (err) {
      setLoginMsg({ type: "fail", text: err.response?.data?.message || "Invalid credentials" });
    } finally {
      setLoginSubmitting(false);
    }
  };

  const validateRegister = () => {
    const errs = {};
    if (!regFname.trim()) errs.fname = "Required.";
    if (!/\S+@\S+\.\S+/.test(regEmail)) errs.email = "Valid email required.";
    if (regPassword.length < 6) errs.password = "Min 6 characters.";
    return errs;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validateRegister();
    setRegErrors(errs);
    setRegMsg({ type: "", text: "" });
    if (Object.keys(errs).length > 0) return;

    setRegSubmitting(true);
    try {
      const res = await api.post("/register", {
        fname: regFname.trim(),
        lname: regLname.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      if (res.data.success) {
        setRegMsg({ type: "ok", text: res.data.message });
        setTimeout(() => setActiveTab("login"), 1500);
      } else {
        setRegMsg({ type: "fail", text: res.data.message });
      }
    } catch (err) {
      setRegMsg({ type: "fail", text: err.response?.data?.message || "Registration failed." });
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <Link to="/" className="logo">ART<span>FIT</span></Link>
      </nav>

      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">ART<span>FIT</span></div>
          <p className="auth-sub">Your fitness journey starts here.</p>

          <div className="auth-tabs">
            <button className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`} onClick={() => setActiveTab("login")}>Sign In</button>
            <button className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`} onClick={() => setActiveTab("register")}>Create Account</button>
          </div>

          {activeTab === "login" && (
            <form onSubmit={handleLogin}>
              <div className="auth-form-group">
                <label htmlFor="l-email">Email Address</label>
                <input type="email" id="l-email" placeholder="you@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              </div>
              <div className="auth-form-group">
                <label htmlFor="l-pass">Password</label>
                <input type="password" id="l-pass" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-submit" disabled={loginSubmitting}>
                {loginSubmitting ? "Signing In…" : "Sign In"}
              </button>
              {loginMsg.text && <div className={`api-msg ${loginMsg.type}`}>{loginMsg.text}</div>}
            </form>
          )}

          {activeTab === "register" && (
            <form onSubmit={handleRegister}>
              <div className="auth-form-row">
                <div className="auth-form-group">
                  <label>First Name</label>
                  <input type="text" placeholder="Val" value={regFname} onChange={(e) => setRegFname(e.target.value)} />
                  {regErrors.fname && <div className="auth-err-msg">{regErrors.fname}</div>}
                </div>
                <div className="auth-form-group">
                  <label>Last Name</label>
                  <input type="text" placeholder="Atieno" value={regLname} onChange={(e) => setRegLname(e.target.value)} />
                </div>
              </div>
              <div className="auth-form-group">
                <label>Email Address</label>
                <input type="email" placeholder="you@email.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                {regErrors.email && <div className="auth-err-msg">{regErrors.email}</div>}
              </div>
              <div className="auth-form-group">
                <label>Password</label>
                <input type="password" placeholder="Min 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                {regErrors.password && <div className="auth-err-msg">{regErrors.password}</div>}
              </div>
              <button type="submit" className="btn-submit" disabled={regSubmitting}>
                {regSubmitting ? "Creating Account…" : "Create Account"}
              </button>
              {regMsg.text && <div className={`api-msg ${regMsg.type}`}>{regMsg.text}</div>}
            </form>
          )}

          <p className="back-link"><Link to="/">← Back to Home</Link></p>
        </div>
      </div>
    </div>
  );
}
