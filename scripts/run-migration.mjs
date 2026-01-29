// Run database migration using @vercel/postgres
// Usage: node scripts/run-migration.mjs migrations/003_lmn_table.sql

import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.mjs <migration-file.sql>');
  process.exit(1);
}

const filePath = resolve(process.cwd(), migrationFile);
console.log(`Reading migration from: ${filePath}`);

try {
  const sqlContent = readFileSync(filePath, 'utf-8');
  
  // Remove single-line comments but preserve the SQL
  const withoutComments = sqlContent
    .split('\n')
    .map(line => {
      // Keep lines that have SQL before the comment
      const commentIndex = line.indexOf('--');
      if (commentIndex === -1) return line;
      if (commentIndex === 0) return ''; // Line starts with comment, remove it
      return line.substring(0, commentIndex); // Keep SQL before comment
    })
    .join('\n');

  // Split by semicolons and filter out empty statements
  const statements = withoutComments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    console.log(`  ${statement.substring(0, 60).replace(/\n/g, ' ')}${statement.length > 60 ? '...' : ''}`);
    
    try {
      await sql.query(statement);
      console.log('  ✓ Success\n');
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}\n`);
      // Continue with other statements
    }
  }

  console.log('Migration complete!');
} catch (err) {
  console.error('Failed to run migration:', err.message);
  process.exit(1);
}
