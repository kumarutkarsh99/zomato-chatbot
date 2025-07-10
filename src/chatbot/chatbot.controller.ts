import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  // This is the Dialogflow webhook entry point
  @Post('webhook')
  async handleDialogflowWebhook(@Body() body: any) {
    return await this.chatbotService.handleFulfillment(body);
  }
}
