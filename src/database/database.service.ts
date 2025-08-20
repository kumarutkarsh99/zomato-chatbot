import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, 
      family: 4, 
      max: 10, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, 
    });

    try {
      await this.pool.connect();
      console.log('PostgreSQL (Supabase) Connected');
    } catch (err) {
      console.error('Error connecting to PostgreSQL:', err);
      throw err;
    }

    this.pool.on('error', (err) => {
      console.error('Unexpected PG error on idle client', err);
    });
  }

  async query(text: string, params?: any[]) {
    try {
      return await this.pool.query(text, params);
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      console.log('PostgreSQL Connection Closed');
    }
  }

  async checkConnection() {
    const res = await this.pool.query('SELECT NOW() AS current_time;');
    return res.rows[0];
  }
}
