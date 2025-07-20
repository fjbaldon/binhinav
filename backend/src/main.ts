import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: '*', // In production, restrict this to your actual frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Apply the global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are provided
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
    }),
  );

  // Apply our custom global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}
bootstrap();
