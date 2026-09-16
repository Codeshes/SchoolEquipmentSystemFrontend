import axios from "axios";
import { auth } from "./firebase.js";

// Development: no VITE_API_URL, so this stays "/api" and the Vite proxy
// forwards it to localhost:5011.
// Production: the SPA is served by Vercel and the API lives on another host,
// so VITE_API_URL supplies its absolute address (set in .env.production or
// in the Vercel dashboard).
const apiRoot = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${apiRoot}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;

  if (currentUser) {
    config.headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
  }

  return config;
});

// A misrouted /api call can come back as HTML with a 200 status - an error
// page, or index.html served by the SPA fallback. Axios would hand that to the
// caller as a string, and the first .map() on it blanks the page. Treat any
// non-JSON body as a failure so the UI shows an error instead.
api.interceptors.response.use((response) => {
  const contentType = response.headers?.["content-type"] ?? "";

  if (typeof response.data === "string" && !contentType.includes("json")) {
    return Promise.reject(
      new Error(
        "The API returned a non-JSON response. Check that /api reaches the backend."
      )
    );
  }

  return response;
});

export const categoryApi = {
  getAll: () => api.get("/Category"),
  getById: (id) => api.get(`/Category/${id}`),
  create: (data) => api.post("/Category", data),
  update: (id, data) => api.put(`/Category/${id}`, data),
  delete: (id) => api.delete(`/Category/${id}`),
};

export const equipmentApi = {
  getAll: () => api.get("/Equipment"),
  getById: (id) => api.get(`/Equipment/${id}`),
  create: (data) => api.post("/Equipment", data),
  update: (id, data) => api.put(`/Equipment/${id}`, data),
  delete: (id) => api.delete(`/Equipment/${id}`),
};

export const requestApi = {
  getAll: () => api.get("/Request"),
  getById: (id) => api.get(`/Request/${id}`),
  getForUser: (userId) => api.get(`/Request/user/${userId}`),
  create: (data) => api.post("/Request", data),
  approve: (id) => api.put(`/Request/${id}/approve`),
  reject: (id, remarks) => api.put(`/Request/${id}/reject`, { remarks }),
  return: (id) => api.put(`/Request/${id}/return`),
};

export const userApi = {
  getAll: () => api.get("/User"),
  getById: (id) => api.get(`/User/${id}`),
  update: (id, data) => api.put(`/User/${id}`, data),
  delete: (id) => api.delete(`/User/${id}`),
};

export default api;