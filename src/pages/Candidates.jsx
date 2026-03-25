import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import Swal from "sweetalert2";
import { fetchCandidates, createCandidate, deleteCandidate } from "../api/ElectionApi";
import "../styles/Candidates.css";

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    party: "",
    age: "",
    description: "",
  });

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const data = await fetchCandidates();
      setCandidates(data);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Failed to load candidates";
      Swal.fire("Error", msg, "error");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.party || !formData.age) {
      Swal.fire("Warning", "Please fill name, party, and age", "warning");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        party: formData.party,
        age: Number(formData.age),
        description: formData.description || "",
      };

     const created = await createCandidate(payload);

    if (created) {
      setCandidates((prev) => [created, ...prev]);
    }

      setFormData({ name: "", party: "", age: "", description: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.detail || 
        err?.response?.data?.error ||
        "Failed to add candidate";

      Swal.fire("Error", msg, "error");
    }
  };
  const handleDeleteCandidate = async (candidateId, candidateName) => {
    const result = await Swal.fire({
      title: "Delete Candidate?",
      text: `Are you sure you want to delete "${candidateName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteCandidate(candidateId);
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));

      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: "Deleted successfully",
        showConfirmButton: false,
        timer: 1800,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Failed to delete candidate";
      Swal.fire("Error", msg, "error");
    }
  };

  return (
    <>
      <AdminSidebar />

      <div className="page-container candidate-container">
        <h2>Candidate Management</h2>

        <div className="candidate-layout">
          {/* ── Add Candidate Form ── */}
          <div className="candidate-form">
            <h3>Add Candidate</h3>

            <form onSubmit={handleAddCandidate}>
              <div className="field-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. John Smith"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group">
                <label>Group</label>
                <input
                  type="text"
                  name="party"
                  placeholder="e.g. Democratic Party"
                  value={formData.party}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="e.g. 42"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group">
                <label>Description (optional)</label>
                <textarea
                  name="description"
                  placeholder="Brief background or platform notes…"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn-add">
                + Add Candidate
              </button>
            </form>
          </div>

          {/* ── Candidate List ── */}
          <div className="candidate-list">
            <div className="list-header">
              <h3>Candidate List</h3>
              {!loading && (
                <span className="candidate-count">
                  {candidates.length} {candidates.length === 1 ? "candidate" : "candidates"}
                </span>
              )}
            </div>

            {loading ? (
              <p className="loading-candidates">Loading candidates…</p>
            ) : candidates.length === 0 ? (
              <p className="no-candidates">No candidates added yet.</p>
            ) : (
              <ul className="candidate-cards">
                {candidates.map((c) => (
                  <li key={c.id} className="candidate-card">
                    <div className="card-inner">
                      <div className="card-body">
                        <h4 className="candidate-name">{c.name}</h4>
                        <div className="candidate-meta">
                          <span className="meta-badge party">🏛 {c.party}</span>
                          <span className="meta-badge age">🎂 Age {c.age}</span>
                        </div>
                        {c.description && (
                          <p className="candidate-description">"{c.description}"</p>
                        )}
                      </div>

                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteCandidate(c.id, c.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Candidates;
