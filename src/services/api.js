import axios from "axios";
import { auth } from "./firebase.js";

const api = axios.create({
  baseURL: "/api",
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