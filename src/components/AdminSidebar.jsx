import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/AuthApi";

const navItems = [
  { to: "/d",   label: "Dashboard",        icon: "⬛" },
  { to: "/c",   label: "Candidates",       icon: "🏛" },
  { to: "/voters", label: "Voters",        icon: "👥" },
  { to: "/f",   label: "Face Recognition", icon: "🪪" },
  { to: "/kyc", label: "KYC Registered",   icon: "🧬" },
  { to: "/s",   label: "Voting Status",    icon: "📊" },
  { to: "/u",   label: "Counting",         icon: "🔢" },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => {
    logoutUser(navigate);
  };

  return (
    <aside className="admin-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5"/>
            <path d="M12 2v20M3 7l9 5 9-5" stroke="white" strokeWidth="1.2" opacity="0.6"/>
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">Get My Vote</span>
          <span className="brand-sub">Admin Portal</span>
        </div>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Nav label */}
      <p className="nav-section-label">Navigation</p>

      {/* Nav Links */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`sidebar-link${active ? " active" : ""}`}
            >
              <span className="link-icon">{icon}</span>
              <span className="link-label">{label}</span>
              {active && <span className="active-pip" />}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Logout Button */}
      <button className="sidebar-logout" onClick={handleLogout}>
        <span className="link-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </span>
        <span className="link-label">Logout</span>
      </button>
    </aside>
  );
};

export default AdminSidebar;