import { createDb } from "../db/client.ts";
import {
  customers,
  menuCategories,
  menuItems,
  orderItems,
  orderingSettings,
  orders
} from "../db/schema.ts";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the backend.");
}

const db = createDb(databaseUrl);

await db.delete(orderItems);
await db.delete(orders);
await db.delete(menuItems);
await db.delete(menuCategories);
await db.delete(customers);
await db.delete(orderingSettings);

const [bowls, drinks, sides] = await db
  .insert(menuCategories)
  .values([
    { name: "Bowls", sortOrder: 1 },
    { name: "Drinks", sortOrder: 2 },
    { name: "Sides", sortOrder: 3 }
  ])
  .returning();

if (!bowls || !drinks || !sides) {
  throw new Error("Failed to seed menu categories.");
}

const [marketBowl, chickenBowl, gingerTea, soup] = await db
  .insert(menuItems)
  .values([
    {
      categoryId: bowls.id,
      name: "Market Bowl",
      description: "Grains, greens, seasonal vegetables",
      priceCents: 1400,
      available: true,
      sortOrder: 1
    },
    {
      categoryId: bowls.id,
      name: "Charred Chicken Bowl",
      description: "Chicken, rice, pickled vegetables, herb sauce",
      priceCents: 1650,
      available: true,
      sortOrder: 2
    },
    {
      categoryId: drinks.id,
      name: "Ginger Lime Tea",
      description: "House brewed tea with lime",
      priceCents: 450,
      available: true,
      sortOrder: 1
    },
    {
      categoryId: sides.id,
      name: "Roasted Tomato Soup",
      description: "Currently sold out",
      priceCents: 900,
      available: false,
      sortOrder: 1
    }
  ])
  .returning();

if (!marketBowl || !chickenBowl || !gingerTea || !soup) {
  throw new Error("Failed to seed menu items.");
}

const [ari, maya] = await db
  .insert(customers)
  .values([
    {
      name: "Ari Chen",
      email: "ari@example.com",
      phone: "555-0101"
    },
    {
      name: "Maya Patel",
      email: "maya@example.com",
      phone: "555-0118"
    }
  ])
  .returning();

if (!ari || !maya) {
  throw new Error("Failed to seed customers.");
}

await db.insert(orderingSettings).values({
  id: "default",
  prepTimeMinutes: 18,
  autoAccept: false,
  serviceAvailable: true,
  taxRateBps: 875,
  openingHoursJson: JSON.stringify({
    monday: ["10:00", "21:00"],
    tuesday: ["10:00", "21:00"],
    wednesday: ["10:00", "21:00"],
    thursday: ["10:00", "21:00"],
    friday: ["10:00", "22:00"],
    saturday: ["11:00", "22:00"],
    sunday: ["11:00", "20:00"]
  })
});

const subtotalCents = marketBowl.priceCents + gingerTea.priceCents;
const taxCents = Math.round((subtotalCents * 875) / 10_000);
const [order] = await db
  .insert(orders)
  .values({
    customerId: ari.id,
    status: "accepted",
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
    notes: "No cilantro."
  })
  .returning();

if (!order) {
  throw new Error("Failed to seed order.");
}

await db.insert(orderItems).values([
  {
    orderId: order.id,
    menuItemId: marketBowl.id,
    menuItemName: marketBowl.name,
    quantity: 1,
    unitPriceCents: marketBowl.priceCents,
    lineTotalCents: marketBowl.priceCents
  },
  {
    orderId: order.id,
    menuItemId: gingerTea.id,
    menuItemName: gingerTea.name,
    quantity: 1,
    unitPriceCents: gingerTea.priceCents,
    lineTotalCents: gingerTea.priceCents
  }
]);

console.log("Seeded restaurant operations data.");
