import { createRoute } from "@hono/zod-openapi";
import { z } from "zod/v4";
import { DomainError } from "../domain/errors";
import {
  createOrder,
  type CreateMenuItemInput,
  type CreateOrderInput,
  type RestaurantStore,
  type UpdateMenuItemInput,
  updateOrderStatus
} from "../domain/order-service";
import {
  createMenuItemRequestSchema,
  createOrderRequestSchema,
  customerWithStatsResponseSchema,
  errorResponseSchema,
  homeSummaryResponseSchema,
  idParamSchema,
  menuCategoryResponseSchema,
  menuItemResponseSchema,
  orderingSettingsResponseSchema,
  orderResponseSchema,
  orderStatusQuerySchema,
  updateMenuItemRequestSchema,
  updateOrderingSettingsRequestSchema,
  updateOrderStatusRequestSchema
} from "./schemas";
import {
  serializeCustomerWithStats,
  serializeHomeSummary,
  serializeMenuCategory,
  serializeMenuItem,
  serializeOrderWithItems,
  serializeOrderingSettings
} from "./serializers";

export type AppVariables = {
  store: RestaurantStore;
};

function jsonContent<TSchema extends z.ZodType>(
  schema: TSchema,
  description: string
) {
  return {
    content: {
      "application/json": {
        schema
      }
    },
    description
  };
}

export const healthRoute = createRoute({
  operationId: "getHealth",
  tags: ["system"],
  method: "get",
  path: "/health",
  responses: {
    200: jsonContent(
      z.object({ ok: z.boolean(), service: z.string() }),
      "Service health"
    )
  }
});

export const homeSummaryRoute = createRoute({
  operationId: "getHomeSummary",
  tags: ["home"],
  method: "get",
  path: "/home/summary",
  responses: {
    200: jsonContent(homeSummaryResponseSchema, "Dashboard summary")
  }
});

export const listMenuCategoriesRoute = createRoute({
  operationId: "listMenuCategories",
  tags: ["menu"],
  method: "get",
  path: "/menu/categories",
  responses: {
    200: jsonContent(z.array(menuCategoryResponseSchema), "Menu categories")
  }
});

export const listMenuRoute = createRoute({
  operationId: "listMenuItems",
  tags: ["menu"],
  method: "get",
  path: "/menu/items",
  responses: {
    200: jsonContent(z.array(menuItemResponseSchema), "Menu items")
  }
});

export const createMenuItemRoute = createRoute({
  operationId: "createMenuItem",
  tags: ["menu"],
  method: "post",
  path: "/menu/items",
  request: {
    body: jsonContent(createMenuItemRequestSchema, "Menu item payload")
  },
  responses: {
    201: jsonContent(menuItemResponseSchema, "Created menu item"),
    400: jsonContent(errorResponseSchema, "Validation error")
  }
});

export const updateMenuItemRoute = createRoute({
  operationId: "updateMenuItem",
  tags: ["menu"],
  method: "patch",
  path: "/menu/items/{id}",
  request: {
    params: idParamSchema,
    body: jsonContent(updateMenuItemRequestSchema, "Menu item update payload")
  },
  responses: {
    200: jsonContent(menuItemResponseSchema, "Updated menu item"),
    404: jsonContent(errorResponseSchema, "Menu item not found")
  }
});

export const listOrdersRoute = createRoute({
  operationId: "listOrders",
  tags: ["orders"],
  method: "get",
  path: "/orders",
  request: {
    query: orderStatusQuerySchema
  },
  responses: {
    200: jsonContent(z.array(orderResponseSchema), "Orders")
  }
});

export const createOrderRoute = createRoute({
  operationId: "createOrder",
  tags: ["orders"],
  method: "post",
  path: "/orders",
  request: {
    body: jsonContent(createOrderRequestSchema, "Order payload")
  },
  responses: {
    201: jsonContent(orderResponseSchema, "Created order"),
    400: jsonContent(errorResponseSchema, "Validation error"),
    404: jsonContent(errorResponseSchema, "Missing customer or menu item"),
    409: jsonContent(errorResponseSchema, "Ordering conflict"),
    422: jsonContent(errorResponseSchema, "Invalid order payload")
  }
});

export const getOrderRoute = createRoute({
  operationId: "getOrder",
  tags: ["orders"],
  method: "get",
  path: "/orders/{id}",
  request: {
    params: idParamSchema
  },
  responses: {
    200: jsonContent(orderResponseSchema, "Order detail"),
    404: jsonContent(errorResponseSchema, "Order not found")
  }
});

export const updateOrderStatusRoute = createRoute({
  operationId: "updateOrderStatus",
  tags: ["orders"],
  method: "post",
  path: "/orders/{id}/actions/status",
  request: {
    params: idParamSchema,
    body: jsonContent(updateOrderStatusRequestSchema, "Status action")
  },
  responses: {
    200: jsonContent(orderResponseSchema, "Updated order"),
    404: jsonContent(errorResponseSchema, "Order not found"),
    409: jsonContent(errorResponseSchema, "Invalid status transition")
  }
});

export const listCustomersRoute = createRoute({
  operationId: "listCustomers",
  tags: ["customers"],
  method: "get",
  path: "/customers",
  responses: {
    200: jsonContent(
      z.array(customerWithStatsResponseSchema),
      "Customers with ordering stats"
    )
  }
});

export const getSettingsRoute = createRoute({
  operationId: "getOrderingSettings",
  tags: ["settings"],
  method: "get",
  path: "/settings/ordering",
  responses: {
    200: jsonContent(orderingSettingsResponseSchema, "Ordering settings")
  }
});

export const updateSettingsRoute = createRoute({
  operationId: "updateOrderingSettings",
  tags: ["settings"],
  method: "patch",
  path: "/settings/ordering",
  request: {
    body: jsonContent(updateOrderingSettingsRequestSchema, "Settings update")
  },
  responses: {
    200: jsonContent(orderingSettingsResponseSchema, "Updated settings")
  }
});

export function toErrorResponse(error: unknown) {
  if (error instanceof DomainError) {
    return {
      body: {
        error: {
          code: error.code,
          message: error.message
        }
      },
      status: error.status
    };
  }

  return {
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error."
      }
    },
    status: 500
  };
}

function toCreateMenuItemInput(
  input: z.infer<typeof createMenuItemRequestSchema>
): CreateMenuItemInput {
  return {
    categoryId: input.categoryId,
    name: input.name,
    priceCents: input.priceCents,
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.available !== undefined ? { available: input.available } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {})
  };
}

function toUpdateMenuItemInput(
  input: z.infer<typeof updateMenuItemRequestSchema>
): UpdateMenuItemInput {
  return {
    ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
    ...(input.available !== undefined ? { available: input.available } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {})
  };
}

function toCreateOrderInput(
  input: z.infer<typeof createOrderRequestSchema>
): CreateOrderInput {
  return {
    customerId: input.customerId,
    items: input.items,
    ...(input.notes !== undefined ? { notes: input.notes } : {})
  };
}

function toOrderingSettingsInput(
  input: z.infer<typeof updateOrderingSettingsRequestSchema>
) {
  return {
    ...(input.prepTimeMinutes !== undefined
      ? { prepTimeMinutes: input.prepTimeMinutes }
      : {}),
    ...(input.autoAccept !== undefined ? { autoAccept: input.autoAccept } : {}),
    ...(input.serviceAvailable !== undefined
      ? { serviceAvailable: input.serviceAvailable }
      : {}),
    ...(input.taxRateBps !== undefined ? { taxRateBps: input.taxRateBps } : {}),
    ...(input.openingHoursJson !== undefined
      ? { openingHoursJson: input.openingHoursJson }
      : {})
  };
}

export const handlers = {
  health: () => ({ ok: true, service: "odyssey-restaurant-backend" }),
  homeSummary: async (store: RestaurantStore) =>
    serializeHomeSummary(await store.getHomeSummary()),
  listMenuCategories: async (store: RestaurantStore) =>
    (await store.listMenuCategories()).map(serializeMenuCategory),
  listMenu: async (store: RestaurantStore) =>
    (await store.listMenuItems()).map(serializeMenuItem),
  createMenuItem: async (
    store: RestaurantStore,
    input: z.infer<typeof createMenuItemRequestSchema>
  ) => serializeMenuItem(await store.createMenuItem(toCreateMenuItemInput(input))),
  updateMenuItem: async (
    store: RestaurantStore,
    id: string,
    input: z.infer<typeof updateMenuItemRequestSchema>
  ) => serializeMenuItem(await store.updateMenuItem(id, toUpdateMenuItemInput(input))),
  listOrders: async (
    store: RestaurantStore,
    filters: z.infer<typeof orderStatusQuerySchema>
  ) =>
    (await store.listOrders(
      filters.status !== undefined ? { status: filters.status } : {}
    )).map(serializeOrderWithItems),
  createOrder: async (
    store: RestaurantStore,
    input: z.infer<typeof createOrderRequestSchema>
  ) => serializeOrderWithItems(await createOrder(store, toCreateOrderInput(input))),
  getOrder: async (store: RestaurantStore, id: string) => {
    const order = await store.findOrderById(id);
    if (!order) {
      throw new DomainError("ORDER_NOT_FOUND", "Order was not found.", 404);
    }
    return serializeOrderWithItems(order);
  },
  updateOrderStatus: async (
    store: RestaurantStore,
    id: string,
    input: z.infer<typeof updateOrderStatusRequestSchema>
  ) => serializeOrderWithItems(await updateOrderStatus(store, id, input.nextStatus)),
  listCustomers: async (store: RestaurantStore) =>
    (await store.listCustomers()).map(serializeCustomerWithStats),
  getSettings: async (store: RestaurantStore) =>
    serializeOrderingSettings(await store.getOrderingSettings()),
  updateSettings: async (
    store: RestaurantStore,
    input: z.infer<typeof updateOrderingSettingsRequestSchema>
  ) =>
    serializeOrderingSettings(
      await store.updateOrderingSettings(toOrderingSettingsInput(input))
    )
};
