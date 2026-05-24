import { and, desc, eq, gte, inArray, type SQL } from "drizzle-orm";
import type { AppDb } from "./client";
import {
  customers,
  menuCategories,
  menuItems,
  orderItems,
  orderingSettings,
  orders,
  type Customer,
  type MenuItem,
  type OrderingSettings,
  type Order,
  type OrderItem,
  type OrderStatus
} from "./schema";
import { DomainError } from "../domain/errors";
import type {
  CreateCustomerInput,
  CreateMenuItemInput,
  CustomerWithStats,
  OrderSummary,
  OrderWithItems,
  PersistOrderInput,
  RestaurantStore,
  UpdateCustomerInput,
  UpdateMenuItemInput
} from "../domain/order-service";

export class DrizzleRestaurantStore implements RestaurantStore {
  constructor(private readonly db: AppDb) {}

  async getOrderingSettings(): Promise<OrderingSettings> {
    const [existing] = await this.db.select().from(orderingSettings).limit(1);
    if (existing) {
      return existing;
    }

    const [created] = await this.db
      .insert(orderingSettings)
      .values({ id: "default" })
      .returning();
    if (!created) {
      throw new Error("Failed to create default ordering settings.");
    }
    return created;
  }

  async updateOrderingSettings(
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
  ): Promise<OrderingSettings> {
    const [settings] = await this.db
      .insert(orderingSettings)
      .values({ id: "default", ...input, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: orderingSettings.id,
        set: { ...input, updatedAt: new Date() }
      })
      .returning();
    if (!settings) {
      throw new Error("Failed to update ordering settings.");
    }
    return settings;
  }

  async findCustomerById(id: string): Promise<Customer | null> {
    const [customer] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);
    return customer ?? null;
  }

  async listCustomers(filters: { limit?: number } = {}): Promise<CustomerWithStats[]> {
    const [customerRows, orderRows] = await Promise.all([
      filters.limit !== undefined
        ? this.db
            .select()
            .from(customers)
            .orderBy(desc(customers.createdAt))
            .limit(filters.limit)
        : this.db.select().from(customers).orderBy(desc(customers.createdAt)),
      this.db.select().from(orders).orderBy(desc(orders.createdAt))
    ]);

    return customerRows.map((customer) => {
      const customerOrders = orderRows.filter(
        (order) => order.customerId === customer.id
      );
      return {
        ...customer,
        orderCount: customerOrders.length,
        spendCents: customerOrders.reduce(
          (total, order) => total + order.totalCents,
          0
        ),
        recentOrders: customerOrders.slice(0, 5)
      };
    });
  }

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const [customer] = await this.db
      .insert(customers)
      .values({
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null
      })
      .returning();
    if (!customer) {
      throw new Error("Failed to create customer.");
    }
    return customer;
  }

  async updateCustomer(
    id: string,
    input: UpdateCustomerInput
  ): Promise<Customer> {
    const [customer] = await this.db
      .update(customers)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    if (!customer) {
      throw new DomainError("CUSTOMER_NOT_FOUND", "Customer was not found.", 404);
    }
    return customer;
  }

  async listMenuCategories() {
    return this.db.select().from(menuCategories).orderBy(menuCategories.sortOrder);
  }

  async listMenuItems(filters: { limit?: number } = {}): Promise<MenuItem[]> {
    if (filters.limit !== undefined) {
      return this.db
        .select()
        .from(menuItems)
        .orderBy(menuItems.sortOrder)
        .limit(filters.limit);
    }

    return this.db.select().from(menuItems).orderBy(menuItems.sortOrder);
  }

  async findMenuItemsByIds(ids: string[]): Promise<MenuItem[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.db.select().from(menuItems).where(inArray(menuItems.id, ids));
  }

  async createMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
    const [item] = await this.db.insert(menuItems).values(input).returning();
    if (!item) {
      throw new Error("Failed to create menu item.");
    }
    return item;
  }

  async updateMenuItem(
    id: string,
    input: UpdateMenuItemInput
  ): Promise<MenuItem> {
    const [item] = await this.db
      .update(menuItems)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();
    if (!item) {
      throw new DomainError("MENU_ITEM_NOT_FOUND", "Menu item was not found.", 404);
    }
    return item;
  }

  async menuItemHasOrders(id: string): Promise<boolean> {
    const [orderItem] = await this.db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.menuItemId, id))
      .limit(1);
    return Boolean(orderItem);
  }

  async deleteMenuItem(id: string): Promise<MenuItem> {
    const [item] = await this.db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning();
    if (!item) {
      throw new DomainError("MENU_ITEM_NOT_FOUND", "Menu item was not found.", 404);
    }
    return item;
  }

  async createOrder(input: PersistOrderInput): Promise<OrderWithItems> {
    const [order] = await this.db
      .insert(orders)
      .values({
        customerId: input.customerId,
        status: input.status,
        subtotalCents: input.subtotalCents,
        taxCents: input.taxCents,
        totalCents: input.totalCents,
        notes: input.notes
      })
      .returning();
    if (!order) {
      throw new Error("Failed to create order.");
    }

    await this.db.insert(orderItems).values(
      input.items.map((item) => ({
        ...item,
        orderId: order.id
      }))
    );

    const created = await this.findOrderById(order.id);
    if (!created) {
      throw new Error("Created order could not be loaded.");
    }
    return created;
  }

  async listOrders(filters: {
    status?: OrderStatus;
    limit?: number;
    createdAtFrom?: Date;
  }): Promise<OrderWithItems[]> {
    const conditions: SQL[] = [];
    if (filters.status) {
      conditions.push(eq(orders.status, filters.status));
    }
    if (filters.createdAtFrom) {
      conditions.push(gte(orders.createdAt, filters.createdAtFrom));
    }

    const query = this.db
      .select()
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt));
    const orderRows =
      filters.limit !== undefined ? await query.limit(filters.limit) : await query;

    return this.hydrateOrders(orderRows);
  }

  async findOrderById(id: string): Promise<OrderWithItems | null> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (!order) {
      return null;
    }

    const [hydrated] = await this.hydrateOrders([order]);
    return hydrated ?? null;
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus
  ): Promise<OrderWithItems> {
    const [order] = await this.db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    if (!order) {
      throw new DomainError("ORDER_NOT_FOUND", "Order was not found.", 404);
    }

    const [hydrated] = await this.hydrateOrders([order]);
    if (!hydrated) {
      throw new Error("Updated order could not be loaded.");
    }
    return hydrated;
  }

  async getHomeSummary(filters: { createdAtFrom?: Date } = {}): Promise<OrderSummary> {
    const allOrders = await this.listOrders(filters);
    const completedOrders = allOrders.filter(
      (order) => order.status !== "cancelled"
    );
    const itemQuantities = new Map<
      string,
      { menuItemId: string; name: string; quantity: number }
    >();

    for (const order of completedOrders) {
      for (const item of order.items) {
        const existing = itemQuantities.get(item.menuItemId);
        itemQuantities.set(item.menuItemId, {
          menuItemId: item.menuItemId,
          name: item.menuItemName,
          quantity: (existing?.quantity ?? 0) + item.quantity
        });
      }
    }

    return {
      totalOrders: allOrders.length,
      revenueCents: completedOrders.reduce(
        (total, order) => total + order.totalCents,
        0
      ),
      pendingOrders: allOrders.filter((order) => order.status === "pending")
        .length,
      popularItems: [...itemQuantities.values()]
        .sort((left, right) => right.quantity - left.quantity)
        .slice(0, 5)
    };
  }

  private async hydrateOrders(orderRows: Order[]): Promise<OrderWithItems[]> {
    if (orderRows.length === 0) {
      return [];
    }

    const customerIds = [...new Set(orderRows.map((order) => order.customerId))];
    const orderIds = orderRows.map((order) => order.id);
    const [customerRows, itemRows] = await Promise.all([
      this.db.select().from(customers).where(inArray(customers.id, customerIds)),
      this.db
        .select()
        .from(orderItems)
        .where(and(inArray(orderItems.orderId, orderIds)))
    ]);

    const customersById = new Map(
      customerRows.map((customer) => [customer.id, customer])
    );
    const itemsByOrderId = new Map<string, OrderItem[]>();
    for (const item of itemRows) {
      const currentItems = itemsByOrderId.get(item.orderId) ?? [];
      currentItems.push(item);
      itemsByOrderId.set(item.orderId, currentItems);
    }

    return orderRows.map((order) => {
      const customer = customersById.get(order.customerId);
      if (!customer) {
        throw new Error(`Customer ${order.customerId} was not found.`);
      }

      return {
        ...order,
        customer,
        items: itemsByOrderId.get(order.id) ?? []
      };
    });
  }
}
