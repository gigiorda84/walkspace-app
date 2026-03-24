import { Controller, Get, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('privacy')
  @Header('Content-Type', 'text/html')
  getPrivacyPolicy(@Res() res: Response): void {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy – BANDITE Sonic Walkscape</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #222; line-height: 1.7; }
    h1 { font-size: 1.8rem; }
    h2 { font-size: 1.2rem; margin-top: 2rem; }
    p, li { font-size: 1rem; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p><strong>BANDITE Sonic Walkscape</strong><br>Last updated: March 2026</p>

  <h2>1. Data We Collect</h2>
  <p>We collect the following data when you use the app:</p>
  <ul>
    <li><strong>Account data:</strong> email address and name when you register.</li>
    <li><strong>Location data:</strong> GPS coordinates while you are on a tour, including in the background when the app is not actively on screen. This is used solely to trigger audio playback at GPS waypoints along the tour route.</li>
    <li><strong>Usage analytics:</strong> anonymous events (e.g. tour started, point triggered) with your consent, to improve the experience.</li>
  </ul>

  <h2>2. Background Location</h2>
  <p>BANDITE Sonic Walkscape accesses your device location <strong>in the background</strong> — even when the app is not open on screen or your phone screen is locked. This is necessary to automatically trigger audio narration as you walk past GPS waypoints during a tour. Location data is processed on-device and is not stored on our servers.</p>

  <h2>3. How We Use Your Data</h2>
  <ul>
    <li>Location data is used exclusively for GPS-triggered audio playback during tours. It is never sold or shared with third parties.</li>
    <li>Analytics data is used to improve tour quality and app performance. It is collected only with your explicit consent.</li>
    <li>Account data is used to manage access to tours and voucher redemption.</li>
  </ul>

  <h2>4. Data Storage</h2>
  <p>All data is stored on servers located within the European Union, in compliance with GDPR.</p>

  <h2>5. Your Rights</h2>
  <p>You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at <a href="mailto:privacy@bandite.org">privacy@bandite.org</a>.</p>

  <h2>6. Contact</h2>
  <p>BANDITE<br>Email: <a href="mailto:privacy@bandite.org">privacy@bandite.org</a></p>
</body>
</html>`);
  }

  @Public()
  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
