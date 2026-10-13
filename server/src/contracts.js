export const API_VERSION = "v1";

export const resourceContracts = {
  members: {
    id: "text",
    payload: {
      name: "string",
      mobile: "string",
      status: "string",
      planName: "string",
      startDate: "string",
      expiryDate: "string",
      emergencyContact: "string",
      healthInfo: "string",
      trainerName: "string",
      photoUrl: "string"
    }
  },
  trainers: {
    id: "text",
    payload: {
      name: "string",
      specialty: "string",
      phone: "string",
      shift: "string",
      salary: "number"
    }
  },
  plans: {
    id: "text",
    payload: {
      name: "string",
      billingCycle: "string",
      price: "number",
      discount: "number",
      reminderDays: "number"
    }
  },
  payments: {
    id: "text",
    payload: {
      memberName: "string",
      memberId: "string",
      amount: "number",
      status: "string",
      method: "string",
      invoiceNumber: "string",
      paidOn: "string"
    }
  }
};

export const routeContract = {
  auth: {
    login: `/api/${API_VERSION}/auth/login`,
    me: `/api/${API_VERSION}/auth/me`
  },
  dashboard: `/api/${API_VERSION}/dashboard`,
  resources: {
    members: `/api/${API_VERSION}/members`,
    trainers: `/api/${API_VERSION}/trainers`,
    plans: `/api/${API_VERSION}/plans`,
    payments: `/api/${API_VERSION}/payments`,
    attendance: `/api/${API_VERSION}/attendance`,
    notifications: `/api/${API_VERSION}/notifications`,
    games: `/api/${API_VERSION}/games`
  }
};