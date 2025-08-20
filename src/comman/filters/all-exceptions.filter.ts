import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Response } from 'express';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
  
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
  
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const res = exception.getResponse();
        if (typeof res === 'string') {
          message = res;
        } else if (typeof res === 'object' && res !== null) {
          message = (res as any).message || exception.message || message;
        }
      } else if (exception instanceof Error) {
        message = exception.message;
      }
  
      // ✅ Special handling for Dialogflow
      response.status(200).json({
        fulfillmentText: message,  // <- Dialogflow will display this to the user
      });
    }
  }
  