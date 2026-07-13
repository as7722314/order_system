import { hashPassword } from "../src/utils/password.js";
import { UserRole } from "../src/utils/prismaEnums.js";
import { prisma } from "../src/utils/prisma.js";

const categories = [
  {
    id: "89afccc0-1e46-46d2-9568-8ae47e57e9a0",
    name: "預設商品",
    sortOrder: 0,
    isActive: true
  },
  {
    id: "00000000-0000-0000-0000-000000000101",
    name: "主餐",
    sortOrder: 1,
    isActive: true
  }
] as const;

const products = [
  {
    id: "00000000-0000-0000-0000-000000000201",
    categoryId: "00000000-0000-0000-0000-000000000101",
    name: "蔥油餅(整張)",
    description: "一張分成兩袋一袋一個口味哦！",
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d",
    price: 90,
    sortOrder: 1,
    isActive: true
  },
  {
    id: "c8ec84b0-4309-4b7d-85fc-987f80b70399",
    categoryId: "89afccc0-1e46-46d2-9568-8ae47e57e9a0",
    name: "蔥油餅(半張)",
    description: "選兩個口味是混在同一包哦！",
    imageUrl: null,
    price: 45,
    sortOrder: 2,
    isActive: true
  }
] as const;

const flavors = [
  {
    id: "00000000-0000-0000-0000-000000000301",
    name: "梅粉",
    extraPrice: 0,
    sortOrder: 1,
    isActive: true
  },
  {
    id: "00000000-0000-0000-0000-000000000302",
    name: "胡椒",
    extraPrice: 0,
    sortOrder: 2,
    isActive: true
  },
  {
    id: "425a8503-ce5b-4872-b484-616c131a1c42",
    name: "芥末",
    extraPrice: 0,
    sortOrder: 3,
    isActive: true
  },
  {
    id: "39012d5b-d685-430c-b765-eed5593f4faa",
    name: "海苔",
    extraPrice: 0,
    sortOrder: 4,
    isActive: true
  },
  {
    id: "57dddc76-1512-435f-b3f4-5677a3d0f271",
    name: "咖哩",
    extraPrice: 0,
    sortOrder: 5,
    isActive: true
  },
  {
    id: "d05f5508-9c7c-4eda-9527-b99967ddc070",
    name: "辣粉",
    extraPrice: 0,
    sortOrder: 6,
    isActive: true
  }
] as const;

const productFlavors = products.flatMap((product) =>
  flavors.map((flavor) => ({ productId: product.id, flavorId: flavor.id }))
);

async function seedAdmin(): Promise<void> {
  const account = process.env.ADMIN_ACCOUNT ?? "admin";
  const password = process.env.ADMIN_INITIAL_PASSWORD ?? "change_me";
  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { lineUserId: "admin-seed" },
    update: {
      displayName: account,
      passwordHash
    },
    create: {
      lineUserId: "admin-seed",
      displayName: account,
      role: UserRole.ADMIN,
      passwordHash
    }
  });

  console.log(`Seed admin complete. Admin id: ${admin.id}`);
}

async function seedCatalog(): Promise<void> {
  for (const category of categories) {
    await prisma.productCategory.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: category.isActive
      },
      create: category
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
        sortOrder: product.sortOrder,
        isActive: product.isActive
      },
      create: product
    });
  }

  for (const flavor of flavors) {
    await prisma.flavor.upsert({
      where: { id: flavor.id },
      update: {
        name: flavor.name,
        extraPrice: flavor.extraPrice,
        sortOrder: flavor.sortOrder,
        isActive: flavor.isActive
      },
      create: flavor
    });
  }

  await prisma.productFlavor.deleteMany({
    where: {
      productId: { in: products.map((product) => product.id) }
    }
  });

  await prisma.productFlavor.createMany({
    data: productFlavors,
    skipDuplicates: true
  });

  console.log(`Seed catalog complete. Products: ${products.length}, flavors: ${flavors.length}`);
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedCatalog();
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
