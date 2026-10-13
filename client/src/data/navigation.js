export const navSections = [
  { label: "Dashboard", path: "/app/dashboard", roles: ["Super Admin", "Staff", "Trainer", "Member"] },
  { label: "Attendance", path: "/app/attendance", roles: ["Super Admin", "Staff", "Trainer", "Member"] },
  { label: "Members", path: "/app/members", roles: ["Super Admin", "Staff"] },
  { label: "Trainers", path: "/app/trainers", roles: ["Super Admin", "Staff"] },
  { label: "Plans", path: "/app/plans", roles: ["Super Admin", "Staff"] },
  { label: "Payments", path: "/app/payments", roles: ["Super Admin", "Staff"] },
  { label: "Reports", path: "/app/reports", roles: ["Super Admin", "Staff"] },
  { label: "Play & Earn", path: "/app/play", roles: ["Member"] },
];

export const rolePermissions = {
  "Super Admin": ["Dashboard", "Attendance", "Members", "Trainers", "Plans", "Payments", "Reports"],
  Staff: ["Dashboard", "Attendance", "Members", "Trainers", "Plans", "Payments", "Reports"],
  Trainer: ["Dashboard", "Attendance", "Trainers", "Plans"],
  Member: ["Dashboard", "Attendance", "Trainers", "Plans", "Play & Earn"],
};

export const rolePresets = [
  { name: "Super Admin", description: "Full control over gym operations and settings" },
  { name: "Staff", description: "Manage members, payments, plans, and daily tasks" },
  { name: "Trainer", description: "Track assigned members, plans, and attendance" },
  { name: "Member", description: "View your plan, trainer, payments, and attendance" },
];
