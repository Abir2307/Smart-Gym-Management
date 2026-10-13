import ExcelJS from "exceljs";
import { spawnSync } from "child_process";

export async function buildExportWorkbook(dashboard) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smart Gym";
  workbook.created = new Date();

  const overview = workbook.addWorksheet("Overview");
  overview.columns = [
    { header: "Metric", key: "metric", width: 32 },
    { header: "Value", key: "value", width: 24 },
  ];

  const o = dashboard.overview || {};
  overview.addRow({ metric: "Gym Name", value: o.gymName });
  overview.addRow({ metric: "Total Members", value: o.totalMembers });
  overview.addRow({ metric: "Active Members", value: o.activeMembers });
  overview.addRow({ metric: "Inactive Members", value: o.inactiveMembers });
  overview.addRow({ metric: "Revenue", value: o.revenue });
  overview.addRow({ metric: "Pending Invoices", value: o.duePayments });
  overview.addRow({ metric: "Attendance Today", value: o.attendanceToday });

  const members = workbook.addWorksheet("Members");
  members.columns = [{ header: "ID", key: "id", width: 18 }, { header: "Name", key: "name", width: 24 }, { header: "Status", key: "status", width: 14 }, { header: "Plan", key: "plan", width: 18 }];
  (dashboard.members || []).forEach((m) => members.addRow({ id: m.id, name: m.name || m.payload?.name || "", status: m.status || m.payload?.status || "", plan: m.planName || m.payload?.planName || "" }));

  const payments = workbook.addWorksheet("Payments");
  payments.columns = [{ header: "ID", key: "id", width: 18 }, { header: "Member", key: "member", width: 24 }, { header: "Amount", key: "amount", width: 14 }, { header: "Status", key: "status", width: 12 }];
  (dashboard.payments || []).forEach((p) => payments.addRow({ id: p.id, member: p.memberName || p.payload?.memberName || "", amount: p.amount ?? p.payload?.amount ?? "", status: p.status || p.payload?.status || "" }));

  return workbook;
}

export function buildReportHtml(dashboard) {
  const o = dashboard.overview || {};
  const notifications = dashboard.notifications || [];
  const attendance = dashboard.attendance || [];

  const trendHtml = (dashboard.attendanceTrend || dashboard.overview?.attendanceTrend || []).map((d) => `<li>${d.day}: ${d.checkIns}</li>`).join("");

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Smart Gym Report</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; margin: 28px; color:#0b2340 }
      h1 { color: #ff8b2b }
      .section { margin-bottom: 20px }
      table { border-collapse: collapse; width:100% }
      th, td { border: 1px solid #ddd; padding: 8px }
    </style>
  </head>
  <body>
    <h1>Smart Gym - Operational Report</h1>
    <div class="section"><strong>Gym:</strong> ${o.gymName || ""}</div>
    <div class="section"><strong>Overview</strong><ul><li>Total members: ${o.totalMembers || 0}</li><li>Active: ${o.activeMembers || 0}</li><li>Revenue: ${o.revenue || 0}</li><li>Attendance today: ${o.attendanceToday || 0}</li></ul></div>
    <div class="section"><strong>Attendance Trend</strong><ul>${trendHtml}</ul></div>
    <div class="section"><strong>Recent Notifications</strong><ul>${notifications.slice(0,5).map(n=>`<li>${n.title} - ${n.detail || ''}</li>`).join('')}</ul></div>
    <div class="section"><strong>Recent check-ins</strong>
      <table><thead><tr><th>When</th><th>Member</th><th>Checked in by</th><th>Note</th></tr></thead><tbody>${attendance.slice(0,10).map(a=>`<tr><td>${a.checkedInAt}</td><td>${a.memberName}</td><td>${a.checkedInBy}</td><td>${a.note||''}</td></tr>`).join('')}</tbody></table>
    </div>
  </body>
  </html>`;
}

export function renderPdfFromHtml(html) {
  // Try to use wkhtmltopdf CLI if available, write to stdout and return the Buffer.
  try {
    const wk = spawnSync("wkhtmltopdf", ["-", "-"], { input: html, maxBuffer: 10 * 1024 * 1024 });
    if (wk.status === 0 && wk.stdout && wk.stdout.length) {
      return wk.stdout;
    }
    return null;
  } catch (err) {
    return null;
  }
}
