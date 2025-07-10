import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: Client;

  async onModuleInit() {
    this.client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'zomato_chatbot',
      password: '12345678',
      port: 5432,
    });

    await this.client.connect();
    console.log('PostgreSQL Connected');
  }

  async query(text: string, params?: any[]) {
    return this.client.query(text, params);
  }

  async onModuleDestroy() {
    await this.client.end();
  }
}
