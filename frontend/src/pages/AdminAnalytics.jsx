import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./AdminAnalytics.css";

ChartJS.register(ArcElement, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const RED = "#e63946";
const GREEN = "#22c55e";
const YELLOW = "#eab308";

export default function AdminAnalytics() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/analytics")
      .then((res) => {
        if (res.data.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const doughnutData = useMemo(() => {
    if (!data) return null;
    return {
      labels: ["Recruit", "Warrior", "Elite"],
      datasets: [
        {
          data: [data.recruit_count, data.warrior_count, data.elite_count],
          backgroundColor: ["#555555", RED, YELLOW],
          borderColor: "#0a0a0a",
          borderWidth: 2,
        },
      ],
    };
  }, [data]);

  const lineData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.signup_dates.map((d) => d.slice(5)), // MM-DD
      datasets: [
        {
          label: "Signups",
          data: data.signup_counts,
          borderColor: RED,
          backgroundColor: "rgba(230,57,70,0.15)",
          fill: true,
          tension: 0.35,
          pointBackgroundColor: RED,
          pointRadius: 3,
        },
      ],
    };
  }, [data]);

  const ageData = useMemo(() => {
    if (!data) return null;
    const buckets = data.age_buckets;
    return {
      labels: Object.keys(buckets),
      datasets: [
        {
          label: "Members",
          data: Object.values(buckets),
          backgroundColor: RED,
          borderRadius: 4,
          maxBarThickness: 40,
        },
      ],
    };
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#888", font: { size: 11 } }, grid: { color: "#1f1f1f" } },
      y: { ticks: { color: "#888", font: { size: 11 } }, grid: { color: "#1f1f1f" }, beginAtZero: true },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    cutout: "68%",
  };

  if (loading || !data) return null;

  const planTotal = data.recruit_count + data.warrior_count + data.elite_count || 1;
  const serviceEntries = Object.entries(data.service_counts || {});

  return (
    <div className="analytics-page">
      <div className="analytics-layout">
        <aside className="analytics-sidebar">
          <Link to="/" className="analytics-sidebar-logo">ART<span>FIT</span></Link>
          <span className="analytics-nav-label">Admin Menu</span>
          <Link to="/admin"><span className="ico">📋</span><span>Members Table</span></Link>
          <Link to="/admin/dashboard" className="active"><span className="ico">📊</span><span>Analytics</span></Link>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: ".8rem 0" }} />
          <Link to="/"><span className="ico">🌐</span><span>Main Site</span></Link>
          <div className="analytics-sidebar-bottom">
            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: ".8rem 0" }} />
            <button onClick={handleLogout}><span className="ico">🚪</span><span>Logout</span></button>
          </div>
        </aside>

        <div className="analytics-main">
          <div className="analytics-topbar">
            <span className="analytics-topbar-title">Analytics Dashboard</span>
            <div className="analytics-topbar-right">
              <span className="analytics-admin-pill">Admin</span>
              <div className="avatar">{user?.fname?.[0]?.toUpperCase() || "A"}</div>
            </div>
          </div>

          <div className="analytics-content">
            <div className="analytics-stats-row">
              <div className="analytics-scard red">
                <div className="analytics-sc-label">Total Signups</div>
                <div className="analytics-sc-val">{data.total_signups}</div>
                <div className="analytics-sc-trend up">All-time trial applications</div>
              </div>
              <div className="analytics-scard blue">
                <div className="analytics-sc-label">Registered Users</div>
                <div className="analytics-sc-val">{data.total_users}</div>
                <div className="analytics-sc-trend neutral">With login accounts</div>
              </div>
              <div className="analytics-scard yellow">
                <div className="analytics-sc-label">Elite Members</div>
                <div className="analytics-sc-val">{data.elite_count}</div>
                <div className="analytics-sc-trend neutral">{planTotal ? Math.round((data.elite_count / planTotal) * 100) : 0}% of signups</div>
              </div>
              <div className="analytics-scard green">
                <div className="analytics-sc-label">Warrior Members</div>
                <div className="analytics-sc-val">{data.warrior_count}</div>
                <div className="analytics-sc-trend neutral">Most popular tier</div>
              </div>
            </div>

            <div className="chart-grid">
              <div className="chart-card">
                <h3>Signups Over Time</h3>
                <div className="chart-wrap">
                  {data.signup_dates.length > 0 ? <Line data={lineData} options={chartOptions} /> : <p style={{ color: "var(--zinc)", textAlign: "center", paddingTop: "3rem" }}>No signup data yet.</p>}
                </div>
              </div>

              <div className="chart-card">
                <h3>Plan Distribution</h3>
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                  <div className="chart-wrap" style={{ flex: 1, height: 200 }}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                  <div className="donut-legend">
                    <div className="legend-item"><span className="legend-dot" style={{ background: "#555" }}></span> Recruit — {data.recruit_count}</div>
                    <div className="legend-item"><span className="legend-dot" style={{ background: RED }}></span> Warrior — {data.warrior_count}</div>
                    <div className="legend-item"><span className="legend-dot" style={{ background: YELLOW }}></span> Elite — {data.elite_count}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-grid">
              <div className="chart-card">
                <h3>Age Distribution</h3>
                <div className="chart-wrap">
                  <Bar data={ageData} options={chartOptions} />
                </div>
              </div>

              <div className="chart-card">
                <h3>Service Popularity</h3>
                <div className="service-bar-list">
                  {serviceEntries.length > 0 ? (
                    serviceEntries.map(([svc, count]) => (
                      <div className="sbar-row" key={svc}>
                        <div className="sbar-top"><span>{svc}</span><span>{count}</span></div>
                        <div className="sbar-track">
                          <div className="sbar-fill" style={{ width: `${data.max_service_count ? (count / data.max_service_count) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "var(--zinc)", fontSize: ".85rem" }}>No service data yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h3>Recent Signups</h3>
              <table className="recent-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Plan</th><th>Submitted</th></tr>
                </thead>
                <tbody>
                  {data.recent_signups.length > 0 ? (
                    data.recent_signups.map((s) => (
                      <tr key={s.id}>
                        <td>{s.fname} {s.lname}</td>
                        <td>{s.email}</td>
                        <td><span className={`analytics-badge badge-${s.plan}`}>{s.plan}</span></td>
                        <td style={{ color: "var(--zinc)", fontSize: ".78rem" }}>{s.submitted_at ? s.submitted_at.slice(0, 10) : "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--zinc)", padding: "2rem" }}>No signups yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
