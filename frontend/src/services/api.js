import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
};

export const propertiesApi = {
  list: (params) => api.get("/properties", { params }),
  get: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post("/properties", data),
  geoSearch: (params) => api.get("/properties/geo", { params }),
  similar: (id, limit = 6) => api.get(`/properties/${id}/similar`, { params: { limit } }),
};

export const uploadsApi = {
  photo: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/uploads/photos", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const savedSearchesApi = {
  list: () => api.get("/saved-searches"),
  create: (data) => api.post("/saved-searches", data),
  remove: (id) => api.delete(`/saved-searches/${id}`),
  markSeen: (id) => api.post(`/saved-searches/${id}/seen`),
};

export const recommendationsApi = {
  get: () => api.get("/recommendations"),
};

export const ratingsApi = {
  rate: (data) => api.post("/ratings", data),
};

export const favoritesApi = {
  list: () => api.get("/favorites"),
  add: (property_id) => api.post("/favorites", { property_id }),
  remove: (property_id) => api.delete(`/favorites/${property_id}`),
};

export const usersApi = {
  me: () => api.get("/users/me"),
  history: () => api.get("/users/me/history"),
};
