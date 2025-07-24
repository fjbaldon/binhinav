// ./backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { EventEmitterModule } from '@nestjs/event-emitter'; // --- ADDED ---
import { SearchLogsModule } from './search-logs/search-logs.module'; // --- ADDED ---
import { DashboardModule } from './dashboard/dashboard.module'; // --- ADDED ---

@Module({
  imports: [
    // 1. Configuration Module (to read .env files)
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available throughout the app
    }),

    // --- ADDED: Event Emitter Module ---
    EventEmitterModule.forRoot(),

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
        ttl: 60000,
        limit: 100,
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
    SearchLogsModule, // --- ADDED ---
    DashboardModule, // --- ADDED ---
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
