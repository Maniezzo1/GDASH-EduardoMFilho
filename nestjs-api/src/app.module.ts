import { Module, type OnModuleInit } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { MongooseModule } from "@nestjs/mongoose"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { WeatherModule } from "./weather/weather.module"
import { PokemonModule } from "./pokemon/pokemon.module"
import type { UsersService } from "./users/users.service"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    WeatherModule,
    PokemonModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    await this.usersService.createDefaultUser()
  }
}
