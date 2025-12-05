import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document } from "mongoose"

@Schema({ timestamps: true })
export class WeatherLog extends Document {
  @Prop({ required: true })
  timestamp: string

  @Prop({ required: true })
  location: string

  @Prop({ required: true })
  latitude: number

  @Prop({ required: true })
  longitude: number

  @Prop({ required: true })
  temperature: number

  @Prop({ required: true })
  humidity: number

  @Prop({ required: true })
  wind_speed: number

  @Prop({ required: true })
  precipitation: number

  @Prop({ required: true })
  weather_code: number

  @Prop({ required: true })
  condition: string
}

export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog)
