import { Injectable } from "@nestjs/common";
import type { Model } from "mongoose";
import type { WeatherLog } from "./weather-log.schema";
import { Parser } from "json2csv";
import * as ExcelJS from "exceljs";

@Injectable()
export class WeatherService {
  private weatherLogModel: Model<WeatherLog>;

  constructor(weatherLogModel: Model<WeatherLog>) {
    this.weatherLogModel = weatherLogModel;
  }

  async create(weatherData: Partial<WeatherLog>): Promise<WeatherLog> {
    const log = new this.weatherLogModel(weatherData);
    return log.save();
  }

  async findAll(limit = 100): Promise<WeatherLog[]> {
    return this.weatherLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async generateInsights(): Promise<any> {
    const logs = await this.weatherLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(72)
      .exec();

    if (logs.length === 0) {
      return {
        summary: "No weather data available yet.",
        metrics: {},
      };
    }

    const temperatures = logs.map((log) => log.temperature);
    const humidities = logs.map((log) => log.humidity);
    const avgTemp =
      temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    const avgHumidity =
      humidities.reduce((a, b) => a + b, 0) / humidities.length;
    const maxTemp = Math.max(...temperatures);
    const minTemp = Math.min(...temperatures);

    const recentTemps = temperatures.slice(0, 12);
    const olderTemps = temperatures.slice(12, 24);
    const recentAvg =
      recentTemps.reduce((a, b) => a + b, 0) / recentTemps.length;
    const olderAvg =
      olderTemps.reduce((a, b) => a + b, 0) / (olderTemps.length || 1);
    const tempDiff = recentAvg - olderAvg;

    let trend = "stable";
    if (tempDiff > 2) trend = "rising";
    else if (tempDiff < -2) trend = "falling";

    const idealTemp = 22;
    const idealHumidity = 50;
    const tempScore = Math.max(0, 100 - Math.abs(avgTemp - idealTemp) * 5);
    const humidityScore = Math.max(
      0,
      100 - Math.abs(avgHumidity - idealHumidity) * 2
    );
    const comfortScore = Math.round((tempScore + humidityScore) / 2);

    let classification = "pleasant";
    if (avgTemp < 10) classification = "cold";
    else if (avgTemp > 30) classification = "hot";
    else if (logs[0]?.condition === "rainy") classification = "rainy";

    const alerts = [];
    if (avgTemp > 35) alerts.push("Extreme heat warning");
    if (avgTemp < 0) alerts.push("Severe cold warning");
    if (logs[0]?.condition === "rainy" || logs[0]?.condition === "stormy") {
      alerts.push("High chance of rain");
    }

    const summary = `Over the last ${Math.min(
      logs.length,
      72
    )} hours, the average temperature was ${avgTemp.toFixed(
      1
    )}°C (ranging from ${minTemp.toFixed(1)}°C to ${maxTemp.toFixed(
      1
    )}°C) with ${avgHumidity.toFixed(
      0
    )}% humidity. Temperature trend is ${trend}. Current conditions: ${
      logs[0]?.condition
    }.`;

    return {
      summary,
      metrics: {
        avgTemperature: Number(avgTemp.toFixed(1)),
        minTemperature: Number(minTemp.toFixed(1)),
        maxTemperature: Number(maxTemp.toFixed(1)),
        avgHumidity: Number(avgHumidity.toFixed(1)),
        comfortScore,
        trend,
        classification,
        alerts,
        currentCondition: logs[0]?.condition,
        dataPoints: logs.length,
      },
      lastUpdate: logs[0]?.timestamp,
    };
  }

  async exportCSV(): Promise<string> {
    const logs = await this.findAll(1000);
    const data = logs.map((log) => ({
      timestamp: log.timestamp,
      location: log.location,
      temperature: log.temperature,
      humidity: log.humidity,
      windSpeed: log.wind_speed,
      condition: log.condition,
      precipitation: log.precipitation,
    }));

    const parser = new Parser();
    return parser.parse(data);
  }

  async exportXLSX(): Promise<Buffer> {
    const logs = await this.findAll(1000);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Weather Data");

    worksheet.columns = [
      { header: "Timestamp", key: "timestamp", width: 25 },
      { header: "Location", key: "location", width: 20 },
      { header: "Temperature (°C)", key: "temperature", width: 18 },
      { header: "Humidity (%)", key: "humidity", width: 15 },
      { header: "Wind Speed (km/h)", key: "windSpeed", width: 18 },
      { header: "Condition", key: "condition", width: 15 },
      { header: "Precipitation (mm)", key: "precipitation", width: 18 },
    ];

    logs.forEach((log) => {
      worksheet.addRow({
        timestamp: log.timestamp,
        location: log.location,
        temperature: log.temperature,
        humidity: log.humidity,
        windSpeed: log.wind_speed,
        condition: log.condition,
        precipitation: log.precipitation,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
