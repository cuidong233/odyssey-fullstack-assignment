import { createDb } from "../db/client.ts";
import {
  customers,
  menuCategories,
  menuItems,
  orderItems,
  orderingSettings,
  orders
} from "../db/schema.ts";
import "dotenv/config";

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

const [bowls, drinks, sides, snacks, desserts] = await db
  .insert(menuCategories)
  .values([
    { name: "Bowls", sortOrder: 1 },
    { name: "Drinks", sortOrder: 2 },
    { name: "Sides", sortOrder: 3 },
    { name: "Snacks", sortOrder: 4 },
    { name: "Desserts", sortOrder: 5 }
  ])
  .returning();

if (!bowls || !drinks || !sides || !snacks || !desserts) {
  throw new Error("Failed to seed menu categories.");
}

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
};

const [
  marketBowl,
  chickenBowl,
  salmonPlate,
  gingerTea,
  espressoTonic,
  soup,
  mushroomBao,
  cucumberSalad,
  chiliNoodles,
  ricePudding,
  berryShrub
] = await db
  .insert(menuItems)
  .values([
    {
      categoryId: bowls.id,
      name: "Market Bowl",
      description: "Grains, greens, seasonal vegetables",
      imageUrl: menuImageUrls.marketBowl,
      priceCents: 1400,
      available: true,
      sortOrder: 1
    },
    {
      categoryId: bowls.id,
      name: "Charred Chicken Bowl",
      description: "Chicken, rice, pickled vegetables, herb sauce",
      imageUrl: menuImageUrls.chickenBowl,
      priceCents: 1650,
      available: true,
      sortOrder: 2
    },
    {
      categoryId: bowls.id,
      name: "Miso Salmon Plate",
      description: "Salmon, cucumber salad, brown rice, sesame",
      imageUrl: menuImageUrls.salmonPlate,
      priceCents: 1950,
      available: true,
      sortOrder: 3
    },
    {
      categoryId: drinks.id,
      name: "Ginger Lime Tea",
      description: "House brewed tea with lime",
      imageUrl: menuImageUrls.gingerTea,
      priceCents: 450,
      available: true,
      sortOrder: 1
    },
    {
      categoryId: drinks.id,
      name: "Espresso Tonic",
      description: "Sparkling tonic with a double espresso",
      imageUrl: menuImageUrls.espressoTonic,
      priceCents: 575,
      available: true,
      sortOrder: 2
    },
    {
      categoryId: sides.id,
      name: "Roasted Tomato Soup",
      description: "Currently sold out",
      imageUrl: menuImageUrls.soup,
      priceCents: 900,
      available: false,
      sortOrder: 1
    },
    {
      categoryId: snacks.id,
      name: "Crispy Mushroom Bao",
      description: "Steamed buns, crispy mushrooms, pickles, chili mayo",
      imageUrl: menuImageUrls.mushroomBao,
      priceCents: 1250,
      available: true,
      sortOrder: 1
    },
    {
      categoryId: sides.id,
      name: "Sesame Cucumber Salad",
      description: "Chilled cucumbers, sesame dressing, chili crisp",
      imageUrl: menuImageUrls.cucumberSalad,
      priceCents: 850,
      available: true,
      sortOrder: 2
    },
    {
      categoryId: bowls.id,
      name: "Chili Garlic Noodles",
      description: "Noodles, chili oil, scallions, jammy egg",
      imageUrl: menuImageUrls.chiliNoodles,
      priceCents: 1550,
      available: true,
      sortOrder: 4
    },
    {
      categoryId: desserts.id,
      name: "Coconut Rice Pudding",
      description: "Coconut rice pudding, mango, toasted coconut",
      imageUrl: menuImageUrls.ricePudding,
      priceCents: 775,
      available: true,
      sortOrder: 1
    },
    {
      categoryId: drinks.id,
      name: "Sparkling Berry Shrub",
      description: "Berry shrub, citrus, mint, sparkling water",
      imageUrl: menuImageUrls.berryShrub,
      priceCents: 650,
      available: true,
      sortOrder: 3
    }
  ])
  .returning();

if (
  !marketBowl ||
  !chickenBowl ||
  !salmonPlate ||
  !gingerTea ||
  !espressoTonic ||
  !soup ||
  !mushroomBao ||
  !cucumberSalad ||
  !chiliNoodles ||
  !ricePudding ||
  !berryShrub
) {
  throw new Error("Failed to seed menu items.");
}

const [ari, maya, theo] = await db
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
    },
    {
      name: "Theo Morgan",
      email: "theo@example.com",
      phone: "555-0199"
    }
  ])
  .returning();

if (!ari || !maya || !theo) {
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

const seededOrders = [
  {
    customer: ari,
    status: "accepted",
    notes: "No cilantro.",
    items: [
      { item: marketBowl, quantity: 1 },
      { item: gingerTea, quantity: 1 }
    ]
  },
  {
    customer: maya,
    status: "preparing",
    notes: "Pickup at 12:40.",
    items: [
      { item: chickenBowl, quantity: 2 },
      { item: espressoTonic, quantity: 2 },
      { item: mushroomBao, quantity: 1 }
    ]
  },
  {
    customer: theo,
    status: "pending",
    notes: "First-time customer.",
    items: [
      { item: salmonPlate, quantity: 1 },
      { item: marketBowl, quantity: 1 },
      { item: cucumberSalad, quantity: 1 }
    ]
  },
  {
    customer: ari,
    status: "completed",
    notes: null,
    items: [
      { item: chickenBowl, quantity: 1 },
      { item: gingerTea, quantity: 2 },
      { item: ricePudding, quantity: 1 }
    ]
  },
  {
    customer: maya,
    status: "ready",
    notes: "Extra scallions.",
    items: [
      { item: chiliNoodles, quantity: 1 },
      { item: berryShrub, quantity: 1 }
    ]
  }
];

for (const seededOrder of seededOrders) {
  const subtotalCents = seededOrder.items.reduce(
    (total, line) => total + line.item.priceCents * line.quantity,
    0
  );
  const taxCents = Math.round((subtotalCents * 875) / 10_000);
  const [order] = await db
    .insert(orders)
    .values({
      customerId: seededOrder.customer.id,
      status: seededOrder.status,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      notes: seededOrder.notes
    })
    .returning();

  if (!order) {
    throw new Error("Failed to seed order.");
  }

  await db.insert(orderItems).values(
    seededOrder.items.map((line) => ({
      orderId: order.id,
      menuItemId: line.item.id,
      menuItemName: line.item.name,
      quantity: line.quantity,
      unitPriceCents: line.item.priceCents,
      lineTotalCents: line.item.priceCents * line.quantity
    }))
  );
}

console.log("Seeded restaurant operations data.");
