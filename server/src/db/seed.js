import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const inventoryItems = [
  // Grains & Staples
  { name: 'Basmati Rice', category: 'grains', quantity: 2, unit: 'kg', lowStockAt: 0.5 },
  { name: 'Toor Dal', category: 'grains', quantity: 1, unit: 'kg', lowStockAt: 0.25 },
  { name: 'Moong Dal', category: 'grains', quantity: 0.5, unit: 'kg', lowStockAt: 0.2 },
  { name: 'Chana Dal', category: 'grains', quantity: 0.5, unit: 'kg', lowStockAt: 0.2 },
  { name: 'Urad Dal', category: 'grains', quantity: 0.5, unit: 'kg', lowStockAt: 0.2 },
  { name: 'Atta', category: 'grains', quantity: 5, unit: 'kg', lowStockAt: 1 },
  { name: 'Maida', category: 'grains', quantity: 0.5, unit: 'kg', lowStockAt: 0.2 },
  { name: 'Besan', category: 'grains', quantity: 0.5, unit: 'kg', lowStockAt: 0.2 },
  { name: 'Poha', category: 'grains', quantity: 0.5, unit: 'kg', lowStockAt: 0.2 },
  { name: 'Rava', category: 'grains', quantity: 0.5, unit: 'kg', lowStockAt: 0.2 },

  // Spices
  { name: 'Haldi', category: 'spices', quantity: 100, unit: 'g', lowStockAt: 20 },
  { name: 'Mirchi Powder', category: 'spices', quantity: 100, unit: 'g', lowStockAt: 20 },
  { name: 'Dhania Powder', category: 'spices', quantity: 100, unit: 'g', lowStockAt: 20 },
  { name: 'Jeera', category: 'spices', quantity: 100, unit: 'g', lowStockAt: 20 },
  { name: 'Rai', category: 'spices', quantity: 100, unit: 'g', lowStockAt: 20 },
  { name: 'Garam Masala', category: 'spices', quantity: 50, unit: 'g', lowStockAt: 10 },
  { name: 'Kitchen King', category: 'spices', quantity: 50, unit: 'g', lowStockAt: 10 },
  { name: 'Chaat Masala', category: 'spices', quantity: 50, unit: 'g', lowStockAt: 10 },
  { name: 'Kasuri Methi', category: 'spices', quantity: 25, unit: 'g', lowStockAt: 5 },
  { name: 'Hing', category: 'spices', quantity: 20, unit: 'g', lowStockAt: 5 },

  // Vegetables (common always-have)
  { name: 'Onion', category: 'vegetables', quantity: 2, unit: 'kg', lowStockAt: 0.5 },
  { name: 'Tomato', category: 'vegetables', quantity: 1, unit: 'kg', lowStockAt: 0.25 },
  { name: 'Potato', category: 'vegetables', quantity: 1, unit: 'kg', lowStockAt: 0.25 },
  { name: 'Green Chillies', category: 'vegetables', quantity: 100, unit: 'g', lowStockAt: 25 },
  { name: 'Ginger', category: 'vegetables', quantity: 100, unit: 'g', lowStockAt: 25 },
  { name: 'Garlic', category: 'vegetables', quantity: 100, unit: 'g', lowStockAt: 25 },
  { name: 'Coriander Leaves', category: 'vegetables', quantity: 1, unit: 'bunch', lowStockAt: 0 },

  // Dairy
  { name: 'Milk', category: 'dairy', quantity: 1, unit: 'L', lowStockAt: 0.25 },
  { name: 'Curd', category: 'dairy', quantity: 500, unit: 'g', lowStockAt: 100 },
  { name: 'Paneer', category: 'dairy', quantity: 200, unit: 'g', lowStockAt: 0 },
  { name: 'Butter', category: 'dairy', quantity: 100, unit: 'g', lowStockAt: 20 },
  { name: 'Ghee', category: 'dairy', quantity: 500, unit: 'ml', lowStockAt: 100 },

  // Others
  { name: 'Cooking Oil', category: 'others', quantity: 2, unit: 'L', lowStockAt: 0.5 },
  { name: 'Salt', category: 'others', quantity: 1, unit: 'kg', lowStockAt: 0.2 },
  { name: 'Sugar', category: 'others', quantity: 1, unit: 'kg', lowStockAt: 0.2 },
  { name: 'Tea Leaves', category: 'others', quantity: 250, unit: 'g', lowStockAt: 50 },
  { name: 'Coffee Powder', category: 'others', quantity: 100, unit: 'g', lowStockAt: 25 },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.inventoryItem.deleteMany();

  // Insert inventory items
  for (const item of inventoryItems) {
    await prisma.inventoryItem.create({ data: item });
  }

  console.log(`Seeded ${inventoryItems.length} inventory items`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
