import { Injectable, ConflictException, NotFoundException } from "@nestjs/common"
import type { Model } from "mongoose"
import type { User } from "./user.schema"
import type { ConfigService } from "@nestjs/config"
import * as bcrypt from "bcrypt"

@Injectable()
export class UsersService {
  private userModel: Model<User>
  private configService: ConfigService

  constructor(userModel: Model<User>, configService: ConfigService) {
    this.userModel = userModel
    this.configService = configService
  }

  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: userData.email })
    if (existingUser) {
      throw new ConflictException("Email already exists")
    }
    const user = new this.userModel(userData)
    return user.save()
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select("-password").exec()
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select("-password").exec()
    if (!user) {
      throw new NotFoundException("User not found")
    }
    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec()
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10)
    }
    const user = await this.userModel.findByIdAndUpdate(id, userData, { new: true }).select("-password").exec()
    if (!user) {
      throw new NotFoundException("User not found")
    }
    return user
  }

  async delete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec()
    if (!result) {
      throw new NotFoundException("User not found")
    }
  }

  async createDefaultUser() {
    const email = this.configService.get<string>("DEFAULT_USER_EMAIL")
    const password = this.configService.get<string>("DEFAULT_USER_PASSWORD")

    const existingUser = await this.findByEmail(email)
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10)
      await this.create({
        email,
        password: hashedPassword,
        name: "Admin User",
      })
      console.log(`[NestJS API] Default user created: ${email}`)
    }
  }
}
