import { Controller, Get, Post, Res, UseGuards } from "@nestjs/common"
import type { Response } from "express"
import type { WeatherService } from "./weather.service"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"

@Controller("weather")
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  @Post("logs")
  create(body: any) {
    return this.weatherService.create(body)
  }

  @Get("logs")
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.weatherService.findAll()
  }

  @Get("insights")
  @UseGuards(JwtAuthGuard)
  getInsights() {
    return this.weatherService.generateInsights()
  }

  @Get('export/csv')
  @UseGuards(JwtAuthGuard)
  async exportCSV(@Res() res: Response) {
    const csv = await this.weatherService.exportCSV();
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=weather-data.csv');
    res.send(csv);
  }

  @Get('export/xlsx')
  @UseGuards(JwtAuthGuard)
  async exportXLSX(@Res() res: Response) {
    const buffer = await this.weatherService.exportXLSX();
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', 'attachment; filename=weather-data.xlsx');
    res.send(buffer);
  }
}
