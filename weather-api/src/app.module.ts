import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WeatherModule } from './weather/weather.module'; // Vamos criar isso já já

@Module({
  imports: [
    // 1. Configura Leitura de .env
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    // 2. Configura Mongoose (Banco de dados)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    // 3. Módulo de Clima (que criaremos a seguir)
    WeatherModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}