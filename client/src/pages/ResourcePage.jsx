import { EntityManager } from "../components/EntityManager";
import { useAuth } from "../auth/useAuth";

export function ResourcePage({ config }) {
  const { user } = useAuth();
  const readOnly = !["Super Admin", "Staff"].includes(user?.role);

  return <EntityManager {...config} readOnly={readOnly} />;
}
