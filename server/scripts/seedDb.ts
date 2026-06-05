import 'dotenv/config';
import { initStore, closeStore, isMongoEnabled } from '../store/index.js';
import { buildSeedDatabase } from '../seed.js';

async function main() {
  if (!isMongoEnabled()) {
    console.error('[seed] MONGODB_URI is not set. Add it to .env before seeding.');
    process.exit(1);
  }

  const store = await initStore();
  console.log('[seed] Clearing existing data…');
  await store.clearAll();

  const snapshot = await buildSeedDatabase();
  await store.seed(snapshot);

  console.log('\n[seed] Database seeded successfully.\n');
  console.log('── Demo credentials ──────────────────────────');
  console.log('Super admin : admin@gaulaxmi.io  /  admin123');
  console.log('Staff admin : staff@gaulaxmi.io  /  staff123');
  console.log('Member      : vikram@gaulaxmi.io  /  member123');
  console.log('Member      : ajay@appinop.com   /  member123');
  console.log('──────────────────────────────────────────────\n');

  await closeStore();
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
