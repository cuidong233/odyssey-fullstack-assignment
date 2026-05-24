import { describe, expect, it } from "vitest";
import type {
  Customer,
  MenuCategory,
  MenuItem,
  OrderingSettings,
  Order,
  OrderItem,
  OrderStatus
} from "../db/schema";
import {
  createOrder,
  deleteMenuItem,
  type CreateMenuItemInput,
  type CustomerWithStats,
  type OrderSummary,
  type OrderWithItems,
  type PersistOrderInput,
  type RestaurantStore,
  type UpdateCustomerInput,
  type UpdateMenuItemInput,
  updateOrderStatus
} from "./order-service";

const now = new Date("2026-05-22T00:00:00.000Z");

class TestStore implements RestaurantStore {
  settings: OrderingSettings = {
    id: "default",
    prepTimeMinutes: 20,
    autoAccept: false,
    serviceAvailable: true,
    taxRateBps: 875,
    openingHoursJson: "{}",
    updatedAt: now
  };

  customers: Customer[] = [
    {
      id: "customer-1",
      name: "Ari Chen",
      email: "ari@example.com",
      phone: "555-0101",
      createdAt: now,
      updatedAt: now
    }
  ];

  menuItems: MenuItem[] = [
    {
      id: "item-1",
      categoryId: "category-1",
      name: "Market Bowl",
      description: "Grains, greens, seasonal vegetables",
      imageUrl: "/menu-images/market-bowl.png",
      priceCents: 1400,
      available: true,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "item-2",
      categoryId: "category-1",
      name: "Sold Out Soup",
      description: null,
      imageUrl: null,
      priceCents: 900,
      available: false,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now
    }
  ];

  orders: OrderWithItems[] = [];

  async getOrderingSettings(): Promise<OrderingSettings> {
    return this.settings;
  }

  async updateOrderingSettings(
    input: Partial<OrderingSettings>
  ): Promise<OrderingSettings> {
    this.settings = { ...this.settings, ...input, updatedAt: now };
    return this.settings;
  }

  async findCustomerById(id: string): Promise<Customer | null> {
    return this.customers.find((customer) => customer.id === id) ?? null;
  }

  async listCustomers(filters: { limit?: number } = {}): Promise<CustomerWithStats[]> {
    return this.customers.slice(0, filters.limit).map((customer) => ({
      ...customer,
      orderCount: 0,
      spendCents: 0,
      recentOrders: []
    }));
  }

  async createCustomer(input: { name: string; email?: string | null; phone?: string | null }): Promise<Customer> {
    const customer: Customer = {
      id: `customer-${this.customers.length + 1}`,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.customers.push(customer);
    return customer;
  }

  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const customer = this.customers.find((candidate) => candidate.id === id);
    if (!customer) {
      throw new Error("Missing test customer");
    }
    Object.assign(customer, input, { updatedAt: now });
    return customer;
  }

  async listMenuCategories(): Promise<MenuCategory[]> {
    return [
      {
        id: "category-1",
        name: "Mains",
        sortOrder: 0,
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  async listMenuItems(filters: { limit?: number } = {}): Promise<MenuItem[]> {
    return this.menuItems.slice(0, filters.limit);
  }

  async findMenuItemsByIds(ids: string[]): Promise<MenuItem[]> {
    return this.menuItems.filter((item) => ids.includes(item.id));
  }

  async createMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
    const item = {
      id: `item-${this.menuItems.length + 1}`,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      available: input.available ?? true,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
      ...input
    };
    this.menuItems.push(item);
    return item;
  }

  async updateMenuItem(
    id: string,
    input: UpdateMenuItemInput
  ): Promise<MenuItem> {
    const item = this.menuItems.find((menuItem) => menuItem.id === id);
    if (!item) {
      throw new Error("Missing test menu item");
    }
    Object.assign(item, input, { updatedAt: now });
    return item;
  }

  async menuItemHasOrders(id: string): Promise<boolean> {
    return this.orders.some((order) =>
      order.items.some((item) => item.menuItemId === id)
    );
  }

  async deleteMenuItem(id: string): Promise<MenuItem> {
    const index = this.menuItems.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("Missing test menu item");
    }
    const [deleted] = this.menuItems.splice(index, 1);
    if (!deleted) {
      throw new Error("Missing deleted test menu item");
    }
    return deleted;
  }

  async createOrder(input: PersistOrderInput): Promise<OrderWithItems> {
    const customer = this.customers.find(
      (candidate) => candidate.id === input.customerId
    );
    if (!customer) {
      throw new Error("Missing test customer");
    }

    const order: Order = {
      id: `order-${this.orders.length + 1}`,
      customerId: input.customerId,
      status: input.status,
      subtotalCents: input.subtotalCents,
      taxCents: input.taxCents,
      totalCents: input.totalCents,
      notes: input.notes,
      createdAt: now,
      updatedAt: now
    };
    const items: OrderItem[] = input.items.map((item, index) => ({
      id: `order-item-${index + 1}`,
      orderId: order.id,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents
    }));
    const created = {
      ...order,
      customer,
      items
    };
    this.orders.push(created);
    return created;
  }

  async listOrders(filters: {
    status?: OrderStatus;
    limit?: number;
  }): Promise<OrderWithItems[]> {
    const filtered = filters.status
      ? this.orders.filter((order) => order.status === filters.status)
      : this.orders;
    return filtered.slice(0, filters.limit);
  }

  async findOrderById(id: string): Promise<OrderWithItems | null> {
    return this.orders.find((order) => order.id === id) ?? null;
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus
  ): Promise<OrderWithItems> {
    const order = this.orders.find((candidate) => candidate.id === id);
    if (!order) {
      throw new Error("Missing test order");
    }
    order.status = status;
    order.updatedAt = now;
    return order;
  }

  async getHomeSummary(): Promise<OrderSummary> {
    return {
      totalOrders: this.orders.length,
      revenueCents: this.orders.reduce(
        (total, order) => total + order.totalCents,
        0
      ),
      pendingOrders: this.orders.filter((order) => order.status === "pending")
        .length,
      popularItems: []
    };
  }
}

describe("order service", () => {
  it("creates an order with server-side totals and item snapshots", async () => {
    const store = new TestStore();

    const order = await createOrder(store, {
      customerId: "customer-1",
      items: [{ menuItemId: "item-1", quantity: 2 }]
    });

    expect(order.status).toBe("pending");
    expect(order.subtotalCents).toBe(2800);
    expect(order.taxCents).toBe(245);
    expect(order.totalCents).toBe(3045);
    expect(order.items[0]).toMatchObject({
      menuItemName: "Market Bowl",
      quantity: 2,
      unitPriceCents: 1400,
      lineTotalCents: 2800
    });
  });

  it("rejects unavailable menu items", async () => {
    const store = new TestStore();

    await expect(
      createOrder(store, {
        customerId: "customer-1",
        items: [{ menuItemId: "item-2", quantity: 1 }]
      })
    ).rejects.toMatchObject({
      code: "MENU_ITEM_UNAVAILABLE",
      status: 409
    });
  });

  it("rejects invalid order quantities", async () => {
    const store = new TestStore();

    await expect(
      createOrder(store, {
        customerId: "customer-1",
        items: [{ menuItemId: "item-1", quantity: 0 }]
      })
    ).rejects.toMatchObject({
      code: "INVALID_ORDER_PAYLOAD",
      status: 422
    });
  });

  it("allows valid order status transitions", async () => {
    const store = new TestStore();
    const order = await createOrder(store, {
      customerId: "customer-1",
      items: [{ menuItemId: "item-1", quantity: 1 }]
    });

    const updated = await updateOrderStatus(store, order.id, "accepted");

    expect(updated.status).toBe("accepted");
  });

  it("rejects invalid order status transitions", async () => {
    const store = new TestStore();
    const order = await createOrder(store, {
      customerId: "customer-1",
      items: [{ menuItemId: "item-1", quantity: 1 }]
    });

    await expect(
      updateOrderStatus(store, order.id, "completed")
    ).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION",
      status: 409
    });
  });

  it("deletes menu items that have not appeared in orders", async () => {
    const store = new TestStore();

    const deleted = await deleteMenuItem(store, "item-2");

    expect(deleted.name).toBe("Sold Out Soup");
    expect(store.menuItems.map((item) => item.id)).toEqual(["item-1"]);
  });

  it("rejects deleting menu items with historical order usage", async () => {
    const store = new TestStore();
    await createOrder(store, {
      customerId: "customer-1",
      items: [{ menuItemId: "item-1", quantity: 1 }]
    });

    await expect(deleteMenuItem(store, "item-1")).rejects.toMatchObject({
      code: "MENU_ITEM_HAS_ORDERS",
      status: 409
    });
  });
});
