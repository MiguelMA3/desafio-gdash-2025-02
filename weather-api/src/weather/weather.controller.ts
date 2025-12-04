import { Controller, Get, Post, Body, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { WeatherService } from './weather.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post()
  create(@Body() createWeatherDto: any) {
    return this.weatherService.create(createWeatherDto);
  }

  @UseGuards(AuthGuard('jwt')) // Protege TODAS as rotas abaixo
  @Get('insights')
  getInsights() {
    return this.weatherService.generateInsights();
  }

  @Get()
  findAll() {
    return this.weatherService.findAll();
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="clima_log.csv"')
  async exportCsv(@Res() res: Response) {
    const csvData = await this.weatherService.getCsvData();
    res.send(csvData);
  }
}