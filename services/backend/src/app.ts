import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { createDb } from "./db/client";
import { DrizzleRestaurantStore } from "./db/drizzle-store";
import { createSeededMemoryStore } from "./db/memory-store";
import type { RestaurantStore } from "./domain/order-service";
import {
  createMenuItemRoute,
  deleteMenuItemRoute,
  createOrderRoute,
  getOrderRoute,
  getSettingsRoute,
  handlers,
  healthRoute,
  homeSummaryRoute,
  listCustomersRoute,
  listMenuCategoriesRoute,
  listMenuRoute,
  listOrdersRoute,
  toErrorResponse,
  updateMenuItemRoute,
  updateOrderStatusRoute,
  updateSettingsRoute,
  type AppVariables
} from "./http/routes";

export type AppBindings = {
  DATABASE_URL?: string;
};

export type AppEnv = {
  Bindings: AppBindings;
  Variables: AppVariables;
};

export type CreateAppOptions = {
  store?: RestaurantStore;
};

export function createApp(options: CreateAppOptions = {}) {
  let memoryStore: RestaurantStore | undefined;
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => {
      if (result.success) {
        return;
      }

      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.message
          }
        },
        400
      );
    }
  });

  app.use("*", cors());
  app.onError((error, c) => {
    const response = toErrorResponse(error);
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: {
        "content-type": "application/json"
      }
    });
  });

  app.use("*", async (c, next) => {
    if (options.store) {
      c.set("store", options.store);
      await next();
      return;
    }

    const databaseUrl = c.env?.DATABASE_URL;
    if (!databaseUrl) {
      return c.json(
        {
          error: {
            code: "DATABASE_URL_MISSING",
            message: "DATABASE_URL binding is required."
          }
        },
        500
      );
    }

    if (databaseUrl === "memory://seed") {
      memoryStore ??= createSeededMemoryStore();
      c.set("store", memoryStore);
      await next();
      return;
    }

    c.set("store", new DrizzleRestaurantStore(createDb(databaseUrl)));
    await next();
  });

  app.openapi(healthRoute, (c) => c.json(handlers.health(), 200));

  app.openapi(homeSummaryRoute, async (c) =>
    c.json(
      await handlers.homeSummary(c.get("store"), c.req.valid("query")),
      200
    )
  );

  app.openapi(listMenuCategoriesRoute, async (c) =>
    c.json(await handlers.listMenuCategories(c.get("store")), 200)
  );

  app.openapi(listMenuRoute, async (c) =>
    c.json(await handlers.listMenu(c.get("store"), c.req.valid("query")), 200)
  );

  app.openapi(createMenuItemRoute, async (c) =>
    c.json(
      await handlers.createMenuItem(
        c.get("store"),
        c.req.valid("json") as Parameters<typeof handlers.createMenuItem>[1]
      ),
      201
    )
  );

  app.openapi(updateMenuItemRoute, async (c) =>
    c.json(
      await handlers.updateMenuItem(
        c.get("store"),
        c.req.valid("param").id,
        c.req.valid("json") as Parameters<typeof handlers.updateMenuItem>[2]
      ),
      200
    )
  );

  app.openapi(deleteMenuItemRoute, async (c) =>
    c.json(
      await handlers.deleteMenuItem(c.get("store"), c.req.valid("param").id),
      200
    )
  );

  app.openapi(listOrdersRoute, async (c) =>
    c.json(await handlers.listOrders(c.get("store"), c.req.valid("query")), 200)
  );

  app.openapi(createOrderRoute, async (c) =>
    c.json(
      await handlers.createOrder(
        c.get("store"),
        c.req.valid("json") as Parameters<typeof handlers.createOrder>[1]
      ),
      201
    )
  );

  app.openapi(getOrderRoute, async (c) =>
    c.json(
      await handlers.getOrder(c.get("store"), c.req.valid("param").id),
      200
    )
  );

  app.openapi(updateOrderStatusRoute, async (c) =>
    c.json(
      await handlers.updateOrderStatus(
        c.get("store"),
        c.req.valid("param").id,
        c.req.valid("json") as Parameters<typeof handlers.updateOrderStatus>[2]
      ),
      200
    )
  );

  app.openapi(listCustomersRoute, async (c) =>
    c.json(
      await handlers.listCustomers(c.get("store"), c.req.valid("query")),
      200
    )
  );

  app.openapi(getSettingsRoute, async (c) =>
    c.json(await handlers.getSettings(c.get("store")), 200)
  );

  app.openapi(updateSettingsRoute, async (c) =>
    c.json(
      await handlers.updateSettings(
        c.get("store"),
        c.req.valid("json") as Parameters<typeof handlers.updateSettings>[1]
      ),
      200
    )
  );

  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
      title: "Odyssey Restaurant Operations API",
      version: "0.1.0"
    }
  });

  return app;
}
