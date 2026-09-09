import axios from "axios";

const configuredUrl = import.meta.env.VITE_API_URL?.trim();
const api = axios.create({
  baseURL: configuredUrl || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 20000
});

export default api;
