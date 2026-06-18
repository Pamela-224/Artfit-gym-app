import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./AdminMembers.css";

export default function AdminMembers() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [signups, setSignups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("signups");
  const [signupSearch, setSignupSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const loadData = () => {
    setLoading(true);
    api
      .get("/admin/members")
      .then((res) => {
        if (res.data.success) {
          setSignups(res.data.signups);
          setUsers(res.data.users);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const deleteSignup = async (id) => {
    if (!window.confirm("Delete this signup?")) return;
    try {
      await api.delete(`/admin/delete-signup/${id}`);
      setSignups((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;
    try {
      await api.delete(`/admin/delete-user/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  const filteredSignups = useMemo(() => {
    const q = signupSearch.toLowerCase();
    if (!q) return signups;
    return signups.filter((s) =>
      `${s.fname} ${s.lname} ${s.email} ${s.plan}`.toLowerCase().includes(q)
    );
  }, [signups, signupSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.fname} ${u.lname} ${u.email}`.toLowerCase().includes(q));
  }, [users, userSearch]);

  const eliteCount = signups.filter((s) => s.plan === "elite").length;

  if (loading) return null;

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-logo">ART<span>FIT</span></div>
          <Link to="/admin" className="active"><span className="icon">📋</span><span>Members Table</span></Link>
          <Link to="/admin/dashboard"><span className="icon">📊</span><span>Analytics</span></Link>
          <Link to="/"><span className="icon">🏠</span><span>Main Site</span></Link>
          <hr className="admin-sidebar-divider" />
          <button onClick={handleLogout} className="admin-sidebar-logout"><span className="icon">🚪</span><span>Logout</span></button>
        </aside>

        <main className="admin-main">
          <div className="admin-page-header">
            <h1 className="admin-page-title">Admin Dashboard</h1>
            <span className="admin-badge">Admin</span>
          </div>

          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="label">Free Trial Signups</div>
              <div className="value">{signups.length}<span>+</span></div>
              <div className="sublabel">All time</div>
            </div>
            <div className="admin-stat-card">
              <div className="label">Registered Users</div>
              <div className="value">{users.length}</div>
              <div className="sublabel">With accounts</div>
            </div>
            <div className="admin-stat-card">
              <div className="label">Elite Members</div>
              <div className="value">{eliteCount}</div>
              <div className="sublabel">Highest tier</div>
            </div>
          </div>

          <div className="section-tabs">
            <button className={`stab ${activeTab === "signups" ? "active" : ""}`} onClick={() => setActiveTab("signups")}>Free Trial Signups</button>
            <button className={`stab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>Registered Users</button>
          </div>

          {activeTab === "signups" && (
            <div>
              <div className="search-bar">
                <input type="text" placeholder="Search by name, email or plan…" value={signupSearch} onChange={(e) => setSignupSearch(e.target.value)} />
                <span className="count-badge">{filteredSignups.length} entries</span>
              </div>
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Age</th>
                      <th>Plan</th><th>Services</th><th>Submitted</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSignups.length > 0 ? (
                      filteredSignups.map((s) => (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td>{s.fname} {s.lname}</td>
                          <td>{s.email}</td>
                          <td>{s.phone}</td>
                          <td>{s.age}</td>
                          <td><span className={`plan-badge badge-${s.plan}`}>{s.plan}</span></td>
                          <td>
                            <div className="services-tags">
                              {s.services ? s.services.split(",").map((svc, i) => <span className="stag" key={i}>{svc.trim()}</span>) : <span style={{ color: "var(--zinc)", fontSize: ".75rem" }}>—</span>}
                            </div>
                          </td>
                          <td style={{ whiteSpace: "nowrap", color: "var(--zinc)", fontSize: ".78rem" }}>{s.submitted_at ? s.submitted_at.slice(0, 10) : "—"}</td>
                          <td><button className="btn-delete" onClick={() => deleteSignup(s.id)}>Delete</button></td>
                        </tr>
                      ))
                    ) : (
                      <tr className="empty-row"><td colSpan={9}>No signups yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <div className="search-bar">
                <input type="text" placeholder="Search users…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                <span className="count-badge">{filteredUsers.length} users</span>
              </div>
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>{u.fname} {u.lname}</td>
                          <td>{u.email}</td>
                          <td><span className={`plan-badge ${u.is_admin ? "badge-admin" : "badge-member"}`}>{u.is_admin ? "Admin" : "Member"}</span></td>
                          <td style={{ color: "var(--zinc)", fontSize: ".78rem" }}>{u.created_at ? u.created_at.slice(0, 10) : "—"}</td>
                          <td>
                            {!u.is_admin ? (
                              <button className="btn-delete" onClick={() => deleteUser(u.id)}>Delete</button>
                            ) : (
                              <span style={{ color: "var(--zinc)", fontSize: ".78rem" }}>Protected</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="empty-row"><td colSpan={6}>No users yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
