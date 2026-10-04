export const PAYMENT_METHODS = ["MTN MoMo", "Orange Money", "Cash", "Bank Transfer", "Other"] as const;
export const DURATIONS = [1, 2, 3] as const;
export const EXPENSE_CATEGORIES = ["Subscription purchase", "Internet", "Advertising", "Other"] as const;
export const BILLING_PERIODS = [
  { months: 1, label: "Monthly" },
  { months: 3, label: "Every 3 months" },
  { months: 6, label: "Every 6 months" },
  { months: 12, label: "Yearly" },
] as const;
export const ROLES = ["ADMIN", "COLLABORATOR"] as const;
export const ROLE_LABELS: Record<string, string> = { ADMIN: "Admin", COLLABORATOR: "Collaborator" };

export const SUBSCRIPTION_STATUSES = ["ACTIVE", "RENEWED", "ENDED"] as const;
export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  RENEWED: "Renewed (replaced by a newer term)",
  ENDED: "Ended (client stopped)",
};

export const PLATFORM_SUGGESTIONS = [
  "Netflix",
  "Spotify",
  "Canva",
  "Disney+",
  "YouTube Premium",
  "Apple Music",
  "Amazon Prime Video",
  "ChatGPT",
  "Microsoft 365",
  "Adobe Creative Cloud",
];

/** How many days ahead counts as "soon" for reminders. */
export const SOON_DAYS = 7;
