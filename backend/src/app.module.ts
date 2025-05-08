import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZkService } from './zk/zk.service';
import { VCService } from './vc/vc.service';
import { VcCredentialController } from './vc/vc.controller';
import { ZkController } from './zk/zk.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      synchronize: true,
    }),
  ],
  controllers: [AppController, VcCredentialController, ZkController],
  providers: [AppService, VCService, ZkService],
})
export class AppModule {}
