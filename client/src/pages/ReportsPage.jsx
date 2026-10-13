import { useEffect, useState } from "react";
import { api, formatCurrency } from "../lib/api";

const fallback = {
  overview: { reports: { weeklyRevenue: 0, monthlyRevenue: 0, retentionRate: 0 } },
};

export function ReportsPage() {
  const [dashboard, setDashboard] = useState(fallback);

  useEffect(() => {
    api.dashboard().then(setDashboard).catch(() => setDashboard(fallback));
  }, []);

  return (
    <section className="section-card">
      <div className="section-header compact">
        <div>
          <p className="eyebrow">Reports & analytics</p>
          <h2>Revenue, attendance, and growth snapshots</h2>
        </div>
      </div>

      <div className="summary-list">
        <article className="summary-card">
          <strong>Weekly revenue</strong>
          <p>{formatCurrency(dashboard.overview.reports.weeklyRevenue)}</p>
        </article>
        <article className="summary-card">
          <strong>Monthly revenue</strong>
          <p>{formatCurrency(dashboard.overview.reports.monthlyRevenue)}</p>
        </article>
        <article className="summary-card">
          <strong>Retention rate</strong>
          <p>{dashboard.overview.reports.retentionRate}%</p>
        </article>
      </div>
    </section>
  );
}
