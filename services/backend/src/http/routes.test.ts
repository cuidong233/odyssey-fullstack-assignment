import { describe, expect, it } from "vitest";
import type {
  Customer,
  MenuCategory,
  MenuItem,
  OrderingSettings,
  Order,
  OrderItem
} from "../db/schema";
import type {
  CreateMenuItemInput,
  CreateCustomerInput,
  CustomerWithStats,
  OrderSummary,
  OrderWithItems,
  PersistOrderInput,
  RestaurantStore,
  UpdateMenuItemInput
} from "../domain/order-service";
import { handlers } from "./routes";

const now = new Date("2026-05-22T00:00:00.000Z");

describe("route handlers", () => {
  it("passes validated list limits to the store layer", async () => {
    const calls: Array<{ name: string; filters: unknown }> = [];
    const store = createRecordingStore(calls);

    await handlers.listMenu(store, { limit: 7 });
    await handlers.listOrders(store, { status: "accepted", limit: 12, range: "week" });
    await handlers.listCustomers(store, { limit: 5 });

    expect(calls).toEqual([
      { name: "listMenuItems", filters: { limit: 7 } },
      {
        name: "listOrders",
        filters: {
          status: "accepted",
          limit: 12,
          createdAtFrom: expect.any(Date)
        }
      },
      { name: "listCustomers", filters: { limit: 5 } }
    ]);
  });

  it("creates customers through the store layer", async () => {
    const calls: Array<{ name: string; filters: unknown }> = [];
    const store = createRecordingStore(calls);

    const customer = await handlers.createCustomer(store, {
      name: "New Guest",
      email: null,
      phone: "555-0199"
    });

    expect(customer).toMatchObject({
      name: "New Guest",
      email: null,
      phone: "555-0199"
    });
    expect(calls).toContainEqual({
      name: "createCustomer",
      filters: {
        name: "New Guest",
        email: null,
        phone: "555-0199"
      }
    });
  });
});

function createRecordingStore(
  calls: Array<{ name: string; filters: unknown }>
): RestaurantStore {
  const customer: Customer = {
    id: "customer-1",
    name: "Ari Chen",
    email: "ari@example.com",
    phone: "555-0101",
    createdAt: now,
    updatedAt: now
  };
  const category: MenuCategory = {
    id: "category-1",
    name: "Mains",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now
  };
  const menuItem: MenuItem = {
    id: "item-1",
    categoryId: category.id,
    name: "Market Bowl",
    description: "Grains and greens",
    imageUrl: "/menu-images/market-bowl.png",
    priceCents: 1400,
    available: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now
  };
  const order: Order = {
    id: "order-1",
    customerId: customer.id,
    status: "accepted",
    subtotalCents: 1400,
    taxCents: 123,
    totalCents: 1523,
    notes: null,
    createdAt: now,
    updatedAt: now
  };
  const orderItem: OrderItem = {
    id: "order-item-1",
    orderId: order.id,
    menuItemId: menuItem.id,
    menuItemName: menuItem.name,
    quantity: 1,
    unitPriceCents: menuItem.priceCents,
    lineTotalCents: menuItem.priceCents
  };
  const orderWithItems: OrderWithItems = {
    ...order,
    customer,
    items: [orderItem]
  };
  const settings: OrderingSettings = {
    id: "default",
    prepTimeMinutes: 20,
    autoAccept: false,
    serviceAvailable: true,
    taxRateBps: 875,
    openingHoursJson: "{}",
    updatedAt: now
  };

  return {
    async getOrderingSettings(): Promise<OrderingSettings> {
      return settings;
    },
    async updateOrderingSettings(): Promise<OrderingSettings> {
      return settings;
    },
    async findCustomerById(): Promise<Customer | null> {
      return customer;
    },
    async listCustomers(filters?: { limit?: number }): Promise<CustomerWithStats[]> {
      calls.push({ name: "listCustomers", filters });
      return [
        {
          ...customer,
          orderCount: 1,
          spendCents: order.totalCents,
          recentOrders: [order]
        }
      ];
    },
    async createCustomer(input: CreateCustomerInput): Promise<Customer> {
      calls.push({ name: "createCustomer", filters: input });
      return {
        ...customer,
        id: "customer-2",
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null
      };
    },
    async listMenuCategories(): Promise<MenuCategory[]> {
      return [category];
    },
    async listMenuItems(filters?: { limit?: number }): Promise<MenuItem[]> {
      calls.push({ name: "listMenuItems", filters });
      return [menuItem];
    },
    async findMenuItemsByIds(): Promise<MenuItem[]> {
      return [menuItem];
    },
    async createMenuItem(_input: CreateMenuItemInput): Promise<MenuItem> {
      return menuItem;
    },
    async updateMenuItem(
      _id: string,
      _input: UpdateMenuItemInput
    ): Promise<MenuItem> {
      return menuItem;
    },
    async menuItemHasOrders(): Promise<boolean> {
      return false;
    },
    async deleteMenuItem(): Promise<MenuItem> {
      return menuItem;
    },
    async createOrder(_input: PersistOrderInput): Promise<OrderWithItems> {
      return orderWithItems;
    },
    async listOrders(filters: {
      status?: Order["status"];
      limit?: number;
      createdAtFrom?: Date;
    }): Promise<OrderWithItems[]> {
      calls.push({ name: "listOrders", filters });
      return [orderWithItems];
    },
    async findOrderById(): Promise<OrderWithItems | null> {
      return orderWithItems;
    },
    async updateOrderStatus(): Promise<OrderWithItems> {
      return orderWithItems;
    },
    async getHomeSummary(): Promise<OrderSummary> {
      return {
        totalOrders: 1,
        revenueCents: order.totalCents,
        pendingOrders: 0,
        popularItems: []
      };
    }
  };
}
