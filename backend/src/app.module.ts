import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZkEmailService } from './zk/zk-email.service';
import { GmailService } from './gmail/gmail.service';
import { ZkController } from './zk/zk.controller';
import { DidService } from './did/did.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, ZkController],
  providers: [AppService, ZkEmailService, GmailService, DidService],
})
export class AppModule {}
