const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

async function request(path, options = {}) {
  const token = window.localStorage.getItem("smart-gym-token");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // If the response is JSON, parse it and return the payload.data as before.
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    // handle empty body safely
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok || (payload && payload.ok === false)) {
      throw new Error(payload?.error?.message || response.statusText || "Request failed");
    }

    return payload ? payload.data : null;
  }

  // For non-JSON responses (binary exports, PDFs), return the raw Response so callers
  // can call .blob() or .arrayBuffer() as needed. Throw on non-OK statuses.
  if (!response.ok) {
    throw new Error(response.statusText || "Request failed");
  }

  return response;
}

export const api = {
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  dashboard: () => request("/dashboard"),
  selectPlan: (plan) => request("/profile/plan", { method: "POST", body: JSON.stringify({ planId: plan.id, planName: plan.name }) }),
  selectTrainer: (trainer) => request("/profile/trainer", { method: "POST", body: JSON.stringify({ trainerId: trainer.id, trainerName: trainer.name }) }),
  wishlistPlan: (planId) => request("/profile/wishlist", { method: "POST", body: JSON.stringify({ planId }) }),
  list: (resource) => request(`/${resource}`),
  create: (resource, body) => request(`/${resource}`, { method: "POST", body: JSON.stringify(body) }),
  update: (resource, id, body) => request(`/${resource}/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (resource, id) => request(`/${resource}/${id}`, { method: "DELETE" }),
  attendance: () => request("/attendance"),
  notifications: () => request("/notifications"),
  checkIn: (body) => request("/attendance/check-in", { method: "POST", body: JSON.stringify(body) }),
  games: () => request("/games"),
  answerGame: (challengeId, answer) => request(`/games/${challengeId}/answer`, { method: "POST", body: JSON.stringify({ answer }) }),
};

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value ?? 0);
}
