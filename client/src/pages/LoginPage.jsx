import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { rolePresets } from "../data/navigation";
import { useAuth } from "../auth/useAuth";

export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetRequested, setResetRequested] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/app/dashboard";
  const successMessage = location.state?.message || "";

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await auth.login(form);
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function openForgotPassword() {
    setResetEmail(form.email);
    setResetRequested(false);
    setForgotPasswordOpen(true);
  }

  function closeForgotPassword() {
    setForgotPasswordOpen(false);
    setResetRequested(false);
    setResetError("");
  }

  async function handleResetRequest(event) {
    event.preventDefault();
    setResetSaving(true);
    setResetError("");
    try {
      await api.forgotPassword(resetEmail);
      setResetRequested(true);
    } catch (requestError) {
      setResetError(requestError.message);
    } finally {
      setResetSaving(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel auth-copy">
        <h1>Smart Gym Management System</h1>
        <div className="role-grid">
          {rolePresets.map((role) => (
            <article key={role.name} className="role-card">
              <strong>{role.name}</strong>
              <span>{role.description}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="auth-panel auth-form-panel">
        <div className="brand-mark">
          <span className="brand-icon">SG</span>
          <div>
            <p>PulseForge Fitness</p>
            <strong>Sign in</strong>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          <button type="button" className="text-button" onClick={openForgotPassword}>
            Forgot password?
          </button>

          {successMessage ? <p className="form-success">{successMessage}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="primary-button full-width" disabled={saving}>
            {saving ? "Signing in..." : "Login"}
          </button>

          <div className="hint-box">
            <span>Don't have an account?</span>
            <Link to="/signup" style={{ color: "var(--accent)" }}>
              Create one here
            </Link>
          </div>
        </form>
      </section>

      {forgotPasswordOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeForgotPassword}>
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Account recovery</p>
                <h2 id="forgot-password-title">Forgot your password?</h2>
              </div>
              <button type="button" className="modal-close" aria-label="Close forgot password dialog" onClick={closeForgotPassword}>
                ×
              </button>
            </div>

            {resetRequested ? (
              <div className="form-success">
                If an account matches this email, recovery instructions will be sent shortly.
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleResetRequest}>
                <p className="modal-copy">Enter the email connected to your gym account to request a password reset.</p>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                {resetError ? <p className="form-error">{resetError}</p> : null}
                <button type="submit" className="primary-button full-width" disabled={resetSaving}>
                  {resetSaving ? "Sending..." : "Request reset link"}
                </button>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
