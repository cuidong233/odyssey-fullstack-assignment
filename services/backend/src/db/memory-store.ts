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
  categoryBowls: "11111111-1111-4111-8111-111111111111",
  categoryDrinks: "11111111-1111-4111-8111-111111111112",
  categorySides: "11111111-1111-4111-8111-111111111113",
  categorySnacks: "11111111-1111-4111-8111-111111111114",
  categoryDesserts: "11111111-1111-4111-8111-111111111115",
  customerAri: "22222222-2222-4222-8222-222222222220",
  customerMaya: "22222222-2222-4222-8222-222222222221",
  customerNoah: "22222222-2222-4222-8222-222222222222",
  customerAva: "22222222-2222-4222-8222-222222222223",
  customerTheo: "22222222-2222-4222-8222-222222222224",
  customerJordan: "22222222-2222-4222-8222-222222222225",
  customerLina: "22222222-2222-4222-8222-222222222226",
  itemMarketBowl: "33333333-3333-4333-8333-333333333331",
  itemChickenBowl: "33333333-3333-4333-8333-333333333332",
  itemSalmonPlate: "33333333-3333-4333-8333-333333333333",
  itemGingerTea: "33333333-3333-4333-8333-333333333334",
  itemEspressoTonic: "33333333-3333-4333-8333-333333333335",
  itemSoup: "33333333-3333-4333-8333-333333333336",
  itemMushroomBao: "33333333-3333-4333-8333-333333333337",
  itemCucumberSalad: "33333333-3333-4333-8333-333333333338",
  itemChiliNoodles: "33333333-3333-4333-8333-333333333339",
  itemRicePudding: "33333333-3333-4333-8333-333333333340",
  itemBerryShrub: "33333333-3333-4333-8333-333333333341"
} as const;

const menuImageUrls = {
  marketBowl: "/menu-images/market-bowl.png",
  chickenBowl: "/menu-images/charred-chicken-bowl.png",
  salmonPlate: "/menu-images/miso-salmon-plate.png",
  gingerTea: "/menu-images/ginger-lime-tea.png",
  espressoTonic: "/menu-images/espresso-tonic.png",
  soup: "/menu-images/roasted-tomato-soup.png",
  mushroomBao: "/menu-images/crispy-mushroom-bao.png",
  cucumberSalad: "/menu-images/sesame-cucumber-salad.png",
  chiliNoodles: "/menu-images/chili-garlic-noodles.png",
  ricePudding: "/menu-images/coconut-rice-pudding.png",
  berryShrub: "/menu-images/sparkling-berry-shrub.png"
} as const;

type SeedOrderLine = {
  menuItemId: string;
  quantity?: number;
};

type SeedOrderSpec = {
  id: string;
  customerId: string;
  status: OrderStatus;
  items: SeedOrderLine[];
  createdAt: Date;
  notes?: string | null;
};

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
      makeCategory(ids.categoryBowls, "Bowls", 1),
      makeCategory(ids.categoryDrinks, "Drinks", 2),
      makeCategory(ids.categorySides, "Sides", 3),
      makeCategory(ids.categorySnacks, "Snacks", 4),
      makeCategory(ids.categoryDesserts, "Desserts", 5)
    ];

    this.customers = [
      makeCustomer(ids.customerAri, "Ari Chen", "ari@example.test", "(555) 010-1010"),
      makeCustomer(ids.customerMaya, "Maya Patel", "maya@example.test", "(555) 010-1188"),
      makeCustomer(ids.customerNoah, "Noah Patel", "noah@example.test", "(555) 010-2234"),
      makeCustomer(ids.customerAva, "Ava Johnson", "ava@example.test", "(555) 010-7731"),
      makeCustomer(ids.customerTheo, "Theo Morgan", "theo@example.test", "(555) 010-0199"),
      makeCustomer(ids.customerJordan, "Jordan Lee", "jordan@example.test", "(555) 010-7744"),
      makeCustomer(ids.customerLina, "Lina Park", "lina@example.test", "(555) 010-6652")
    ];

    this.menuItems = [
      makeMenuItem(ids.itemMarketBowl, ids.categoryBowls, "Market Bowl", "Grains, greens, seasonal vegetables", menuImageUrls.marketBowl, 1400, true, 1),
      makeMenuItem(ids.itemChickenBowl, ids.categoryBowls, "Charred Chicken Bowl", "Chicken, rice, pickled vegetables, herb sauce", menuImageUrls.chickenBowl, 1650, true, 2),
      makeMenuItem(ids.itemSalmonPlate, ids.categoryBowls, "Miso Salmon Plate", "Salmon, cucumber salad, brown rice, sesame", menuImageUrls.salmonPlate, 1950, true, 3),
      makeMenuItem(ids.itemGingerTea, ids.categoryDrinks, "Ginger Lime Tea", "House brewed tea with lime", menuImageUrls.gingerTea, 450, true, 1),
      makeMenuItem(ids.itemEspressoTonic, ids.categoryDrinks, "Espresso Tonic", "Sparkling tonic with a double espresso", menuImageUrls.espressoTonic, 575, true, 2),
      makeMenuItem(ids.itemSoup, ids.categorySides, "Roasted Tomato Soup", "Currently sold out", menuImageUrls.soup, 900, false, 1),
      makeMenuItem(ids.itemMushroomBao, ids.categorySnacks, "Crispy Mushroom Bao", "Steamed buns, crispy mushrooms, pickles, chili mayo", menuImageUrls.mushroomBao, 1250, true, 1),
      makeMenuItem(ids.itemCucumberSalad, ids.categorySides, "Sesame Cucumber Salad", "Chilled cucumbers, sesame dressing, chili crisp", menuImageUrls.cucumberSalad, 850, true, 2),
      makeMenuItem(ids.itemChiliNoodles, ids.categoryBowls, "Chili Garlic Noodles", "Noodles, chili oil, scallions, jammy egg", menuImageUrls.chiliNoodles, 1550, true, 4),
      makeMenuItem(ids.itemRicePudding, ids.categoryDesserts, "Coconut Rice Pudding", "Coconut rice pudding, mango, toasted coconut", menuImageUrls.ricePudding, 775, true, 1),
      makeMenuItem(ids.itemBerryShrub, ids.categoryDrinks, "Sparkling Berry Shrub", "Berry shrub, citrus, mint, sparkling water", menuImageUrls.berryShrub, 650, true, 3)
    ];

    this.orders = makeSeedOrderSpecs().map((spec) => this.makeOrder(spec));
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

  async menuItemHasOrders(id: string): Promise<boolean> {
    return this.orders.some((order) =>
      order.items.some((item) => item.menuItemId === id)
    );
  }

  async deleteMenuItem(id: string): Promise<MenuItem> {
    const itemIndex = this.menuItems.findIndex((candidate) => candidate.id === id);
    if (itemIndex === -1) {
      throw new DomainError("MENU_ITEM_NOT_FOUND", "Menu item was not found.", 404);
    }

    const [deleted] = this.menuItems.splice(itemIndex, 1);
    if (!deleted) {
      throw new Error("Deleted menu item could not be loaded.");
    }
    return deleted;
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
    return [...orders]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, filters.limit);
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

  private makeOrder(spec: SeedOrderSpec): OrderWithItems {
    const customer = this.customers.find((candidate) => candidate.id === spec.customerId);
    if (!customer) {
      throw new Error(`Seed customer ${spec.customerId} is missing.`);
    }

    const items = spec.items.map((line, index) => {
      const menuItem = this.menuItems.find((candidate) => candidate.id === line.menuItemId);
      if (!menuItem) {
        throw new Error(`Seed menu item ${line.menuItemId} is missing.`);
      }
      const quantity = line.quantity ?? 1;
      return {
        id: `${spec.id}-item-${index + 1}`,
        orderId: spec.id,
        menuItemId: line.menuItemId,
        menuItemName: menuItem.name,
        quantity,
        unitPriceCents: menuItem.priceCents,
        lineTotalCents: menuItem.priceCents * quantity
      };
    });
    const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
    const taxCents = Math.round((subtotalCents * this.settings.taxRateBps) / 10_000);

    return {
      id: spec.id,
      customerId: spec.customerId,
      status: spec.status,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      notes: spec.notes ?? null,
      createdAt: spec.createdAt,
      updatedAt: spec.createdAt,
      customer,
      items
    };
  }
}

function makeSeedOrderSpecs(): SeedOrderSpec[] {
  const customersByIndex = [
    ids.customerAri,
    ids.customerMaya,
    ids.customerNoah,
    ids.customerAva,
    ids.customerTheo,
    ids.customerJordan,
    ids.customerLina
  ];
  const statuses: OrderStatus[] = [
    "completed",
    "completed",
    "completed",
    "ready",
    "preparing",
    "accepted",
    "pending",
    "completed",
    "preparing",
    "ready",
    "accepted",
    "pending",
    "completed",
    "completed",
    "cancelled",
    "preparing",
    "ready",
    "accepted",
    "pending",
    "completed",
    "completed",
    "preparing",
    "ready",
    "completed",
    "accepted",
    "pending",
    "completed",
    "completed",
    "preparing",
    "ready"
  ];
  const itemSets: SeedOrderLine[][] = [
    [{ menuItemId: ids.itemMarketBowl }, { menuItemId: ids.itemGingerTea }],
    [{ menuItemId: ids.itemChickenBowl, quantity: 2 }, { menuItemId: ids.itemBerryShrub }],
    [{ menuItemId: ids.itemSalmonPlate }, { menuItemId: ids.itemCucumberSalad }],
    [{ menuItemId: ids.itemChiliNoodles }, { menuItemId: ids.itemEspressoTonic }],
    [{ menuItemId: ids.itemMushroomBao }, { menuItemId: ids.itemGingerTea, quantity: 2 }],
    [{ menuItemId: ids.itemRicePudding, quantity: 2 }, { menuItemId: ids.itemBerryShrub }],
    [{ menuItemId: ids.itemMarketBowl }, { menuItemId: ids.itemMushroomBao }],
    [{ menuItemId: ids.itemChickenBowl }, { menuItemId: ids.itemCucumberSalad }, { menuItemId: ids.itemGingerTea }],
    [{ menuItemId: ids.itemSalmonPlate }, { menuItemId: ids.itemEspressoTonic }],
    [{ menuItemId: ids.itemChiliNoodles, quantity: 2 }],
    [{ menuItemId: ids.itemMushroomBao }, { menuItemId: ids.itemRicePudding }],
    [{ menuItemId: ids.itemMarketBowl }, { menuItemId: ids.itemBerryShrub }],
    [{ menuItemId: ids.itemChickenBowl }, { menuItemId: ids.itemGingerTea }],
    [{ menuItemId: ids.itemSalmonPlate }, { menuItemId: ids.itemMushroomBao }],
    [{ menuItemId: ids.itemCucumberSalad }, { menuItemId: ids.itemBerryShrub }],
    [{ menuItemId: ids.itemChiliNoodles }, { menuItemId: ids.itemRicePudding }],
    [{ menuItemId: ids.itemMarketBowl, quantity: 2 }, { menuItemId: ids.itemEspressoTonic }],
    [{ menuItemId: ids.itemChickenBowl }, { menuItemId: ids.itemMushroomBao }],
    [{ menuItemId: ids.itemSalmonPlate }, { menuItemId: ids.itemGingerTea }],
    [{ menuItemId: ids.itemChiliNoodles }, { menuItemId: ids.itemCucumberSalad }],
    [{ menuItemId: ids.itemMushroomBao, quantity: 2 }, { menuItemId: ids.itemBerryShrub }],
    [{ menuItemId: ids.itemMarketBowl }, { menuItemId: ids.itemRicePudding }],
    [{ menuItemId: ids.itemChickenBowl }, { menuItemId: ids.itemEspressoTonic }],
    [{ menuItemId: ids.itemSalmonPlate }, { menuItemId: ids.itemBerryShrub }],
    [{ menuItemId: ids.itemChiliNoodles }, { menuItemId: ids.itemGingerTea }],
    [{ menuItemId: ids.itemMarketBowl }, { menuItemId: ids.itemCucumberSalad }],
    [{ menuItemId: ids.itemChickenBowl, quantity: 2 }, { menuItemId: ids.itemRicePudding }],
    [{ menuItemId: ids.itemMushroomBao }, { menuItemId: ids.itemEspressoTonic }],
    [{ menuItemId: ids.itemSalmonPlate }, { menuItemId: ids.itemGingerTea, quantity: 2 }],
    [{ menuItemId: ids.itemChiliNoodles }, { menuItemId: ids.itemBerryShrub }]
  ];

  return itemSets.map((items, index) => ({
    id: `44444444-4444-4444-8444-44444444${String(1100 + index).padStart(4, "0")}`,
    customerId: customersByIndex[index % customersByIndex.length]!,
    status: statuses[index]!,
    items,
    createdAt: new Date(`2026-05-22T${String(10 + Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 14 + 3).padStart(2, "0")}:00.000Z`),
    notes: index % 6 === 0 ? "Guest asked for utensils." : null
  }));
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
  description: string,
  imageUrl: string,
  priceCents: number,
  available: boolean,
  sortOrder: number
): MenuItem {
  return {
    id,
    categoryId,
    name,
    description,
    imageUrl,
    priceCents,
    available,
    sortOrder,
    createdAt: now,
    updatedAt: now
  };
}
