import { Controller, Get, Post, Body } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather') // Isso define a rota base como /weather
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post() // POST /weather
  create(@Body() createWeatherDto: any) {
    return this.weatherService.create(createWeatherDto);
  }

  @Get() // GET /weather
  findAll() {
    return this.weatherService.findAll();
  }
}