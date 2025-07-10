import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // 1. Create new user
  @Post()
  createUser(@Body() body: any) {
    return this.userService.createUser(body);
  }

  // 2. Get user by ID
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(parseInt(id));
  }

  // 3. Get user by phone or email
  @Get()
  getUserByPhoneOrEmail(@Query('identifier') identifier: string) {
    return this.userService.getUserByPhoneOrEmail(identifier);
  }

  // 4. Update user profile
  @Put(':id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.userService.updateUser(parseInt(id), body);
  }

  // 5. Delete user
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(parseInt(id));
  }

  // 6. Get all users (admin use)
  @Get('admin/all')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  // 7. Get user order history
  @Get(':id/orders')
  getUserOrders(@Param('id') id: string) {
    return this.userService.getUserOrderHistory(parseInt(id));
  }

  // 8. Get chatbot-friendly user profile
  @Get(':id/chatbot-profile')
  getChatbotProfile(@Param('id') id: string) {
    return this.userService.getChatbotProfile(parseInt(id));
  }
}
