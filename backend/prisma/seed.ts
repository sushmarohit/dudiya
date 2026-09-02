import { PrismaClient, ProductCategory, MilkSpecies, UserRole, UserStatus, ProductScope, ProductPromotionStatus, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const products = [
  { sku: 'MILK-COW', name: 'Cow Milk', category: ProductCategory.MILK, species: MilkSpecies.COW, unit: 'litre' },
  { sku: 'MILK-BUFFALO', name: 'Buffalo Milk', category: ProductCategory.MILK, species: MilkSpecies.BUFFALO, unit: 'litre' },
  { sku: 'MILK-GOAT', name: 'Goat Milk', category: ProductCategory.MILK, species: MilkSpecies.GOAT, unit: 'litre' },
  { sku: 'MILK-CAMEL', name: 'Camel Milk', category: ProductCategory.MILK, species: MilkSpecies.CAMEL, unit: 'litre' },
  { sku: 'CURD-500G', name: 'Fresh Curd', category: ProductCategory.CURD, unit: '500g' },
  { sku: 'PANEER-250G', name: 'Fresh Paneer', category: ProductCategory.PANEER, unit: '250g' },
  { sku: 'EGGS-6', name: 'Farm Eggs (6)', category: ProductCategory.EGGS, unit: 'pack' },
  { sku: 'LASSI-500ML', name: 'Sweet Lassi', category: ProductCategory.LASSI, unit: '500ml' },
  { sku: 'GHEE-500G', name: 'Pure Ghee', category: ProductCategory.GHEE, unit: '500g' },
  { sku: 'BUTTER-200G', name: 'Fresh Butter', category: ProductCategory.BUTTER, unit: '200g' },
  { sku: 'KHOYA-250G', name: 'Khoya', category: ProductCategory.KHOYA, unit: '250g' },
];

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@milk.local' },
    update: {},
    create: {
      email: 'admin@milk.local',
      name: 'Super Admin',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        category: product.category,
        species: product.species ?? null,
        unit: product.unit,
        active: true,
      },
      create: {
        sku: product.sku,
        name: product.name,
        category: product.category,
        species: product.species ?? null,
        unit: product.unit,
        active: true,
        scope: ProductScope.GLOBAL,
        promotionStatus: ProductPromotionStatus.NONE,
      },
    });
  }

  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      pauseCutoffHour: 20,
      pauseCutoffMinute: 0,
      defaultRadiusKm: 5,
    },
  });

  // Admin approval removed — keep all distributor rows approved
  await prisma.distributorProfile.updateMany({
    where: { approvalStatus: { not: ApprovalStatus.APPROVED } },
    data: { approvalStatus: ApprovalStatus.APPROVED, rejectionReason: null },
  });

  // Do NOT auto-set identityVerified — uploaded verified documents are compulsory before go-live

  console.log('Seed completed: admin user, products, platform settings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
