import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar";
import Swal from "sweetalert2";
import { fetchRegisteredFaces, deleteRegisteredFace } from "../api/ElectionApi";
import "../styles/KycRegistered.css";

const FILTERS = [
  { value: "all",      label: "All" },
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/* ── Avatar: real image with initials fallback ── */
const FaceAvatar = ({ name, imageUrl }) => {
  const [imgError, setImgError] = React.useState(false);
  const parts   = (name || "?").trim().split(/\s+/);
  const letters = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : (name || "?").slice(0, 2);

  if (imageUrl && !imgError) {
    return (
      <div className="kyc-avatar kyc-avatar-img">
        <img
          src={imageUrl}
          alt={name || "face"}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  return <div className="kyc-avatar">{letters.toUpperCase()}</div>;
};

const AdminKycRegistered = () => {
  const [faces, setFaces]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [deleting, setDeleting]   = useState(null); // id being deleted

  const loadFaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRegisteredFaces(filter);
      setFaces(data);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to load KYC records";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadFaces(); }, [loadFaces]);

  /* ── Client-side search on top of server filter ── */
  const displayed = faces.filter((f) =>
    (f.name || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ── Delete ── */
  const handleDelete = async (face) => {
    const result = await Swal.fire({
      title: "Delete Face Record?",
      html: `Remove <strong>${face.name || "Unnamed"}</strong> from the biometric database?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;

    setDeleting(face.id);
    try {
      await deleteRegisteredFace(face.id);
      setFaces((prev) => prev.filter((f) => f.id !== face.id));
      Swal.fire({
        toast: true, position: "top", icon: "success",
        title: "Face record deleted",
        showConfirmButton: false, timer: 2000,
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to delete record";
      Swal.fire("Error", msg, "error");
    } finally {
      setDeleting(null);
    }
  };

  /* ── Summary counts ── */
  const totalCount    = faces.length;
  const activeCount   = faces.filter((f) => f.is_active).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <>
      <AdminSidebar />
      <div className="page-container kyc-container">

        {/* ── Header ── */}
        <div className="kyc-header">
          <div>
            <h2 className="kyc-title">KYC Registered</h2>
            <p className="kyc-subtitle">All biometrically registered voter face records.</p>
          </div>

          <button className="kyc-refresh-btn" onClick={loadFaces} disabled={loading}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "spinning" : ""}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Summary Pills ── */}
        <div className="kyc-summary-row">
          <div className="kyc-summary-pill total">
            <span className="pill-count">{totalCount}</span>
            <span className="pill-label">Total Records</span>
          </div>
          <div className="kyc-summary-pill active">
            <span className="pill-count">{activeCount}</span>
            <span className="pill-label">Active</span>
          </div>
          <div className="kyc-summary-pill inactive">
            <span className="pill-count">{inactiveCount}</span>
            <span className="pill-label">Inactive</span>
          </div>
        </div>

        {/* ── Toolbar: Search + Filter ── */}
        <div className="kyc-toolbar">
          {/* Search */}
          <div className="kyc-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="kyc-search"
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="kyc-search-clear" onClick={() => setSearch("")}>×</button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="kyc-filter-tabs">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                className={`kyc-filter-tab ${filter === f.value ? "active" : ""}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cards Grid ── */}
        {loading ? (
          <div className="kyc-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="kyc-card kyc-card-skeleton">
                <div className="kyc-card-image-wrap" />
                <div className="kyc-card-info">
                  <div className="skeleton-line wide" style={{height:10,borderRadius:6,background:"#e5e7eb",marginBottom:4}} />
                  <div className="skeleton-line narrow" style={{height:8,borderRadius:6,background:"#e5e7eb",width:"45%",margin:"0 auto"}} />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="kyc-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            <p>No records found</p>
            <span>{search ? "Try a different search term" : "No KYC entries match this filter"}</span>
          </div>
        ) : (
          <div className="kyc-grid">
            {displayed.map((face) => (
              <div key={face.id} className={`kyc-card ${face.is_active ? "card-active" : "card-inactive"}`}>

                {/* ── Full image area ── */}
                <div className="kyc-card-image-wrap">
                  <FaceAvatar name={face.name} imageUrl={face.image_url} />

                  {/* Status badge — overlaid top right */}
                  <div className={`kyc-badge ${face.is_active ? "badge-active" : "badge-inactive"}`}>
                    <span className="badge-dot" />
                    {face.is_active ? "Active" : "Inactive"}
                  </div>

                  {/* Delete overlay — appears on hover */}
                  <div className="kyc-delete-overlay">
                    <button
                      className="kyc-delete-btn"
                      onClick={() => handleDelete(face)}
                      disabled={deleting === face.id}
                      title="Delete record"
                    >
                      {deleting === face.id ? (
                        <span className="kyc-btn-spinner" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                      )}
                      {deleting === face.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>

                {/* ── Name below image ── */}
                <div className="kyc-card-info">
                  <h4 className="kyc-card-name">{face.name || <em>Unnamed</em>}</h4>
                  <span className="kyc-card-id">ID #{face.id}</span>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Result count */}
        {!loading && displayed.length > 0 && (
          <p className="kyc-result-count">
            Showing {displayed.length} of {totalCount} record{totalCount !== 1 ? "s" : ""}
          </p>
        )}

      </div>
    </>
  );
};

export default AdminKycRegistered;