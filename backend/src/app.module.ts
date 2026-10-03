import { Module } from '@nestjs/common';
import { MotpiEngineModule } from './motpi-engine/motpi-engine.module';

@Module({
  imports: [MotpiEngineModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
