import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Executa quando o sistema inicia
  async onModuleInit() {
    // Verifica se já existe algum usuário, se não, cria o admin padrão
    const adminExists = await this.findOne('admin');
    if (!adminExists) {
      console.log('⚠️ Criando usuário padrão: admin / admin123');
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash('admin123', salt);
      const newUser = new this.userModel({
        username: 'admin',
        password: hashedPassword,
      });
      await newUser.save();
    }
  }

  async findOne(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }
  
  async create(user: any): Promise<UserDocument> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }
}