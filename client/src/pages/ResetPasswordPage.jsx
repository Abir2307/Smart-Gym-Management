import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await api.resetPassword(searchParams.get("token"), password);
      setConfirmation("");
      setPassword("");
      setError("");
      setSaving(false);
      window.history.replaceState({}, document.title, "/login");
      window.location.href = "/login?reset=success";
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  }

  return (
    <div className="centered-shell">
      <section className="modal-panel reset-panel">
        <p className="eyebrow">Account recovery</p>
        <h1>Set a new password</h1>
        <p className="modal-copy">Choose a new password with at least six characters.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>New password</span>
            <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input type="password" required minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button full-width" disabled={saving}>
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
        <Link className="text-button reset-back-link" to="/login">
          Back to login
        </Link>
      </section>
    </div>
  );
}