import { writeFile } from "node:fs/promises";
import { createApp } from "../src/app.ts";

const fail = async () => {
  throw new Error("OpenAPI generation does not call the store.");
};

const app = createApp({
  store: {
    getOrderingSettings: fail,
    updateOrderingSettings: fail,
    findCustomerById: fail,
    listCustomers: fail,
    listMenuCategories: fail,
    listMenuItems: fail,
    findMenuItemsByIds: fail,
    createMenuItem: fail,
    updateMenuItem: fail,
    createOrder: fail,
    listOrders: fail,
    findOrderById: fail,
    updateOrderStatus: fail,
    getHomeSummary: fail
  }
});

const document = app.getOpenAPIDocument({
  openapi: "3.0.0",
  info: {
    title: "Odyssey Restaurant Operations API",
    version: "0.1.0"
  }
});

await writeFile("openapi.json", `${JSON.stringify(document, null, 2)}\n`);
