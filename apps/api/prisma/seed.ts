import { hashPassword } from "../src/utils/password.js";
import { UserRole } from "../src/utils/prismaEnums.js";
import { prisma } from "../src/utils/prisma.js";

async function main(): Promise<void> {
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

  const category = await prisma.productCategory.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      name: "主餐",
      sortOrder: 1
    }
  });

  const product = await prisma.product.upsert({
    where: { id: "00000000-0000-0000-0000-000000000201" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000201",
      categoryId: category.id,
      name: "招牌雞腿飯",
      description: "含主菜、配菜與白飯",
      imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d",
      price: 120,
      sortOrder: 1
    }
  });

  const spicy = await prisma.flavor.upsert({
    where: { id: "00000000-0000-0000-0000-000000000301" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000301",
      name: "加辣",
      extraPrice: 0,
      sortOrder: 1
    }
  });

  const egg = await prisma.flavor.upsert({
    where: { id: "00000000-0000-0000-0000-000000000302" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000302",
      name: "加蛋",
      extraPrice: 15,
      sortOrder: 2
    }
  });

  await prisma.productFlavor.createMany({
    data: [
      { productId: product.id, flavorId: spicy.id },
      { productId: product.id, flavorId: egg.id }
    ],
    skipDuplicates: true
  });

  console.log(`Seed complete. Admin id: ${admin.id}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });


