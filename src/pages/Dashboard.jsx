import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import Swal from "sweetalert2";
import { fetchDashboardStats } from "../api/ElectionApi";
import "../styles/Dashboard.css";

/* Animated count-up hook */
const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (typeof target !== "number") return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_voters: 0,
    total_candidates: 0,
    total_votes: 0,
  });
  const [loading, setLoading] = useState(true);

  const [randomStats] = useState({
    total_voters:     Math.floor(Math.random() * 900) + 100,
    total_candidates: Math.floor(Math.random() * 18)  + 2,
    total_votes:      Math.floor(Math.random() * 400) + 10,
    remaining_voters: 0,
  });

  const displayStats = loading ? randomStats : stats;

  const animVoters     = useCountUp(displayStats.total_voters);
  const animCandidates = useCountUp(displayStats.total_candidates);
  const animVotes      = useCountUp(displayStats.total_votes);
  const animRemaining  = useCountUp(displayStats.remaining_voters);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (err) {
        const msg = err?.response?.data?.detail || "Failed to load dashboard stats";
        Swal.fire("Error", msg, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    {
      label: "Total Voters",
      value: animVoters,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      accent: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      trend: "+12% this month",
      trendUp: true,
    },
    {
      label: "Candidates",
      value: animCandidates,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M9 21V9"/>
        </svg>
      ),
      accent: "#8b5cf6",
      bg: "rgba(139,92,246,0.08)",
      trend: "Registered",
      trendUp: null,
    },
    {
      label: "Votes Cast",
      value: animVotes,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
      accent: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      trend: "+3 today",
      trendUp: true,
    },
    {
      label: "Election Status",
      value: "Ongoing",
      isText: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      accent: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      trend: "Live now",
      trendUp: true,
    },
    {
      label: "Remaining Voters",
      value: animRemaining,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3"/>
          <path d="M5 3L1 7l4 4"/>
          <path d="M1 7h8"/>
        </svg>
      ),
      accent: "#ef4444",
      bg: "rgba(239,68,68,0.08)",
      trend: "Yet to vote",
      trendUp: null,
    },
  ];

  return (
    <>
      <AdminSidebar />
      <div className="page-container dashboard-container">

        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Admin Dashboard</h1>
            <p className="dash-subtitle">Welcome back — here's what's happening today.</p>
          </div>
          <div className="dash-date">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="dash-cards">
          {cards.map((card, i) => (
            <div
              className="dash-card"
              key={card.label}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="dash-card-top">
                <div className="dash-card-icon" style={{ color: card.accent, background: card.bg }}>
                  {card.icon}
                </div>
                <span className="dash-card-label">{card.label}</span>
              </div>

              <div className="dash-card-value" style={{ color: card.isText ? card.accent : "#0f172a" }}>
                {card.value}
              </div>

              {card.trend && (
                <div className={`dash-card-trend ${card.trendUp === true ? "up" : card.trendUp === false ? "down" : "neutral"}`}>
                  {card.trendUp === true && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2L10 6H7v4H5V6H2L6 2Z" fill="currentColor"/>
                    </svg>
                  )}
                  {card.trend}
                </div>
              )}

              {/* Bottom accent line */}
              <div className="dash-card-bar" style={{ background: card.accent }} />
            </div>
          ))}
        </div>

        {/* Activity strip */}
        <div className="dash-activity">
          <div className="activity-header">
            <h3>System Overview</h3>
            <span className="live-badge">
              <span className="live-dot" />
              Live
            </span>
          </div>
          <div className="activity-stats">
            <div className="activity-item">
              <span className="activity-label">Voter Turnout</span>
              <div className="activity-bar-track">
                <div
                  className="activity-bar-fill"
                  style={{
                    width: stats.total_voters > 0
                      ? `${Math.min((stats.total_votes / stats.total_voters) * 100, 100)}%`
                      : "0%",
                    background: "linear-gradient(90deg, #3b82f6, #6366f1)"
                  }}
                />
              </div>
              <span className="activity-pct">
                {stats.total_voters > 0
                  ? `${Math.round((stats.total_votes / stats.total_voters) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <div className="activity-item">
              <span className="activity-label">Candidates Filed</span>
              <div className="activity-bar-track">
                <div
                  className="activity-bar-fill"
                  style={{
                    width: `${Math.min(stats.total_candidates * 10, 100)}%`,
                    background: "linear-gradient(90deg, #8b5cf6, #a78bfa)"
                  }}
                />
              </div>
              <span className="activity-pct">{stats.total_candidates}</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Dashboard;