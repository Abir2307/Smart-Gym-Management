import express from "express";
import jwt from "jsonwebtoken";
import { initializeDatabase, isPostgresEnabled } from "./db.js";
import { API_VERSION, routeContract } from "./contracts.js";
import { createResource, deleteResource, listAttendance, listDashboardData, listGameData, listNotifications, listResource, loginUser, registerUser, recordAttendanceCheckIn, requestPasswordReset, resetPassword, saveMemberPreference, submitGameAnswer, updateResource } from "./repositories.js";
import { sendPasswordResetEmail } from "./email.js";
import { buildExportWorkbook, buildReportHtml, renderPdfFromHtml } from "./reports.js";

const jwtSecret = process.env.JWT_SECRET || "dev-smart-gym-secret";
const app = express();
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

app.use(express.json());
app.use((request, response, next) => {
  const origin = request.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (request.method === "OPTIONS") {
    if (origin && !allowedOrigins.includes(origin)) {
      return response.sendStatus(403);
    }

    return response.sendStatus(204);
  }

  if (origin && !allowedOrigins.includes(origin)) {
    return sendError(response, 403, "Origin is not allowed");
  }

  if (!safeMethods.has(request.method) && request.headers.origin && !allowedOrigins.includes(request.headers.origin)) {
    return sendError(response, 403, "Cross-site request blocked");
  }

  return next();
});

function sendEnvelope(response, data, meta = {}) {
  response.json({
    ok: true,
    meta: {
      apiVersion: API_VERSION,
      serverMode: isPostgresEnabled() ? "postgres" : "memory",
      ...meta,
    },
    data,
  });
}

function sendError(response, statusCode, message) {
  response.status(statusCode).json({
    ok: false,
    error: { message },
  });
}

function requireAuth(request, response, next) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return sendError(response, 401, "Authentication required");
  }

  try {
    request.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return sendError(response, 401, "Authentication required");
  }
}

function requireRole(allowedRoles) {
  return (request, response, next) => {
    if (!allowedRoles.includes(request.user.role)) {
      return sendError(response, 403, "You do not have access to this resource");
    }

    return next();
  };
}

app.get("/api/health", (_request, response) => {
  sendEnvelope(response, { status: "ok" });
});

app.post(routeContract.auth.login, async (request, response) => {
  const { email, password } = request.body ?? {};

  if (!email || !password) {
    return sendError(response, 400, "Email and password are required");
  }

  const user = await loginUser(email, password);

  if (!user) {
    return sendError(response, 401, "Invalid credentials");
  }

  const token = jwt.sign(user, jwtSecret, { expiresIn: "8h" });

  return sendEnvelope(response, { token, user });
});

app.post(`/api/${API_VERSION}/auth/register`, async (request, response) => {
  const { fullName, email, password } = request.body ?? {};

  if (!fullName || !email || !password) {
    return sendError(response, 400, "Full name, email, and password are required");
  }

  if (password.length < 6) {
    return sendError(response, 400, "Password must be at least 6 characters");
  }

  try {
    const newUser = await registerUser(fullName, email, password, "Member");
    return sendEnvelope(response, { user: newUser }, { statusCode: 201 });
  } catch (err) {
    if (err.message?.includes("already")) {
      return sendError(response, 409, err.message);
    }
    return sendError(response, 500, err.message || "Registration failed");
  }
});

app.post(`/api/${API_VERSION}/auth/forgot-password`, async (request, response) => {
  const email = request.body?.email?.trim().toLowerCase();
  if (!email) {
    return sendError(response, 400, "Email is required");
  }

  try {
    const resetRequest = await requestPasswordReset(email);
    if (resetRequest) {
      await sendPasswordResetEmail(resetRequest.email, resetRequest.token);
    }
    return sendEnvelope(response, { requested: true });
  } catch (error) {
    console.error("Password reset email error", error);
    return sendError(response, 503, "Password reset email is not configured. Set the SMTP variables in server/.env.");
  }
});

app.post(`/api/${API_VERSION}/auth/reset-password`, async (request, response) => {
  const { token, password } = request.body ?? {};
  if (!token || !password) {
    return sendError(response, 400, "Reset token and password are required");
  }
  if (password.length < 6) {
    return sendError(response, 400, "Password must be at least 6 characters");
  }

  const reset = await resetPassword(token, password);
  if (!reset) {
    return sendError(response, 400, "This reset link is invalid or expired");
  }

  return sendEnvelope(response, { reset: true });
});

app.get(routeContract.auth.me, requireAuth, (request, response) => {
  sendEnvelope(response, { user: request.user });
});

app.post(`/api/${API_VERSION}/profile/plan`, requireAuth, async (request, response) => {
  const { planId, planName } = request.body ?? {};
  if (!planId || !planName) {
    return sendError(response, 400, "Plan is required");
  }

  const member = await saveMemberPreference(request.user, { type: "plan", planId, planName });
  return sendEnvelope(response, { member });
});

app.post(`/api/${API_VERSION}/profile/trainer`, requireAuth, async (request, response) => {
  const { trainerId, trainerName } = request.body ?? {};
  if (!trainerId || !trainerName) {
    return sendError(response, 400, "Trainer is required");
  }

  const member = await saveMemberPreference(request.user, { type: "trainer", trainerId, trainerName });
  return sendEnvelope(response, { member });
});

app.post(`/api/${API_VERSION}/profile/wishlist`, requireAuth, async (request, response) => {
  const { planId } = request.body ?? {};
  if (!planId) {
    return sendError(response, 400, "Plan is required");
  }

  const member = await saveMemberPreference(request.user, { type: "wishlist", planId });
  return sendEnvelope(response, { member });
});

app.get(routeContract.dashboard, requireAuth, async (request, response) => {
  const dashboard = await listDashboardData(request.user.id, request.user.role);
  sendEnvelope(response, dashboard);
});

// Export Excel
app.get(`/api/${API_VERSION}/export`, requireAuth, requireRole(["Super Admin", "Staff"]), async (req, res) => {
  try {
    const dashboard = await listDashboardData(req.user.id, req.user.role);
    const workbook = await buildExportWorkbook(dashboard);
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Disposition", "attachment; filename=smart-gym-export.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Export error", err);
    return sendError(res, 500, "Failed to generate export");
  }
});

// Generate PDF report (uses wkhtmltopdf CLI if available)
app.get(`/api/${API_VERSION}/report`, requireAuth, requireRole(["Super Admin", "Staff"]), async (req, res) => {
  try {
    const dashboard = await listDashboardData(req.user.id, req.user.role);
    const html = buildReportHtml(dashboard);
    const pdfBuffer = renderPdfFromHtml(html);

    if (pdfBuffer) {
      res.setHeader("Content-Disposition", "attachment; filename=smart-gym-report.pdf");
      res.setHeader("Content-Type", "application/pdf");
      return res.send(pdfBuffer);
    }

    // Fallback: return HTML as attachment
    res.setHeader("Content-Disposition", "attachment; filename=smart-gym-report.html");
    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  } catch (err) {
    console.error("Report error", err);
    return sendError(res, 500, "Failed to generate report");
  }
});

app.get(routeContract.resources.notifications, requireAuth, (_request, response) => {
  sendEnvelope(response, { items: listNotifications() });
});

app.get(routeContract.resources.games, requireAuth, requireRole(["Member"]), async (request, response) => {
  sendEnvelope(response, await listGameData(request.user.id));
});

app.post(`${routeContract.resources.games}/:challengeId/answer`, requireAuth, requireRole(["Member"]), async (request, response) => {
  try {
    const result = await submitGameAnswer(request.user.id, request.params.challengeId, request.body?.answer);
    sendEnvelope(response, result);
  } catch (error) {
    return sendError(response, 404, error.message);
  }
});

app.get(routeContract.resources.attendance, requireAuth, async (request, response) => {
  const items = await listAttendance();

  // Role-based filtering
  if (request.user.role === "Member") {
    const memberItems = items.filter((it) => it.memberId === request.user.id);
    return sendEnvelope(response, { items: memberItems });
  }

  if (request.user.role === "Trainer") {
    // Trainers should only see attendance for their assigned members
    const members = await listResource("members");
    const assigned = members.filter((m) => m.trainerId === request.user.id).map((m) => m.id);
    const trainerItems = items.filter((it) => assigned.includes(it.memberId));
    return sendEnvelope(response, { items: trainerItems });
  }

  // Super Admin and Staff see all
  return sendEnvelope(response, { items });
});

app.post(`${routeContract.resources.attendance}/check-in`, requireAuth, async (request, response) => {
  const { memberId, memberName, note } = request.body ?? {};
  // If a member is checking in without providing memberId/memberName, assume self check-in
  let finalMemberId = memberId;
  let finalMemberName = memberName;

  if (request.user.role === "Member") {
    finalMemberId = request.user.id;
    finalMemberName = request.user.fullName;
  }

  if (!finalMemberId || !finalMemberName) {
    return sendError(response, 400, "memberId and memberName are required");
  }

  const item = await recordAttendanceCheckIn({
    memberId: finalMemberId,
    memberName: finalMemberName,
    checkedInBy: request.user.fullName,
    note: note ?? "",
  });

  sendEnvelope(response, { item }, { statusCode: 201 });
});

for (const resourceName of ["members", "trainers", "plans", "payments"]) {
  const routePath = routeContract.resources[resourceName];
  const canViewResource = ["trainers", "plans"].includes(resourceName)
    ? requireAuth
    : requireRole(["Super Admin", "Staff"]);

  app.get(routePath, requireAuth, canViewResource, async (request, response) => {
    let items = await listResource(resourceName);
    if (resourceName === "trainers" && !["Super Admin", "Staff"].includes(request.user.role)) {
      items = items.map(({ salary, ...trainer }) => trainer);
    }
    sendEnvelope(response, { items });
  });

  app.post(routePath, requireAuth, requireRole(["Super Admin", "Staff"]), async (request, response) => {
    const payload = request.body ?? {};
    const created = await createResource(resourceName, payload);
    sendEnvelope(response, { item: created }, { statusCode: 201 });
  });

  app.put(`${routePath}/:id`, requireAuth, requireRole(["Super Admin", "Staff"]), async (request, response) => {
    const payload = request.body ?? {};
    const updated = await updateResource(resourceName, request.params.id, payload);
    sendEnvelope(response, { item: updated });
  });

  app.patch(`${routePath}/:id`, requireAuth, requireRole(["Super Admin", "Staff"]), async (request, response) => {
    const payload = request.body ?? {};
    const updated = await updateResource(resourceName, request.params.id, payload);
    sendEnvelope(response, { item: updated });
  });

  app.delete(`${routePath}/:id`, requireAuth, requireRole(["Super Admin", "Staff"]), async (request, response) => {
    await deleteResource(resourceName, request.params.id);
    sendEnvelope(response, { deleted: true });
  });
}

app.use((_request, response) => {
  sendError(response, 404, "Route not found");
});

export async function createApp() {
  await initializeDatabase();
  return app;
}
