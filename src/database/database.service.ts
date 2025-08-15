import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: Client;

  async onModuleInit() {
    // Use full connection string from .env
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required for Supabase
      family: 4, // force IPv4
    });

    try {
      await this.client.connect();
      console.log('PostgreSQL (Supabase) Connected');
    } catch (err) {
      console.error('Error connecting to PostgreSQL:', err);
      throw err;
    }
  }

  async query(text: string, params?: any[]) {
    try {
      return await this.client.query(text, params);
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.end();
      console.log('PostgreSQL Connection Closed');
    }
  }
}
