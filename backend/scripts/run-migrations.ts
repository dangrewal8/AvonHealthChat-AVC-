#!/usr/bin/env ts-node
/**
 * Database Migration Runner
 *
 * Executes SQL migration files in order
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Database configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'avon_health_rag',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

interface MigrationResult {
  file: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  duration?: number;
}

async function runMigration(filePath: string): Promise<MigrationResult> {
  const fileName = path.basename(filePath);
  const startTime = Date.now();

  try {
    console.log(`\n📄 Running migration: ${fileName}`);

    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Execute SQL
    await pool.query(sql);

    const duration = Date.now() - startTime;
    console.log(`✅ Migration ${fileName} completed successfully (${duration}ms)`);

    return {
      file: fileName,
      status: 'success',
      message: 'Migration completed successfully',
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ Migration ${fileName} failed:`, errorMessage);

    return {
      file: fileName,
      status: 'error',
      message: errorMessage,
      duration,
    };
  }
}

async function runMigrations() {
  console.log('🔧 Starting Database Migrations');
  console.log('================================\n');

  const migrationsDir = path.join(__dirname, '../database/migrations');

  // Get all .sql files and sort them
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files:\n`);
  files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

  const results: MigrationResult[] = [];

  // Run each migration
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const result = await runMigration(filePath);
    results.push(result);

    // Stop on error
    if (result.status === 'error') {
      console.error('\n❌ Migration failed! Stopping execution.');
      break;
    }
  }

  // Summary
  console.log('\n\n📊 Migration Summary');
  console.log('====================\n');

  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;

  console.log(`Total migrations: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 All migrations completed successfully!');
  } else {
    console.log('\n⚠️  Some migrations failed. Please review the errors above.');
    process.exit(1);
  }

  await pool.end();
}

// Run migrations
runMigrations().catch(error => {
  console.error('Fatal error:', error);
  pool.end();
  process.exit(1);
});
