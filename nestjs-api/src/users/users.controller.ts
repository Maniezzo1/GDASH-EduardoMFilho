import { Controller, Get, Post, Patch, Delete, Body, UseGuards } from "@nestjs/common"
import type { UsersService } from "./users.service"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  @Get(":id")
  findOne(id: string) {
    return this.usersService.findById(id)
  }

  @Post()
  async create(@Body() body: { email: string; password: string; name: string }) {
    return this.usersService.create(body);
  }

  @Patch(":id")
  update(id: string, @Body() body: Partial<any>) {
    return this.usersService.update(id, body)
  }

  @Delete(":id")
  delete(id: string) {
    return this.usersService.delete(id)
  }
}
