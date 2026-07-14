import { prisma } from "../utils/prisma.js";

const STORE_SETTING_ID = "store";

export type StoreStatus = {
  isOpen: boolean;
  updatedAt: Date;
};

export async function getStoreStatus(): Promise<StoreStatus> {
  const setting = await prisma.storeSetting.upsert({
    where: { id: STORE_SETTING_ID },
    update: {},
    create: { id: STORE_SETTING_ID, isOpen: true }
  });
  return { isOpen: setting.isOpen, updatedAt: setting.updatedAt };
}

export async function setStoreOpen(isOpen: boolean): Promise<StoreStatus> {
  const setting = await prisma.storeSetting.upsert({
    where: { id: STORE_SETTING_ID },
    update: { isOpen },
    create: { id: STORE_SETTING_ID, isOpen }
  });
  return { isOpen: setting.isOpen, updatedAt: setting.updatedAt };
}