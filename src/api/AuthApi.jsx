import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import baseApi from "./BaseApi";

export const loginUser = async (credentials, navigate) => {
  try {
    const response = await baseApi.post("/accounts/login/", credentials);

    if (response.status === 200) {
      const access = response.data.access;
      const refresh = response.data.refresh;

      let decoded;
      try {
        decoded = jwtDecode(refresh);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: "Invalid token returned from server.",
        });
        return;
      }

      const isSuperUser = !!decoded.is_superuser;
      const name = decoded.name || "";

      
      if (!isSuperUser) {
        Swal.fire({
          icon: "error",
          title: "Access Denied",
          text: "Only admin can login here.",
        });
        return;
      }

      
      localStorage.setItem("accessTokenAdmin", access);
      localStorage.setItem("refreshTokenAdmin", refresh);
      localStorage.setItem("adminName", name);

      await Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: name ? `Welcome ${name}` : "Login successful",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });

      navigate("/d");
    }
  } catch (error) {
    const msg =
      error?.response?.data?.error || 
      error?.response?.data?.detail ||
      "Something went wrong";

    Swal.fire({
      icon: "error",
      title: "Login Failed",
      text: msg,
    });
  }
};

export const logoutUser = async (navigate) => {
  
  const refresh = localStorage.getItem("refreshTokenAdmin");

  try {
    if (refresh) {
      await baseApi.post("/accounts/logout/", { refresh }); 
     
    }
  } catch {
   
  } finally {
    localStorage.removeItem("accessTokenAdmin");
    localStorage.removeItem("refreshTokenAdmin");
    navigate("/");
  }
};