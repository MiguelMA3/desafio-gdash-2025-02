import { Controller, Get, Post, Body } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post()
  create(@Body() createWeatherDto: any) {
    return this.weatherService.create(createWeatherDto);
  }

  @Get('insights')
  getInsights() {
    return this.weatherService.generateInsights();
  }

  @Get()
  findAll() {
    return this.weatherService.findAll();
  }
}