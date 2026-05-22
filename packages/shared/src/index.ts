export const tokens = {
  color: {
    canvas: "#f7f8f3",
    surface: "#ffffff",
    surfaceMuted: "#f1f4ec",
    ink: "#202421",
    inkMuted: "#626b62",
    inkSubtle: "#879084",
    line: "#dfe5d8",
    lineStrong: "#c6d0bd",
    accent: "#ef6f3e",
    accentSoft: "#fff0e8",
    success: "#227653",
    successSoft: "#e7f5ee",
    warning: "#a86812",
    warningSoft: "#fff4db",
    danger: "#b23b3b",
    dangerSoft: "#fdeaea",
    info: "#326d80",
    infoSoft: "#e6f4f7"
  },
  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    full: 999
  },
  font: {
    family: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    size: {
      xs: 12,
      sm: 13,
      base: 15,
      md: 16,
      lg: 20,
      xl: 28,
      display: 34
    },
    weight: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700"
    }
  },
  shadow: {
    panel: "0 12px 30px rgba(38, 45, 38, 0.08)",
    popover: "0 18px 50px rgba(38, 45, 38, 0.14)"
  }
} as const;

export const orderStatuses = ["pending", "accepted", "preparing", "ready", "completed", "cancelled"] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled"
};

export const statusTone: Record<OrderStatus, "warning" | "info" | "accent" | "success" | "muted" | "danger"> = {
  pending: "warning",
  accepted: "info",
  preparing: "accent",
  ready: "success",
  completed: "muted",
  cancelled: "danger"
};

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

export function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}
