import { Controller, Post, Body, Get } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { DatabaseService } from 'src/database/database.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}
  // This is the Dialogflow webhook entry point
  @Post('webhook')
  async handleDialogflowWebhook(@Body() body: any) {
    return await this.chatbotService.handleFulfillment(body);
  }
}

@Controller()
export class AppController {
  constructor( private dbService: DatabaseService) {}
  @Get('health')
  async getHealth() {
    const dbTime = await this.dbService.checkConnection();
    return { dbTime, status: 'OK' };
  }
}
