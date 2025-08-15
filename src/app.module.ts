import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { RestaurantModule } from './restaurant/restaurant.module';
import { MenusModule } from './menus/menus.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [RestaurantModule, MenusModule, ChatbotModule, SupabaseModule],
  controllers: [AppController],
  providers: [AppService, DatabaseService],
  exports: [DatabaseService],
})
export class AppModule {}
