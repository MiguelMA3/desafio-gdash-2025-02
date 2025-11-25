import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WeatherDocument = HydratedDocument<Weather>;

@Schema({ timestamps: true }) // timestamps cria created_at e updated_at automático
export class Weather {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ required: true })
  temp_c: number;

  @Prop({ required: true })
  humidity: number;

  @Prop({ required: true })
  wind_speed: number;

  @Prop()
  condition_code: number;

  @Prop()
  timestamp: string; // Data original da coleta
}

export const WeatherSchema = SchemaFactory.createForClass(Weather);