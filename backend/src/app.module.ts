import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlacesModule } from './places/places.module';
import { MerchantsModule } from './merchants/merchants.module';
import { AdminsModule } from './admins/admins.module';
import { FloorPlansModule } from './floor-plans/floor-plans.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { KiosksModule } from './kiosks/kiosks.module';
import { AdsModule } from './ads/ads.module';
import { CategoriesModule } from './categories/categories.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // 1. Configuration Module (to read .env files)
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available throughout the app
    }),

    // 2. TypeORM Module (for database connection)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'], // Auto-load entities
        synchronize: true, // DEV ONLY: auto-creates schema. Use migrations in prod.
      }),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time-to-live: 60 seconds (in milliseconds for some versions, or check docs for seconds)
        limit: 100, // Limit each IP to 100 requests per `ttl`. Increased from 10.
      }
    ]),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads/',
    }),

    DatabaseModule,
    PlacesModule,
    MerchantsModule,
    AdminsModule,
    FloorPlansModule,
    AuthModule,
    KiosksModule,
    AdsModule,
    CategoriesModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply the ThrottlerGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
