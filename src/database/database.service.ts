import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: Client;

  async onModuleInit() {
    this.client = new Client({
      host: 'db.zmsjlaenynhkslxbpbjq.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: process.env.SUPABASE_PASS,
      ssl: { rejectUnauthorized: false },
    });
    await this.client.connect();
    console.log('PostgreSQL (Supabase) Connected');
  }

  async query(text: string, params?: any[]) {
    return this.client.query(text, params);
  }

  async onModuleDestroy() {
    await this.client.end();
  }
}
