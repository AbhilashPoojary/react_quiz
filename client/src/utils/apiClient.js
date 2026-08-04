import axios from "axios";

const apiClient = axios.create({
  baseURL: "/",
});

const clearSession = () => {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("currentUser");
};

const SESSION_EXPIRED_MESSAGE =
  "Your session has expired or your account was logged in from another device. Please login again.";

const handleSessionExpired = () => {
  clearSession();
  localStorage.setItem("sessionExpiredMessage", SESSION_EXPIRED_MESSAGE);
  window.dispatchEvent(
    new CustomEvent("session-expired", {
      detail: {
        message: SESSION_EXPIRED_MESSAGE,
      },
    })
  );

  window.setTimeout(() => {
    window.location.href = "/";
  }, 1500);
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  const protectedPath =
    config.url?.startsWith("/api") || config.url?.startsWith("/auth/logout");

  if (token && protectedPath) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      handleSessionExpired();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
