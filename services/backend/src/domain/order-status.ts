import type { OrderStatus } from "../db/schema";
import { DomainError } from "./errors";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

export function getNextOrderStatuses(status: OrderStatus): OrderStatus[] {
  return allowedTransitions[status];
}

export function assertValidStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): void {
  if (allowedTransitions[currentStatus].includes(nextStatus)) {
    return;
  }

  throw new DomainError(
    "INVALID_STATUS_TRANSITION",
    `Cannot transition order from ${currentStatus} to ${nextStatus}.`,
    409
  );
}
