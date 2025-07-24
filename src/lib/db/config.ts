import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, {
  schema,});

  export async function testConnection() {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// // src/lib/db.ts
// import { drizzle } from 'drizzle-orm/node-postgres';
// import { Pool } from 'pg';
// import * as schema from './schema'; // Your Drizzle schema definitions

// const connectionString = process.env.DATABASE_URL;

// if (!connectionString) {
//   throw new Error('DATABASE_URL is not set');
// }

// const pool = new Pool({
//   connectionString: connectionString,
//   ssl: {
//     // For connecting to Render, 'rejectUnauthorized: false' might be needed locally if you face SSL errors.
//     // Render's SSL certs are usually valid and trusted, but local setup can sometimes cause issues.
//     // For robust local dev, consider running a local Postgres via Docker (see below),
//     // or ensure your Node.js environment trusts the cert.
//     rejectUnauthorized: false,
//   },
// });

// export const db = drizzle(pool, { schema });