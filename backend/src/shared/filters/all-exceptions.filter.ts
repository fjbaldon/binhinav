import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Catches all exceptions and formats them into a standardized JSON response.
 * - For HttpExceptions, it respects the status code and message.
 * - For all other exceptions, it returns a 500 Internal Server Error
 *   and logs the full error details for debugging, without exposing them to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    // We use the NestJS Logger for consistent, context-aware logging.
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string | object;

        if (exception instanceof HttpException) {
            // If the exception is a known HTTP type (e.g., NotFoundException),
            // we use its status code and message.
            status = exception.getStatus();
            message = exception.getResponse();

            // Log the HTTP exception for auditing purposes
            this.logger.warn(`HttpException: [${status}] ${JSON.stringify(message)} - Path: ${request.url}`);

        } else {
            // If the exception is unknown, it's an unhandled error.
            // We force a 500 Internal Server Error status.
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = {
                statusCode: status,
                message: 'Internal Server Error',
                error: 'An unexpected error occurred. Please try again later.'
            };

            // CRITICAL: Log the full, unhandled error with stack trace for debugging.
            // This information is for developers only and is NOT sent to the client.
            this.logger.error(
                `Unhandled Exception: ${exception instanceof Error ? exception.message : JSON.stringify(exception)}`,
                exception instanceof Error ? exception.stack : '',
                `Path: ${request.url}`
            );
        }

        const responseBody = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            ...(typeof message === 'object' ? message : { message }),
        };

        response.status(status).json(responseBody);
    }
}
