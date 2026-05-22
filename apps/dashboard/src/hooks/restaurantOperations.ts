import { useQueryClient } from "@tanstack/react-query";
import {
  type CreateOrder201,
  type MenuItem,
  type OrderStatus,
  type UpdateMenuItem200,
  type UpdateMenuItemBody,
  type UpdateOrderingSettings200,
  type UpdateOrderingSettingsBody,
  useCreateOrder,
  useUpdateMenuItem,
  useUpdateOrderingSettings,
  useUpdateOrderStatus
} from "@repo/api-client";

export function useCreateRestaurantOrder(options?: {
  onCreated?: (order: CreateOrder201) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        void queryClient.invalidateQueries();
        options?.onCreated?.(order);
      }
    }
  });

  return {
    ...mutation,
    createOrder: (input: { customerId: string; menuItemIds: string[] }) =>
      mutation.mutate({
        data: {
          customerId: input.customerId,
          items: input.menuItemIds.map((menuItemId) => ({
            menuItemId,
            quantity: 1
          }))
        }
      })
  };
}

export function useOrderStatusAction() {
  const queryClient = useQueryClient();
  const mutation = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries();
      }
    }
  });

  return {
    ...mutation,
    moveOrderTo: (orderId: string, nextStatus: OrderStatus) =>
      mutation.mutate({
        id: orderId,
        data: { nextStatus }
      })
  };
}

export function useMenuItemEditor(options?: {
  onSaved?: (item: UpdateMenuItem200) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useUpdateMenuItem({
    mutation: {
      onSuccess: (item) => {
        void queryClient.invalidateQueries();
        options?.onSaved?.(item);
      }
    }
  });

  return {
    ...mutation,
    saveMenuItem: (id: MenuItem["id"], data: UpdateMenuItemBody) =>
      mutation.mutate({ id, data })
  };
}

export function useOrderingSettingsEditor(options?: {
  onSaved?: (settings: UpdateOrderingSettings200) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useUpdateOrderingSettings({
    mutation: {
      onSuccess: (settings) => {
        void queryClient.invalidateQueries();
        options?.onSaved?.(settings);
      }
    }
  });

  return {
    ...mutation,
    saveSettings: (data: UpdateOrderingSettingsBody) =>
      mutation.mutate({ data })
  };
}
