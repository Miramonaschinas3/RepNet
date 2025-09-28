import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [UsersService],
  controllers: [UsersController], 
  imports: [PrismaModule, AuthModule], 
  exports: [UsersService], 
})
export class UsersModule {}
