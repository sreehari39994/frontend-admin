import axios from "axios";

const baseApi = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
});

const NO_AUTH_PATHS = [
  "/accounts/login/",
  "/accounts/signup/",
];

baseApi.interceptors.request.use((config) => {
  const url = config.url || "";

  
  if (NO_AUTH_PATHS.some((p) => url.includes(p))) {
    delete config.headers.Authorization;
    return config;
  }

  const token =
    localStorage.getItem("accessTokenAdmin")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

export default baseApi;