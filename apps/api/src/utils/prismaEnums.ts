import prismaClientPkg from "@prisma/client";
import type { OrderStatus as OrderStatusType, UserRole as UserRoleType } from "@prisma/client";

const prismaRuntime = prismaClientPkg as unknown as {
  OrderStatus: Record<OrderStatusType, OrderStatusType>;
  UserRole: Record<UserRoleType, UserRoleType>;
};

export const OrderStatus = prismaRuntime.OrderStatus;
export const UserRole = prismaRuntime.UserRole;

export type { OrderStatusType, UserRoleType };
