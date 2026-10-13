import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../auth/useAuth";

const initialCheckIn = {
  memberId: "",
  memberName: "",
  note: "",
};

export function AttendancePage() {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const isMember = user?.role === "Member";

  useEffect(() => {
    let active = true;

    async function loadAttendance() {
      try {
        // Always fetch attendance (filtered by server per role)
        const attendanceResponse = await api.attendance();

        let membersResponse = { items: [] };
        // Only fetch members list if the current user is not a Member and auth resolved
        if (!authLoading && !isMember) {
          membersResponse = await api.list("members");
        }

        if (active) {
          setItems(attendanceResponse.items);
          setMembers(membersResponse.items || []);
          // If current user is a member, prefill check-in with their own details
          if (isMember && user) {
            setCheckIn((c) => ({ ...c, memberId: user.id, memberName: user.fullName }));
          }
        }
      } catch (error) {
        if (active) {
          setMessage(error.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    // Wait until auth has resolved to avoid calling protected endpoints with unknown role
    if (!authLoading) {
      loadAttendance();
    }

    return () => {
      active = false;
    };
  }, [isMember, user]);

  const recentItems = useMemo(() => items.slice(0, 8), [items]);

  function updateField(name, value) {
    setCheckIn((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await api.checkIn(checkIn);
      setItems((current) => [response.item, ...current]);
      setCheckIn(initialCheckIn);
      setMessage("Attendance recorded successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="page-stack">
      <section className="section-card">
        <div className="section-header compact">
          <div>
            <p className="eyebrow">Attendance Management</p>
            <h2>Member check-in</h2>
          </div>
        </div>

        <div className="crud-layout attendance-layout">
          <form className="crud-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span>Member</span>
                {isMember ? (
                  <input value={checkIn.memberName} readOnly />
                ) : (
                  <select
                    value={checkIn.memberId}
                    onChange={(event) => {
                      const selectedMember = members.find((member) => member.id === event.target.value);
                      updateField("memberId", event.target.value);
                      updateField("memberName", selectedMember?.name ?? "");
                    }}
                  >
                    <option value="">Select a member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {member.id}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {!isMember && (
                <label className="field">
                  <span>Member name</span>
                  <input value={checkIn.memberName} onChange={(event) => updateField("memberName", event.target.value)} placeholder="Aarav Shah" />
                </label>
              )}

              <label className="field field-span-2">
                <span>Note</span>
                <textarea value={checkIn.note} onChange={(event) => updateField("note", event.target.value)} rows={4} placeholder="Morning batch, late session, etc." />
              </label>
            </div>

            {message ? <p className="form-error">{message}</p> : null}

            <div className="form-actions">
              <button type="submit" className="primary-button">
                Mark check-in
              </button>
              <button type="button" className="ghost-button" onClick={() => setCheckIn(initialCheckIn)}>
                Clear
              </button>
            </div>
          </form>

          <div className="table-card">
            {loading ? (
              <div className="empty-state">Loading attendance...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Checked in at</th>
                    <th>By</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {recentItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.memberName}</td>
                      <td>{new Date(item.checkedInAt).toLocaleString()}</td>
                      <td>{item.checkedInBy}</td>
                      <td>{item.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}