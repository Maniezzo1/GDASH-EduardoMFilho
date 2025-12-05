import { Injectable } from "@nestjs/common"
import type { HttpService } from "@nestjs/axios"
import { firstValueFrom } from "rxjs"

@Injectable()
export class PokemonService {
  private readonly baseUrl = "https://pokeapi.co/api/v2"

  constructor(private httpService: HttpService) {}

  async getPokemonList(page = 1, limit = 20) {
    const offset = (page - 1) * limit
    const url = `${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`

    const response = await firstValueFrom(this.httpService.get(url))
    const data = response.data

    return {
      results: data.results,
      count: data.count,
      page,
      limit,
      totalPages: Math.ceil(data.count / limit),
    }
  }

  async getPokemonDetails(idOrName: string) {
    const url = `${this.baseUrl}/pokemon/${idOrName}`
    const response = await firstValueFrom(this.httpService.get(url))
    return response.data
  }
}
