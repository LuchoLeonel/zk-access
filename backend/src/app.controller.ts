import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { VCService } from './vc/vc.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly vcService: VCService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
