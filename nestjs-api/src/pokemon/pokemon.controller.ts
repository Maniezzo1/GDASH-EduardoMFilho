import { Controller, Get, Param, UseGuards } from "@nestjs/common"
import type { PokemonService } from "./pokemon.service"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"

@Controller("pokemon")
@UseGuards(JwtAuthGuard)
export class PokemonController {
  constructor(private pokemonService: PokemonService) {}

  @Get()
  getPokemonList(page = 1, limit = 20) {
    return this.pokemonService.getPokemonList(Number(page), Number(limit))
  }

  @Get(':id')
  getPokemonDetails(@Param('id') id: string) {
    return this.pokemonService.getPokemonDetails(id);
  }
}
