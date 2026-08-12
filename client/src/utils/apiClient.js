import axios from "axios";

/* const apiClient = axios.create({
  baseURL: "/",
}); */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/",
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

const handlePasswordExpired = (payload = {}) => {
  const message = payload.message || "Your password has expired.";
  localStorage.setItem("passwordExpiredMessage", message);
  window.dispatchEvent(
    new CustomEvent("password-expired", {
      detail: {
        message,
        passwordExpiry: payload.passwordExpiry,
      },
    })
  );

  if (window.location.pathname !== "/change-password") {
    window.location.href = "/change-password";
  }
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  const protectedPath =
    config.url?.startsWith("/api") ||
    config.url?.startsWith("/auth/logout") ||
    config.url?.startsWith("/auth/change-password");

  if (token && protectedPath) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.data?.code === "PASSWORD_EXPIRED") {
      handlePasswordExpired(error.response.data);
    } else if (error?.response?.status === 401) {
      handleSessionExpired();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
