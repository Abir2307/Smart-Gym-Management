// Only the admin account is pre-seeded; all other users register via the app
export const seedUsers = [
  {
    id: "usr-super-admin",
    fullName: "Super Admin",
    email: "admin@pulseforge.test",
    password: "Gym@1234",
    role: "Super Admin"
  }
];

// No demo data — all records are created by users via the app
export const seedRecords = {
  members: [],
  trainers: [],
  plans: [],
  payments: []
};

// Attendance trend will be calculated from real attendance data
export const seedAttendanceTrend = [];

// Notifications will be generated dynamically by the system
export const seedNotifications = [];

// Attendance records are created when members check in
export const seedAttendance = [];