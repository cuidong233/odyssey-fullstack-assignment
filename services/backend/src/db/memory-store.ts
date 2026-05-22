import type {
  Customer,
  MenuCategory,
  MenuItem,
  OrderingSettings,
  Order,
  OrderItem,
  OrderStatus
} from "./schema";
import type {
  CreateMenuItemInput,
  CustomerWithStats,
  OrderSummary,
  OrderWithItems,
  PersistOrderInput,
  RestaurantStore,
  UpdateMenuItemInput
} from "../domain/order-service";
import { DomainError } from "../domain/errors";

const now = new Date("2026-05-22T13:20:00.000Z");
const ids = {
  categorySignatures: "11111111-1111-4111-8111-111111111111",
  categoryBowls: "11111111-1111-4111-8111-111111111112",
  categoryDrinks: "11111111-1111-4111-8111-111111111113",
  customerMaya: "22222222-2222-4222-8222-222222222221",
  customerNoah: "22222222-2222-4222-8222-222222222222",
  customerAva: "22222222-2222-4222-8222-222222222223",
  itemSalmon: "33333333-3333-4333-8333-333333333331",
  itemBowl: "33333333-3333-4333-8333-333333333332",
  itemShortRib: "33333333-3333-4333-8333-333333333333",
  itemSpritz: "33333333-3333-4333-8333-333333333334",
  order1048: "44444444-4444-4444-8444-444444441048",
  order1047: "44444444-4444-4444-8444-444444441047",
  order1046: "44444444-4444-4444-8444-444444441046"
} as const;

export function createSeededMemoryStore() {
  const store = new MemoryRestaurantStore();
  store.seed();
  return store;
}

class MemoryRestaurantStore implements RestaurantStore {
  private settings: OrderingSettings = {
    id: "default",
    prepTimeMinutes: 14,
    autoAccept: false,
    serviceAvailable: true,
    taxRateBps: 875,
    openingHoursJson: "Mon-Sun 11:00-22:00",
    updatedAt: now
  };

  private categories: MenuCategory[] = [];
  private customers: Customer[] = [];
  private menuItems: MenuItem[] = [];
  private orders: OrderWithItems[] = [];

  seed() {
    this.categories = [
      makeCategory(ids.categorySignatures, "Signatures", 1),
      makeCategory(ids.categoryBowls, "Bowls", 2),
      makeCategory(ids.categoryDrinks, "Drinks", 3)
    ];

    this.customers = [
      makeCustomer(ids.customerMaya, "Maya Chen", "maya@example.test", "(555) 010-1188"),
      makeCustomer(ids.customerNoah, "Noah Patel", "noah@example.test", "(555) 010-2234"),
      makeCustomer(ids.customerAva, "Ava Johnson", "ava@example.test", "(555) 010-7731")
    ];

    this.menuItems = [
      makeMenuItem(ids.itemSalmon, ids.categorySignatures, "Charred Citrus Salmon", 2450, true, 1),
      makeMenuItem(ids.itemBowl, ids.categoryBowls, "Market Grain Bowl", 1680, true, 2),
      makeMenuItem(ids.itemShortRib, ids.categorySignatures, "Smoked Short Rib Plate", 2860, true, 3),
      makeMenuItem(ids.itemSpritz, ids.categoryDrinks, "Yuzu Mint Spritz", 760, false, 4)
    ];

    this.orders = [
      this.makeOrder(ids.order1048, ids.customerMaya, "pending", [ids.itemSalmon, ids.itemBowl], new Date("2026-05-22T12:58:00.000Z")),
      this.makeOrder(ids.order1047, ids.customerNoah, "preparing", [ids.itemShortRib], new Date("2026-05-22T12:42:00.000Z")),
      this.makeOrder(ids.order1046, ids.customerAva, "ready", [ids.itemBowl, ids.itemSpritz], new Date("2026-05-22T12:18:00.000Z"))
    ];
  }

  async getOrderingSettings(): Promise<OrderingSettings> {
    return this.settings;
  }

  async updateOrderingSettings(input: Partial<OrderingSettings>): Promise<OrderingSettings> {
    this.settings = { ...this.settings, ...input, updatedAt: new Date() };
    return this.settings;
  }

  async findCustomerById(id: string): Promise<Customer | null> {
    return this.customers.find((customer) => customer.id === id) ?? null;
  }

  async listCustomers(filters: { limit?: number } = {}): Promise<CustomerWithStats[]> {
    return this.customers.slice(0, filters.limit).map((customer) => {
      const customerOrders = this.orders
        .filter((order) => order.customerId === customer.id)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

      return {
        ...customer,
        orderCount: customerOrders.length,
        spendCents: customerOrders.reduce((total, order) => total + order.totalCents, 0),
        recentOrders: customerOrders.slice(0, 3).map(({ customer: _customer, items: _items, ...order }) => order)
      };
    });
  }

  async listMenuCategories(): Promise<MenuCategory[]> {
    return [...this.categories].sort((left, right) => left.sortOrder - right.sortOrder);
  }

  async listMenuItems(filters: { limit?: number } = {}): Promise<MenuItem[]> {
    return [...this.menuItems]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .slice(0, filters.limit);
  }

  async findMenuItemsByIds(ids: string[]): Promise<MenuItem[]> {
    return this.menuItems.filter((item) => ids.includes(item.id));
  }

  async createMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
    const category = this.categories.find((candidate) => candidate.id === input.categoryId);
    if (!category) {
      throw new DomainError("INVALID_ORDER_PAYLOAD", "Menu category was not found.", 404);
    }

    const item: MenuItem = {
      id: crypto.randomUUID(),
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      priceCents: input.priceCents,
      available: input.available ?? true,
      sortOrder: input.sortOrder ?? this.menuItems.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.menuItems.push(item);
    return item;
  }

  async updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<MenuItem> {
    const item = this.menuItems.find((candidate) => candidate.id === id);
    if (!item) {
      throw new DomainError("MENU_ITEM_NOT_FOUND", "Menu item was not found.", 404);
    }

    Object.assign(item, input, { updatedAt: new Date() });
    return item;
  }

  async createOrder(input: PersistOrderInput): Promise<OrderWithItems> {
    const customer = await this.findCustomerById(input.customerId);
    if (!customer) {
      throw new DomainError("CUSTOMER_NOT_FOUND", "Customer was not found.", 404);
    }

    const createdAt = new Date();
    const order: Order = {
      id: crypto.randomUUID(),
      customerId: input.customerId,
      status: input.status,
      subtotalCents: input.subtotalCents,
      taxCents: input.taxCents,
      totalCents: input.totalCents,
      notes: input.notes,
      createdAt,
      updatedAt: createdAt
    };
    const items = input.items.map((item) => ({
      id: crypto.randomUUID(),
      orderId: order.id,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents
    }));
    const created = { ...order, customer, items };
    this.orders.unshift(created);
    return created;
  }

  async listOrders(filters: { status?: OrderStatus; limit?: number }): Promise<OrderWithItems[]> {
    const orders = filters.status
      ? this.orders.filter((order) => order.status === filters.status)
      : this.orders;
    return orders.slice(0, filters.limit);
  }

  async findOrderById(id: string): Promise<OrderWithItems | null> {
    return this.orders.find((order) => order.id === id) ?? null;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    const order = await this.findOrderById(id);
    if (!order) {
      throw new DomainError("ORDER_NOT_FOUND", "Order was not found.", 404);
    }

    order.status = status;
    order.updatedAt = new Date();
    return order;
  }

  async getHomeSummary(): Promise<OrderSummary> {
    const revenueOrders = this.orders.filter((order) => order.status !== "cancelled");
    const itemQuantities = new Map<string, { menuItemId: string; name: string; quantity: number }>();

    for (const order of revenueOrders) {
      for (const item of order.items) {
        const current = itemQuantities.get(item.menuItemId) ?? {
          menuItemId: item.menuItemId,
          name: item.menuItemName,
          quantity: 0
        };
        current.quantity += item.quantity;
        itemQuantities.set(item.menuItemId, current);
      }
    }

    return {
      totalOrders: this.orders.length,
      revenueCents: revenueOrders.reduce((total, order) => total + order.totalCents, 0),
      pendingOrders: this.orders.filter((order) => order.status === "pending").length,
      popularItems: [...itemQuantities.values()]
        .sort((left, right) => right.quantity - left.quantity)
        .slice(0, 5)
    };
  }

  private makeOrder(
    id: string,
    customerId: string,
    status: OrderStatus,
    menuItemIds: string[],
    createdAt: Date
  ): OrderWithItems {
    const customer = this.customers.find((candidate) => candidate.id === customerId);
    if (!customer) {
      throw new Error(`Seed customer ${customerId} is missing.`);
    }

    const items = menuItemIds.map((menuItemId, index) => {
      const menuItem = this.menuItems.find((candidate) => candidate.id === menuItemId);
      if (!menuItem) {
        throw new Error(`Seed menu item ${menuItemId} is missing.`);
      }
      return {
        id: `${id}-item-${index + 1}`,
        orderId: id,
        menuItemId,
        menuItemName: menuItem.name,
        quantity: 1,
        unitPriceCents: menuItem.priceCents,
        lineTotalCents: menuItem.priceCents
      };
    });
    const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
    const taxCents = Math.round((subtotalCents * this.settings.taxRateBps) / 10_000);

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
      customer,
      items
    };
  }
}

function makeCategory(id: string, name: string, sortOrder: number): MenuCategory {
  return { id, name, sortOrder, createdAt: now, updatedAt: now };
}

function makeCustomer(id: string, name: string, email: string, phone: string): Customer {
  return { id, name, email, phone, createdAt: now, updatedAt: now };
}

function makeMenuItem(
  id: string,
  categoryId: string,
  name: string,
  priceCents: number,
  available: boolean,
  sortOrder: number
): MenuItem {
  return {
    id,
    categoryId,
    name,
    description: null,
    imageUrl: null,
    priceCents,
    available,
    sortOrder,
    createdAt: now,
    updatedAt: now
  };
}
