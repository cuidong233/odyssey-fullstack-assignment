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

const [ari, maya, noah, ava, theo, jordan, lina] = await db
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
      name: "Noah Patel",
      email: "noah@example.com",
      phone: "555-0223"
    },
    {
      name: "Ava Johnson",
      email: "ava@example.com",
      phone: "555-0773"
    },
    {
      name: "Theo Morgan",
      email: "theo@example.com",
      phone: "555-0199"
    },
    {
      name: "Jordan Lee",
      email: "jordan@example.com",
      phone: "555-7744"
    },
    {
      name: "Lina Park",
      email: "lina@example.com",
      phone: "555-6652"
    }
  ])
  .returning();

if (!ari || !maya || !noah || !ava || !theo || !jordan || !lina) {
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

const seededOrders = buildSeededOrders({
  customers: [ari, maya, noah, ava, theo, jordan, lina],
  items: {
    marketBowl,
    chickenBowl,
    salmonPlate,
    gingerTea,
    espressoTonic,
    mushroomBao,
    cucumberSalad,
    chiliNoodles,
    ricePudding,
    berryShrub
  }
});

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
      notes: seededOrder.notes,
      createdAt: seededOrder.createdAt,
      updatedAt: seededOrder.createdAt
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

function buildSeededOrders({ customers, items }) {
  const statuses = [
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
  const itemSets = [
    [{ item: items.marketBowl }, { item: items.gingerTea }],
    [{ item: items.chickenBowl, quantity: 2 }, { item: items.berryShrub }],
    [{ item: items.salmonPlate }, { item: items.cucumberSalad }],
    [{ item: items.chiliNoodles }, { item: items.espressoTonic }],
    [{ item: items.mushroomBao }, { item: items.gingerTea, quantity: 2 }],
    [{ item: items.ricePudding, quantity: 2 }, { item: items.berryShrub }],
    [{ item: items.marketBowl }, { item: items.mushroomBao }],
    [{ item: items.chickenBowl }, { item: items.cucumberSalad }, { item: items.gingerTea }],
    [{ item: items.salmonPlate }, { item: items.espressoTonic }],
    [{ item: items.chiliNoodles, quantity: 2 }],
    [{ item: items.mushroomBao }, { item: items.ricePudding }],
    [{ item: items.marketBowl }, { item: items.berryShrub }],
    [{ item: items.chickenBowl }, { item: items.gingerTea }],
    [{ item: items.salmonPlate }, { item: items.mushroomBao }],
    [{ item: items.cucumberSalad }, { item: items.berryShrub }],
    [{ item: items.chiliNoodles }, { item: items.ricePudding }],
    [{ item: items.marketBowl, quantity: 2 }, { item: items.espressoTonic }],
    [{ item: items.chickenBowl }, { item: items.mushroomBao }],
    [{ item: items.salmonPlate }, { item: items.gingerTea }],
    [{ item: items.chiliNoodles }, { item: items.cucumberSalad }],
    [{ item: items.mushroomBao, quantity: 2 }, { item: items.berryShrub }],
    [{ item: items.marketBowl }, { item: items.ricePudding }],
    [{ item: items.chickenBowl }, { item: items.espressoTonic }],
    [{ item: items.salmonPlate }, { item: items.berryShrub }],
    [{ item: items.chiliNoodles }, { item: items.gingerTea }],
    [{ item: items.marketBowl }, { item: items.cucumberSalad }],
    [{ item: items.chickenBowl, quantity: 2 }, { item: items.ricePudding }],
    [{ item: items.mushroomBao }, { item: items.espressoTonic }],
    [{ item: items.salmonPlate }, { item: items.gingerTea, quantity: 2 }],
    [{ item: items.chiliNoodles }, { item: items.berryShrub }]
  ];

  return Array.from({ length: 90 }, (_, index) => {
    const lines = itemSets[index % itemSets.length];
    return {
      customer: customers[index % customers.length],
      status: statuses[index % statuses.length],
      notes: index % 6 === 0 ? "Guest asked for utensils." : null,
      createdAt: seededOrderDate(index),
      items: lines.map((line) => ({
        item: line.item,
        quantity: line.quantity ?? 1
      }))
    };
  });
}

function seededOrderDate(index) {
  const date = new Date();
  date.setUTCHours(10 + (index % 8), (index % 4) * 14 + 3, 0, 0);
  if (index >= 12) {
    date.setUTCDate(date.getUTCDate() - (1 + Math.floor((index - 12) / 3)));
  }
  return date;
}
