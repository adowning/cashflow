import { seedGameSpins } from './src/seed/gameplay.ts';

try {
  console.log('Testing seedGameSpins...');
  await seedGameSpins('test-operator-id');
  console.log('✅ seedGameSpins completed successfully');
} catch (error) {
  console.error('❌ Error in seedGameSpins:', error.message);
  console.error('Stack:', error.stack);
}
