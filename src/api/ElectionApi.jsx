import baseApi from "./BaseApi";
import Swal from "sweetalert2";


export const fetchDashboardStats = async () => {
  const res = await baseApi.get("/candidate/admin/dashboard/");
  return res.data; 
};

export const fetchCandidates = async () => {
  const res = await baseApi.get("/candidate/candidates/");
  return res.data;
};

export const createCandidate = async (payload) => {
  try {
    const res = await baseApi.post("/candidate/create/", payload);

    await Swal.fire({
      toast: true,
      position: "top",
      icon: "success",
      title: res.data.message || "Candidate created successfully",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });

    return res.data;

  } catch (error) {
    console.error("Candidate creation failed:", error);
    throw error;
  }
};

export const deleteCandidate = async (candidateId) => {
  const res = await baseApi.delete(`/candidate/${candidateId}/delete/`);
  return res.data;
};

export const fetchFaceStats = async () => {
  const res = await baseApi.get("/accounts/face/stats/");
  return res.data;
};

export const setFaceRecognitionActive = async (isActive) => {
  const res = await baseApi.post("/accounts/face/toggle/", { is_active: isActive });
  return res.data;
};

export const fetchVoteCounts = async () => {
  const res = await baseApi.get("/candidate/vote-count/");
  return res.data; 
};