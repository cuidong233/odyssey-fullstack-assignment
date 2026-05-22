import { z } from "zod/v4";
import {
  insertMenuItemSchema,
  insertOrderItemSchema,
  insertOrderSchema,
  insertOrderingSettingsSchema,
  orderStatusSchema,
  selectCustomerSchema,
  selectMenuCategorySchema,
  selectMenuItemSchema,
  selectOrderItemSchema,
  selectOrderSchema,
  selectOrderingSettingsSchema
} from "../db/schema";

const dateTimeSchema = z.string().datetime();

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string()
  })
});

export const menuItemResponseSchema = selectMenuItemSchema.extend({
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
});

export const customerResponseSchema = selectCustomerSchema.extend({
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
});

export const menuCategoryResponseSchema = selectMenuCategorySchema.extend({
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
});

export const orderItemResponseSchema = selectOrderItemSchema;

export const orderResponseSchema = selectOrderSchema.extend({
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  customer: customerResponseSchema,
  items: z.array(orderItemResponseSchema),
  nextStatuses: z.array(orderStatusSchema)
});

export const customerWithStatsResponseSchema = customerResponseSchema.extend({
  orderCount: z.number().int().nonnegative(),
  spendCents: z.number().int().nonnegative(),
  recentOrders: z.array(
    selectOrderSchema.extend({
      createdAt: dateTimeSchema,
      updatedAt: dateTimeSchema
    })
  )
});

export const orderingSettingsResponseSchema = selectOrderingSettingsSchema.extend({
  updatedAt: dateTimeSchema
});

const createOrderItemRequestSchema = insertOrderItemSchema
  .pick({
    menuItemId: true,
    quantity: true
  })
  .extend({
    quantity: z.number().int().positive()
  })
  .strict();

export const createOrderRequestSchema = insertOrderSchema
  .pick({
    customerId: true,
    notes: true
  })
  .extend({
    items: z.array(createOrderItemRequestSchema).min(1),
    notes: z.string().max(500).nullish()
  })
  .strict();

export const createMenuItemRequestSchema = insertMenuItemSchema
  .pick({
    categoryId: true,
    name: true,
    description: true,
    priceCents: true,
    available: true,
    sortOrder: true
  })
  .extend({
    name: z.string().min(1),
    description: z.string().max(500).nullish(),
    priceCents: z.number().int().positive()
  })
  .strict();

export const updateMenuItemRequestSchema =
  createMenuItemRequestSchema.partial().strict();

export const updateOrderStatusRequestSchema = z.object({
  nextStatus: orderStatusSchema
}).strict();

export const updateOrderingSettingsRequestSchema = insertOrderingSettingsSchema
  .pick({
    prepTimeMinutes: true,
    autoAccept: true,
    serviceAvailable: true,
    taxRateBps: true,
    openingHoursJson: true
  })
  .partial()
  .extend({
    prepTimeMinutes: z.number().int().positive().max(240).optional(),
    taxRateBps: z.number().int().min(0).max(2500).optional()
  })
  .strict();

export const homeSummaryResponseSchema = z.object({
  totalOrders: z.number().int().nonnegative(),
  revenueCents: z.number().int().nonnegative(),
  pendingOrders: z.number().int().nonnegative(),
  popularItems: z.array(
    z.object({
      menuItemId: z.string(),
      name: z.string(),
      quantity: z.number().int().nonnegative()
    })
  )
});

export const orderStatusQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const listLimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const idParamSchema = z.object({
  id: z.string().uuid()
}).strict();
