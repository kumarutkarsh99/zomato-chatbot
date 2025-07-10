// chatbot.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { DatabaseModule } from '../database/database.module';
import { DineinModule } from 'src/dinein/dinein.module';
import { MenusModule } from 'src/menus/menus.module';
import { OrderModule } from 'src/order/order.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => DineinModule),
    MenusModule,
    OrderModule,
    RestaurantModule,
    UserModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService]
})
export class ChatbotModule {}
