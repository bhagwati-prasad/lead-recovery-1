import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';

describe('Phase 4 Analytics API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns non-empty analytics summary after one simulated call', async () => {
    await request(app.getHttpServer())
      .post('/api/workflow/simulate-call')
      .send({
        leadId: 'lead_001',
        scriptedCustomerUtterances: ['yes, continue'],
      })
      .expect(201);

    const summaryResponse = await request(app.getHttpServer())
      .get('/api/analytics/summary')
      .expect(200);

    expect(summaryResponse.body.summary.callsTotal).toBeGreaterThan(0);
    expect(summaryResponse.body.summary.conversionRate).toBeGreaterThanOrEqual(0);
  });
});
