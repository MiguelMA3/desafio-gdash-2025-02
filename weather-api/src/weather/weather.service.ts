import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Weather, WeatherDocument } from './entities/weather.entity';

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(Weather.name) private weatherModel: Model<WeatherDocument>,
  ) {}

  async create(createWeatherDto: any) {
    const createdWeather = new this.weatherModel(createWeatherDto);
    return createdWeather.save();
  }

  async findAll() {
    return this.weatherModel.find().sort({ createdAt: -1 }).limit(100).exec();
  }

  // --- NOVO MÉTODO: Lógica de "IA" ---
  async generateInsights() {
    // 1. Pega o dado mais recente
    const lastLog = await this.weatherModel.findOne().sort({ createdAt: -1 }).exec();

    if (!lastLog) {
      return {
        message: "Ainda não há dados suficientes para análise.",
        level: "info", // info, warning, danger
        icon: "🔍"
      };
    }

    const { temp_c, humidity, wind_speed } = lastLog;
    let insights: { msg: string; type: string }[] = [];

    // 2. Regras de inferência (Expert System)
    
    // Análise de Temperatura
    if (temp_c > 30) {
      insights.push({ msg: "Calor extremo detectado! Mantenha-se hidratado. 🥵", type: "danger" });
    } else if (temp_c > 25) {
      insights.push({ msg: "Dia quente. Ótimo para atividades ao ar livre (com proteção solar). ☀️", type: "warning" });
    } else if (temp_c < 15) {
      insights.push({ msg: "Frente fria. Recomenda-se usar casaco térmico. 🥶", type: "info" });
    } else {
      insights.push({ msg: "Temperatura agradável e estável. 👌", type: "success" });
    }

    // Análise de Umidade
    if (humidity < 30) {
      insights.push({ msg: "Umidade crítica (<30%). Risco de irritação respiratória. 🌵", type: "warning" });
    } else if (humidity > 80) {
      insights.push({ msg: "Umidade alta. Sensação térmica pode ser maior que a real. 💧", type: "info" });
    }

    // Análise de Vento
    if (wind_speed > 20) {
      insights.push({ msg: "Ventos fortes registrados. Cuidado com janelas e objetos soltos. 🍃", type: "danger" });
    }

    // Retorna o insight mais prioritário (Danger > Warning > Info)
    const priority = insights.find(i => i.type === 'danger') || 
                     insights.find(i => i.type === 'warning') || 
                     insights[0];

    return {
      summary: priority.msg,
      details: insights.map(i => i.msg),
      generated_at: new Date()
    };
  }

  // Adicione dentro da classe WeatherService

async getCsvData(): Promise<string> {
  const logs = await this.weatherModel.find().sort({ createdAt: -1 }).limit(1000).exec();
  
  // Cabeçalho do CSV
  const header = 'ID,Data,Temperatura (C),Umidade (%),Vento (km/h)\n';
  
  // Linhas
  const rows = logs.map(log => {
    // Formatar data para ISO ou pt-BR
    const date = new Date(log['createdAt']).toISOString(); 
    return `${log._id},${date},${log.temp_c},${log.humidity},${log.wind_speed}`;
  }).join('\n');

  return header + rows;
}
}