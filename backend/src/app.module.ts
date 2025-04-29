import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZkEmailProcessorService } from './zk/zk.service';
import { GmailService } from './gmail/gmail.service';
import { VCService } from './vc/vc.service';
import { MyCredential } from './vc/my-credential.entity';
import { WellKnownController } from './well-known/well-known.controller';
import { VcController, VcCredentialController, VcOauthController } from './vc/vc.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [MyCredential],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([MyCredential]),
  ],
  controllers: [AppController, WellKnownController, VcController, VcOauthController, VcCredentialController],
  providers: [AppService, ZkEmailProcessorService, GmailService, VCService],
})
export class AppModule {}
