import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Weather, WeatherDocument } from './entities/weather.entity';

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(Weather.name) private weatherModel: Model<WeatherDocument>,
  ) {}

  // Cria um novo registro
  async create(createWeatherDto: any) {
    const createdWeather = new this.weatherModel(createWeatherDto);
    return createdWeather.save();
  }

  // Lista todos (para testarmos depois)
  async findAll() {
    return this.weatherModel.find().sort({ createdAt: -1 }).exec();
  }
}