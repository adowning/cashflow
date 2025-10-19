import db from '../database/index';
import * as schema from '../database/schema';
import productsData from './json/products.json';

// Type definition for the products JSON data
interface RawProductData {
  title: string;
  productType: string;
  bonusTotalInCredits: number;
  discountInCents: number;
  bestValue: number;
  amountToReceiveInCredits: number;
  totalDiscountInCents: number;
  bonusSpins: number;
  isPromo: boolean;
  description: string;
  url: string;
  priceInCents: number;
}

export async function seedProducts(
  operatorId: string
)
{
  console.log('🛍️ Seeding products...');

  if (!operatorId) {
    throw new Error('An Operator ID is required to seed products.');
  }

  const productsToInsert = (productsData as RawProductData[]).map((product) => ({
    ...product,
    id: `prod_${crypto.randomUUID()}`, // Ensure a unique ID for each product
    operatorId: operatorId, // Link each product to the default operator
  }));

  await db
    .insert(schema.products)
    .values(productsToInsert)
    .onConflictDoNothing();

  console.log(`✅ ${(productsData as RawProductData[]).length} products seeded.`);
}
