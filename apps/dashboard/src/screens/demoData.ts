import type { BusinessSettings, Customer, HomeSummary, MenuCategory, MenuItem, Order, OrderStatus } from "@repo/api-client";

const now = "2026-05-22T13:20:00.000Z";

export const demoCategories = [
  { id: "cat-signatures", name: "Signatures", sortOrder: 1, createdAt: now, updatedAt: now },
  { id: "cat-bowls", name: "Bowls", sortOrder: 2, createdAt: now, updatedAt: now },
  { id: "cat-drinks", name: "Drinks", sortOrder: 3, createdAt: now, updatedAt: now }
] satisfies MenuCategory[];

export const demoMenuItems = [
  {
    id: "item-1",
    categoryId: "cat-signatures",
    name: "Charred Citrus Salmon",
    description: "Seared salmon, preserved lemon, herb rice.",
    imageUrl: null,
    priceCents: 2450,
    available: true,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "item-2",
    categoryId: "cat-bowls",
    name: "Market Grain Bowl",
    description: "Farro, roasted squash, feta, green tahini.",
    imageUrl: null,
    priceCents: 1680,
    available: true,
    sortOrder: 2,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "item-3",
    categoryId: "cat-signatures",
    name: "Smoked Short Rib Plate",
    description: "Braised beef, pickled onions, jus.",
    imageUrl: null,
    priceCents: 2860,
    available: true,
    sortOrder: 3,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "item-4",
    categoryId: "cat-drinks",
    name: "Yuzu Mint Spritz",
    description: "Yuzu, mint, soda.",
    imageUrl: null,
    priceCents: 760,
    available: false,
    sortOrder: 4,
    createdAt: now,
    updatedAt: now
  }
] satisfies MenuItem[];

export const demoOrders = [
  makeOrder("ORD-1048", "cust-1", "Maya Chen", "pending", ["accepted", "cancelled"], 4890, "2026-05-22T12:58:00.000Z", [
    ["line-1", "Charred Citrus Salmon", 1, 2450],
    ["line-2", "Market Grain Bowl", 1, 1680]
  ]),
  makeOrder("ORD-1047", "cust-2", "Noah Patel", "preparing", ["ready", "cancelled"], 3630, "2026-05-22T12:42:00.000Z", [
    ["line-3", "Smoked Short Rib Plate", 1, 2860]
  ]),
  makeOrder("ORD-1046", "cust-3", "Ava Johnson", "ready", ["completed"], 2592, "2026-05-22T12:18:00.000Z", [
    ["line-4", "Market Grain Bowl", 1, 1680],
    ["line-5", "Yuzu Mint Spritz", 1, 760]
  ])
] satisfies Order[];

export const demoCustomers = [
  {
    id: "cust-1",
    name: "Maya Chen",
    email: "maya@example.test",
    phone: "(555) 010-1188",
    createdAt: now,
    updatedAt: now,
    orderCount: 12,
    spendCents: 42180,
    recentOrders: [toRecentOrder(demoOrders[0]!)]
  },
  {
    id: "cust-2",
    name: "Noah Patel",
    email: "noah@example.test",
    phone: "(555) 010-2234",
    createdAt: now,
    updatedAt: now,
    orderCount: 8,
    spendCents: 28740,
    recentOrders: [toRecentOrder(demoOrders[1]!)]
  },
  {
    id: "cust-3",
    name: "Ava Johnson",
    email: "ava@example.test",
    phone: "(555) 010-7731",
    createdAt: now,
    updatedAt: now,
    orderCount: 5,
    spendCents: 15890,
    recentOrders: [toRecentOrder(demoOrders[2]!)]
  }
] satisfies Customer[];

export const demoHomeSummary = {
  totalOrders: 38,
  revenueCents: 89420,
  pendingOrders: 4,
  popularItems: [
    { menuItemId: "item-1", name: "Charred Citrus Salmon", quantity: 14 },
    { menuItemId: "item-2", name: "Market Grain Bowl", quantity: 11 },
    { menuItemId: "item-3", name: "Smoked Short Rib Plate", quantity: 8 }
  ]
} satisfies HomeSummary;

export const demoSettings = {
  id: "settings-demo",
  prepTimeMinutes: 14,
  autoAccept: false,
  serviceAvailable: true,
  taxRateBps: 875,
  openingHoursJson: "Mon-Sun 11:00-22:00",
  updatedAt: now
} satisfies BusinessSettings;

export function demoOrdersForStatus(status: OrderStatus | "all") {
  return status === "all" ? demoOrders : demoOrders.filter((order) => order.status === status);
}

function makeOrder(
  id: string,
  customerId: string,
  customerName: string,
  status: OrderStatus,
  nextStatuses: OrderStatus[],
  subtotalCents: number,
  createdAt: string,
  items: Array<[string, string, number, number]>
): Order {
  const taxCents = Math.round(subtotalCents * 0.0875);
  return {
    id,
    customerId,
    status,
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
    notes: null,
    createdAt,
    updatedAt: createdAt,
    customer: { id: customerId, name: customerName, email: null, phone: null, createdAt: now, updatedAt: now },
    items: items.map(([lineId, menuItemName, quantity, unitPriceCents]) => ({
      id: lineId,
      orderId: id,
      menuItemId: lineId.replace("line", "item"),
      menuItemName,
      quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * quantity
    })),
    nextStatuses
  };
}

function toRecentOrder(order: Order): Customer["recentOrders"][number] {
  return {
    id: order.id,
    customerId: order.customerId,
    status: order.status,
    subtotalCents: order.subtotalCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}
