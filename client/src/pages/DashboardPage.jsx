import { useEffect, useState } from "react";
import { api, formatCurrency } from "../lib/api";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../auth/useAuth";

const defaultDashboard = {
  overview: {
    gymName: "",
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    revenue: 0,
    duePayments: 0,
    attendanceToday: 0,
    trainerCount: 0,
    planCount: 0,
    reports: { weeklyRevenue: 0, monthlyRevenue: 0, activeMembers: 0, inactiveMembers: 0, retentionRate: 0 },
  },
  members: [],
  trainers: [],
  plans: [],
  payments: [],
  notifications: [],
  attendanceTrend: [],
};

export function DashboardPage() {
  const [dashboard, setDashboard] = useState(defaultDashboard);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionKey, setActionKey] = useState("");
  const { user } = useAuth();
  const role = user?.role || "Member";
  const isAdmin = role === "Super Admin" || role === "Staff";
  const showOrgStats = isAdmin;
  const attendanceSeries = dashboard.attendanceTrend || dashboard.overview?.attendanceTrend || [];
  const weeklyAttendanceAverage = attendanceSeries.length
    ? Math.round(attendanceSeries.reduce((total, day) => total + day.checkIns, 0) / attendanceSeries.length)
    : 0;
  const userProfile = dashboard.overview.userProfile || {};
  const wishlistPlanIds = userProfile.wishlistPlanIds || [];

  async function runAction(key, action, message) {
    setActionKey(key);
    setActionMessage("");
    setActionError("");
    try {
      const result = await action();
      const member = result.member;
      setDashboard((current) => ({
        ...current,
        overview: {
          ...current.overview,
          userProfile: { ...(current.overview.userProfile || {}), ...member.payload },
          currentPlan: member.payload.planId
            ? current.plans.find((plan) => plan.id === member.payload.planId) || current.overview.currentPlan
            : current.overview.currentPlan,
        },
      }));
      setActionMessage(message);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setActionKey("");
    }
  }

  useEffect(() => {
    let active = true;

    api
      .dashboard()
      .then((data) => {
        if (active) {
          setDashboard(data);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <header className="topbar">
        <div>
          <p className="eyebrow">Control center</p>
          <h1>{dashboard.overview.gymName}</h1>
        </div>
        <div className="topbar-actions">
          {isAdmin && (
            <>
              <button type="button" className="ghost-button" onClick={async () => {
                try {
                  const token = window.localStorage.getItem('smart-gym-token');
                  const resp = await fetch('/api/v1/export', { headers: { Authorization: `Bearer ${token}` } });
                  if (!resp.ok) throw new Error('Export failed');
                  const blob = await resp.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'smart-gym-export.xlsx';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  alert(err.message || 'Export failed');
                }
              }}>
                Export Excel
              </button>
              <button type="button" className="primary-button" onClick={async () => {
                try {
                  const token = window.localStorage.getItem('smart-gym-token');
                  const resp = await fetch('/api/v1/report', { headers: { Authorization: `Bearer ${token}` } });
                  if (!resp.ok) throw new Error('Report generation failed');
                  const contentType = resp.headers.get('content-type') || '';
                  const blob = await resp.blob();
                  if (contentType.includes('pdf')) {
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  } else {
                    // fallback to download HTML
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'smart-gym-report.html';
                    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                  }
                } catch (err) {
                  alert(err.message || 'Report failed');
                }
              }}>
                Generate report
              </button>
            </>
          )}
        </div>
      </header>

      {error ? <p className="form-error">{error}</p> : null}
      {actionMessage ? <p className="form-success">{actionMessage}</p> : null}
      {actionError ? <p className="form-error">{actionError}</p> : null}

      <section className="stats-grid">
        {showOrgStats ? (
          <>
            <StatCard label="Total members" value={dashboard.overview.totalMembers} detail="Member records in the system" />
            <StatCard label="Active memberships" value={dashboard.overview.activeMembers} detail="Current subscription count" />
            <StatCard label="Revenue tracked" value={formatCurrency(dashboard.overview.revenue)} detail="Payments collected" />
            <StatCard label="Pending invoices" value={dashboard.overview.duePayments} detail="Needs follow-up" />
            <StatCard label="Trainers" value={dashboard.overview.trainerCount} detail="Active trainer accounts" />
            <StatCard label="Plans" value={dashboard.overview.planCount} detail="Membership tiers available" />
          </>
        ) : (
          <>
            <StatCard label="Trainers" value={dashboard.overview.trainerCount} detail="Active trainer accounts" />
            <StatCard label="Plans" value={dashboard.overview.planCount} detail="Membership tiers available" />
          </>
        )}
      </section>

      {isAdmin ? (
        <section className="section-card">
          <div className="section-header compact">
            <div>
              <p className="eyebrow">Operational snapshot</p>
              <h2>Mobile-ready summary data</h2>
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
      ) : null}

      <section className="section-card catalog-section">
        <div className="section-header compact">
          <div>
            <p className="eyebrow">Explore the gym</p>
            <h2>Choose your trainer and membership plan</h2>
            <p>Open each profile to compare details before making your selection.</p>
          </div>
        </div>

        <div className="catalog-grid">
          <div className="catalog-column">
            <h3>Trainers</h3>
            {dashboard.trainers.length ? dashboard.trainers.map((trainer) => (
              <article className="catalog-card" key={trainer.id}>
                <div>
                  <strong>{trainer.name}</strong>
                  <p>{trainer.specialty || "Fitness coaching"}</p>
                </div>
                <dl className="detail-list">
                  <div><dt>Shift</dt><dd>{trainer.shift || "Flexible"}</dd></div>
                  <div><dt>Experience</dt><dd>{trainer.experience || "Profile not provided"}</dd></div>
                  <div><dt>Certifications</dt><dd>{trainer.certifications || "Profile not provided"}</dd></div>
                  <div><dt>Availability</dt><dd>{trainer.availability || "Contact gym"}</dd></div>
                </dl>
                {trainer.bio ? <p className="catalog-description">{trainer.bio}</p> : null}
                {!isAdmin ? (
                  <button
                    type="button"
                    className="primary-button"
                    disabled={actionKey === `trainer-${trainer.id}`}
                    onClick={() => runAction(`trainer-${trainer.id}`, () => api.selectTrainer(trainer), `Trainer selected: ${trainer.name}`)}
                  >
                    {userProfile.trainerId === trainer.id ? "Selected trainer" : "Select trainer"}
                  </button>
                ) : null}
              </article>
            )) : <p className="empty-state">No trainer profiles have been added yet.</p>}
          </div>

          <div className="catalog-column">
            <h3>Plans</h3>
            {dashboard.plans.length ? dashboard.plans.map((plan) => (
              <article className="catalog-card" key={plan.id}>
                <div className="catalog-card-heading">
                  <div>
                    <strong>{plan.name}</strong>
                    <p>{plan.description || `${plan.billingCycle || "Flexible"} membership`}</p>
                  </div>
                  <b>{formatCurrency(plan.price)}</b>
                </div>
                <dl className="detail-list">
                  <div><dt>Billing</dt><dd>{plan.billingCycle || "Not provided"}</dd></div>
                  <div><dt>Discount</dt><dd>{plan.discount || 0}%</dd></div>
                  <div><dt>Reminder</dt><dd>{plan.reminderDays || 0} days before expiry</dd></div>
                  <div><dt>Status</dt><dd>{plan.status || "Active"}</dd></div>
                </dl>
                {plan.features ? <p className="catalog-description">{plan.features}</p> : null}
                {!isAdmin ? (
                  <div className="catalog-actions">
                    <button
                      type="button"
                      className="primary-button"
                      disabled={actionKey === `plan-${plan.id}`}
                      onClick={() => runAction(`plan-${plan.id}`, () => api.selectPlan(plan), `You are registered for ${plan.name}`)}
                    >
                      {userProfile.planId === plan.id ? "Registered" : "Register in plan"}
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={actionKey === `wishlist-${plan.id}` || wishlistPlanIds.includes(plan.id)}
                      onClick={() => runAction(`wishlist-${plan.id}`, () => api.wishlistPlan(plan.id), `Added ${plan.name} to your wishlist`)}
                    >
                      {wishlistPlanIds.includes(plan.id) ? "Wishlisted" : "Wishlist"}
                    </button>
                  </div>
                ) : null}
              </article>
            )) : <p className="empty-state">No membership plans have been added yet.</p>}
          </div>
        </div>
      </section>

      <section className="summary-list">
        <article className="summary-card">
          <strong>Notifications</strong>
          <p>{dashboard.notifications.slice(0, 1).map((item) => item.title).join(" • ")}</p>
        </article>
        <article className="summary-card">
          <strong>Attendance trend</strong>
          <p>{dashboard.overview.attendanceToday} check-ins today, weekly average {weeklyAttendanceAverage}.</p>
        </article>
      </section>
    </div>
  );
}
