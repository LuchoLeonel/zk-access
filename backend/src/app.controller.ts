import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DidService } from './did/did.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly didService: DidService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
