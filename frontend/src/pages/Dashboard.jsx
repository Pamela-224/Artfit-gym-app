import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const PLAN_PRICES = { recruit: "$39 / month", warrior: "$79 / month", elite: "$149 / month" };
const PLAN_FEATURES = {
  recruit: ["Full gym access", "Locker room & showers", "2 group classes/month", "App access", "Off-peak hours only"],
  warrior: ["24/7 gym access", "Unlimited group classes", "1 PT session/month", "Recovery lab access", "Nutrition check-ins"],
  elite: ["Everything in Warrior", "4 PT sessions/month", "Priority class booking", "Custom program design", "Guest passes (4/mo)"],
};

export default function Dashboard() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [signup, setSignup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pfFname, setPfFname] = useState("");
  const [pfLname, setPfLname] = useState("");
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => {
        if (res.data.success) {
          setSignup(res.data.signup);
          setPfFname(res.data.user.fname || "");
          setPfLname(res.data.user.lname || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const saveProfile = async () => {
    if (!pfFname.trim()) {
      alert("First name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/dashboard/update-profile", { fname: pfFname.trim(), lname: pfLname.trim() });
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem("artfit_user", JSON.stringify(res.data.user));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        alert(res.data.message || "Update failed.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  const servicesList = signup?.services ? signup.services.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="dash-page">
      <div className="dash-layout">
        <aside className="dash-sidebar">
          <Link to="/" className="dash-sidebar-logo">ART<span>FIT</span></Link>
          <span className="dash-nav-label">Menu</span>
          <a className="active"><span className="ico">🏠</span><span>Dashboard</span></a>
          <button onClick={() => document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })}>
            <span className="ico">🏋️</span><span>My Services</span>
          </button>
          <button onClick={() => document.getElementById("profile-section")?.scrollIntoView({ behavior: "smooth" })}>
            <span className="ico">👤</span><span>Profile</span>
          </button>
          <hr className="sdiv" />
          <Link to="/"><span className="ico">🌐</span><span>Main Site</span></Link>
          <div className="dash-sidebar-bottom">
            <hr className="sdiv" />
            <button onClick={handleLogout}><span className="ico">🚪</span><span>Logout</span></button>
          </div>
        </aside>

        <div className="dash-main">
          <div className="dash-topbar">
            <span className="dash-topbar-title">Member Dashboard</span>
            <div className="dash-topbar-right">
              <div className="dash-user-info">
                <div className="dash-user-name">{user.fname} {user.lname}</div>
                <div className="dash-user-role">{signup ? `${signup.plan.charAt(0).toUpperCase() + signup.plan.slice(1)}` : "Free Trial"} Member</div>
              </div>
              <div className="avatar">{user.fname?.[0]?.toUpperCase()}</div>
            </div>
          </div>

          <div className="dash-content">
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>Welcome back, {user.fname}! 💪</h2>
                <p>You're crushing it. Keep pushing toward your goals.</p>
              </div>
              <span className="welcome-badge">{signup ? signup.plan.toUpperCase() : "FREE TRIAL"}</span>
            </div>

            <div className="dash-stats-row">
              <div className="scard">
                <div className="sc-label">Member Since</div>
                <div className="sc-val" style={{ fontSize: "1.3rem", marginTop: ".2rem" }}>{user.created_at ? user.created_at.slice(0, 10) : "—"}</div>
                <div className="sc-sub">Account created</div>
              </div>
              <div className="scard">
                <div className="sc-label">Current Plan</div>
                <div className="sc-val red">{signup ? signup.plan.toUpperCase() : "—"}</div>
                <div className="sc-sub">{signup ? PLAN_PRICES[signup.plan] || "" : "No plan yet"}</div>
              </div>
              <div className="scard">
                <div className="sc-label">Services</div>
                <div className="sc-val green">{servicesList.length}</div>
                <div className="sc-sub">Enrolled services</div>
              </div>
              <div className="scard">
                <div className="sc-label">Trial Status</div>
                <div className="sc-val green">{signup ? "Active" : "—"}</div>
                <div className="sc-sub">{signup ? "Free 7-day trial" : "Sign up below"}</div>
              </div>
            </div>

            <div className="grid2">
              <div className="dash-card">
                <h3><span>⚡</span> Your Membership Plan</h3>
                {signup ? (
                  <>
                    <div className="plan-display">
                      <div className="plan-name-big">{signup.plan.toUpperCase()}</div>
                      <div className="plan-price-big">{PLAN_PRICES[signup.plan] || ""}</div>
                      <ul className="plan-features-list">
                        {(PLAN_FEATURES[signup.plan] || []).map((f) => <li key={f}>{f}</li>)}
                      </ul>
                    </div>
                    {signup.plan !== "elite" && <Link to="/#plans" className="upgrade-btn">Upgrade Plan</Link>}
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="es-icon">🏋️</div>
                    <p>No plan selected yet.</p>
                    <Link to="/#signup" className="upgrade-btn">Claim Free Trial</Link>
                  </div>
                )}
              </div>

              <div className="dash-card" id="services-section">
                <h3><span>🎯</span> Your Services</h3>
                {servicesList.length > 0 ? (
                  <>
                    <div className="dash-services-chips">
                      {servicesList.map((svc) => <span className="dash-schip" key={svc}>{svc}</span>)}
                    </div>
                    <p style={{ fontSize: ".8rem", color: "var(--zinc)", marginTop: "1.2rem" }}>
                      To update your services, contact us or re-submit the trial form.
                    </p>
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="es-icon">🧘</div>
                    <p>No services selected yet.</p>
                    <p style={{ fontSize: ".8rem" }}>Select services when you claim your trial.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid2">
              <div className="dash-card" id="profile-section">
                <h3><span>👤</span> My Profile</h3>
                <div className="pf-row">
                  <div className="profile-field">
                    <label>First Name</label>
                    <input type="text" value={pfFname} onChange={(e) => setPfFname(e.target.value)} />
                  </div>
                  <div className="profile-field">
                    <label>Last Name</label>
                    <input type="text" value={pfLname} onChange={(e) => setPfLname(e.target.value)} />
                  </div>
                </div>
                <div className="profile-field">
                  <label>Email Address</label>
                  <input type="email" value={user.email} disabled />
                </div>
                {signup && (
                  <div className="pf-row">
                    <div className="profile-field">
                      <label>Phone</label>
                      <input type="text" value={signup.phone || ""} disabled />
                    </div>
                    <div className="profile-field">
                      <label>Age</label>
                      <input type="text" value={signup.age || ""} disabled />
                    </div>
                  </div>
                )}
                <button className="save-btn" onClick={saveProfile} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>

              <div className="dash-card">
                <h3><span>📋</span> Recent Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="act-dot green">✅</div>
                    <div className="act-text">
                      <strong>Account Created</strong>
                      <span>{user.created_at ? user.created_at.slice(0, 10) : "Recently"}</span>
                    </div>
                  </div>
                  {signup ? (
                    <>
                      <div className="activity-item">
                        <div className="act-dot red">🏋️</div>
                        <div className="act-text">
                          <strong>Free Trial Claimed — {signup.plan.charAt(0).toUpperCase() + signup.plan.slice(1)}</strong>
                          <span>{signup.submitted_at ? signup.submitted_at.slice(0, 10) : "Recently"}</span>
                        </div>
                      </div>
                      {servicesList.length > 0 && (
                        <div className="activity-item">
                          <div className="act-dot yellow">🎯</div>
                          <div className="act-text">
                            <strong>Services Selected</strong>
                            <span>{servicesList.length} service(s) enrolled</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="activity-item">
                      <div className="act-dot yellow">⚡</div>
                      <div className="act-text">
                        <strong>No trial claimed yet</strong>
                        <span>Visit the home page to sign up</span>
                      </div>
                    </div>
                  )}
                  <div className="activity-item">
                    <div className="act-dot green">🔐</div>
                    <div className="act-text">
                      <strong>Logged In</strong>
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <h3><span>🔗</span> Quick Links</h3>
              <div className="quick-links">
                <Link to="/#services" className="qlink">
                  <span className="qico">🧘</span>
                  <div><div className="qtxt">Browse Services</div><div className="qsub">Yoga, HIIT, Boxing & more</div></div>
                </Link>
                <Link to="/#plans" className="qlink">
                  <span className="qico">⚡</span>
                  <div><div className="qtxt">Upgrade Plan</div><div className="qsub">Unlock more benefits</div></div>
                </Link>
                <Link to="/#signup" className="qlink">
                  <span className="qico">🎟️</span>
                  <div><div className="qtxt">Free Trial Form</div><div className="qsub">Update your signup details</div></div>
                </Link>
                <Link to="/" className="qlink">
                  <span className="qico">🏠</span>
                  <div><div className="qtxt">Back to Home</div><div className="qsub">View the full site</div></div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`toast ${showToast ? "show" : ""}`}>✔ Profile updated successfully!</div>
    </div>
  );
}
