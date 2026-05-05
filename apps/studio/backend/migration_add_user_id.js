import { query } from './utils/db.js';

async function runMigration() {
  try {
    console.log('Adding user_id columns to photography_styles and templates...');
    
    // Add user_id to photography_styles
    await query(`
      ALTER TABLE photography_styles 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    `);
    console.log('✓ Added user_id to photography_styles');
    
    // Add user_id to templates
    await query(`
      ALTER TABLE templates
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    `);
    console.log('✓ Added user_id to templates');
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

runMigration();
