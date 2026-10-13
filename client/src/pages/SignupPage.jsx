import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";

export function SignupPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", passwordConfirm: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (!form.fullName || !form.email || !form.password) {
      setError("All fields are required");
      setSaving(false);
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError("Passwords do not match");
      setSaving(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setSaving(false);
      return;
    }

    try {
      await api.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      // After successful registration, redirect to login
      navigate("/login", { replace: true, state: { message: "Account created! Please log in." } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel auth-copy">
        <h1>Create Member Account</h1>
        <p>
          Self-registration is only available for Member users. Staff and Trainer accounts must be created by an administrator.
        </p>
        <div className="role-grid">
          <article className="role-card">
            <strong>Members</strong>
            <span>Track your attendance, payments, and memberships</span>
          </article>
          <article className="role-card">
            <strong>Admin-managed roles</strong>
            <span>Staff and Trainer accounts are setup by the gym administrator</span>
          </article>
        </div>
      </section>

      <section className="auth-panel auth-form-panel">
        <div className="brand-mark">
          <span className="brand-icon">SG</span>
          <div>
            <p>PulseForge Fitness</p>
            <strong>Sign up</strong>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full Name</span>
            <input
              type="text"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Your name"
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="your@email.com"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="At least 6 characters"
            />
          </label>

          <label className="field">
            <span>Confirm Password</span>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={(event) => setForm((current) => ({ ...current, passwordConfirm: event.target.value }))}
              placeholder="Re-enter password"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="primary-button full-width" disabled={saving}>
            {saving ? "Creating account..." : "Sign up"}
          </button>

          <div className="hint-box">
            <span>Already have an account?</span>
            <Link to="/login" style={{ color: "var(--accent)" }}>
              Sign in here
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
