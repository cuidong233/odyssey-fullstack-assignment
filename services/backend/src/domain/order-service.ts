import type {
  Customer,
  MenuItem,
  OrderingSettings,
  Order,
  OrderItem,
  OrderStatus
} from "../db/schema";
import { DomainError } from "./errors";
import { assertValidStatusTransition } from "./order-status";

export type CreateOrderLineInput = {
  menuItemId: string;
  quantity: number;
};

export type CreateOrderInput = {
  customerId: string;
  items: CreateOrderLineInput[];
  notes?: string | null;
};

export type CreateMenuItemInput = {
  categoryId: string;
  name: string;
  description?: string | null;
  priceCents: number;
  available?: boolean;
  sortOrder?: number;
};

export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

export type PersistOrderInput = {
  customerId: string;
  status: OrderStatus;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  notes: string | null;
  items: Array<{
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};

export type OrderWithItems = Order & {
  customer: Customer;
  items: OrderItem[];
};

export type OrderSummary = {
  totalOrders: number;
  revenueCents: number;
  pendingOrders: number;
  popularItems: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
  }>;
};

export type CustomerWithStats = Customer & {
  orderCount: number;
  spendCents: number;
  recentOrders: Order[];
};

export type RestaurantStore = {
  getOrderingSettings(): Promise<OrderingSettings>;
  updateOrderingSettings(
    input: Partial<
      Pick<
        OrderingSettings,
        | "prepTimeMinutes"
        | "autoAccept"
        | "serviceAvailable"
        | "taxRateBps"
        | "openingHoursJson"
      >
    >
  ): Promise<OrderingSettings>;
  findCustomerById(id: string): Promise<Customer | null>;
  listCustomers(): Promise<CustomerWithStats[]>;
  listMenuItems(): Promise<MenuItem[]>;
  findMenuItemsByIds(ids: string[]): Promise<MenuItem[]>;
  createMenuItem(input: CreateMenuItemInput): Promise<MenuItem>;
  updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<MenuItem>;
  createOrder(input: PersistOrderInput): Promise<OrderWithItems>;
  listOrders(filters: { status?: OrderStatus }): Promise<OrderWithItems[]>;
  findOrderById(id: string): Promise<OrderWithItems | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<OrderWithItems>;
  getHomeSummary(): Promise<OrderSummary>;
};

export async function createOrder(
  store: RestaurantStore,
  input: CreateOrderInput
): Promise<OrderWithItems> {
  if (input.items.length === 0) {
    throw new DomainError(
      "INVALID_ORDER_PAYLOAD",
      "Order must contain at least one item."
    );
  }

  const uniqueMenuItemIds = new Set(input.items.map((item) => item.menuItemId));
  if (uniqueMenuItemIds.size !== input.items.length) {
    throw new DomainError(
      "DUPLICATE_ORDER_ITEM",
      "Order items must be grouped by menu item.",
      422
    );
  }

  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new DomainError(
        "INVALID_ORDER_PAYLOAD",
        "Order item quantities must be positive integers.",
        422
      );
    }
  }

  const [settings, customer, menuItems] = await Promise.all([
    store.getOrderingSettings(),
    store.findCustomerById(input.customerId),
    store.findMenuItemsByIds([...uniqueMenuItemIds])
  ]);

  if (!settings.serviceAvailable) {
    throw new DomainError(
      "SERVICE_UNAVAILABLE",
      "Ordering is currently unavailable.",
      409
    );
  }

  if (!customer) {
    throw new DomainError("CUSTOMER_NOT_FOUND", "Customer was not found.", 404);
  }

  const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));
  const lineItems = input.items.map((line) => {
    const menuItem = menuItemsById.get(line.menuItemId);
    if (!menuItem) {
      throw new DomainError(
        "MENU_ITEM_NOT_FOUND",
        `Menu item ${line.menuItemId} was not found.`,
        404
      );
    }

    if (!menuItem.available) {
      throw new DomainError(
        "MENU_ITEM_UNAVAILABLE",
        `${menuItem.name} is not currently available.`,
        409
      );
    }

    const lineTotalCents = menuItem.priceCents * line.quantity;
    return {
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      quantity: line.quantity,
      unitPriceCents: menuItem.priceCents,
      lineTotalCents
    };
  });

  const subtotalCents = lineItems.reduce(
    (total, item) => total + item.lineTotalCents,
    0
  );
  const taxCents = Math.round((subtotalCents * settings.taxRateBps) / 10_000);
  const totalCents = subtotalCents + taxCents;
  const status = settings.autoAccept ? "accepted" : "pending";

  return store.createOrder({
    customerId: input.customerId,
    status,
    subtotalCents,
    taxCents,
    totalCents,
    notes: input.notes ?? null,
    items: lineItems
  });
}

export async function updateOrderStatus(
  store: RestaurantStore,
  orderId: string,
  nextStatus: OrderStatus
): Promise<OrderWithItems> {
  const order = await store.findOrderById(orderId);
  if (!order) {
    throw new DomainError("ORDER_NOT_FOUND", "Order was not found.", 404);
  }

  assertValidStatusTransition(order.status, nextStatus);
  return store.updateOrderStatus(orderId, nextStatus);
}
