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
  <p><strong>BANDITE Sonic Walkscape</strong><br>Last updated: June 2026</p>

  <h2>1. Data We Collect</h2>
  <p>We collect the following data when you use the app:</p>
  <ul>
    <li><strong>Account data:</strong> email address and name when you register.</li>
    <li><strong>Location data:</strong> GPS coordinates while you are on a tour, including in the background when the app is not actively on screen. This is used solely to trigger audio playback at GPS waypoints along the tour route.</li>
    <li><strong>Usage analytics:</strong> anonymous events (e.g. tour started, point triggered) with your consent, to improve the experience.</li>
    <li><strong>Crash diagnostics:</strong> if the app crashes, a technical report is sent automatically so we can identify and fix the problem (see section 4).</li>
  </ul>

  <h2>2. Background Location</h2>
  <p>BANDITE Sonic Walkscape accesses your device location <strong>in the background</strong> — even when the app is not open on screen or your phone screen is locked. This is necessary to automatically trigger audio narration as you walk past GPS waypoints during a tour. Location data is processed on-device and is not stored on our servers.</p>

  <h2>3. How We Use Your Data</h2>
  <ul>
    <li>Location data is used exclusively for GPS-triggered audio playback during tours. It is never sold or shared with third parties.</li>
    <li>Analytics data is used to improve tour quality and app performance. It is collected only with your explicit consent.</li>
    <li>Account data is used to manage access to tours and voucher redemption.</li>
  </ul>

  <h2>4. Crash Diagnostics</h2>
  <p>To keep the app stable, we use Sentry (Functional Software, Inc.), an error-monitoring service. If the app crashes, a technical report is sent automatically. It contains the technical state of the app at the moment of the crash, your device model, operating system version and app version. It does not include your name, email address or location history. Crash data is processed on the basis of our legitimate interest in providing a reliable app (Art. 6(1)(f) GDPR), is hosted on Sentry's servers in the European Union, and is automatically deleted after 90 days.</p>

  <h2>5. Data Storage</h2>
  <p>All data is stored on servers located within the European Union, in compliance with GDPR.</p>

  <h2>6. Your Rights</h2>
  <p>You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at <a href="mailto:privacy@bandite.org">privacy@bandite.org</a>.</p>

  <h2>7. Contact</h2>
  <p>BANDITE<br>Email: <a href="mailto:privacy@bandite.org">privacy@bandite.org</a></p>
</body>
</html>`);
  }

  @Public()
  @Get('delete-account')
  @Header('Content-Type', 'text/html')
  getDeleteAccount(@Res() res: Response): void {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delete Your Account – BANDITE Sonic Walkscape</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #222; line-height: 1.7; }
    h1 { font-size: 1.8rem; }
    h2 { font-size: 1.2rem; margin-top: 2rem; }
    p, li { font-size: 1rem; }
  </style>
</head>
<body>
  <h1>Delete Your Account</h1>
  <p><strong>BANDITE Sonic Walkscape</strong></p>

  <p>You can request deletion of your BANDITE Sonic Walkscape account and the personal data associated with it at any time.</p>

  <h2>How to request deletion</h2>
  <ol>
    <li>Send an email to <a href="mailto:privacy@bandite.org">privacy@bandite.org</a> from the email address associated with your account.</li>
    <li>Use the subject line <strong>"Delete my account"</strong>.</li>
    <li>We will verify your request and permanently delete your account within 30 days, and confirm by email once it is done.</li>
  </ol>

  <h2>What is deleted</h2>
  <p>Your account data (email address and name), your tour-access records, and any voucher redemptions linked to your account are permanently deleted.</p>

  <h2>What is kept</h2>
  <p>Anonymous, non-identifying usage analytics and crash diagnostics that cannot be linked back to you may be retained. Where we are legally required to keep certain records (for example, for accounting purposes), we retain only what the law requires for the minimum period necessary.</p>

  <h2>Deleting part of your data</h2>
  <p>If you want to delete only some of your data without deleting your whole account, email <a href="mailto:privacy@bandite.org">privacy@bandite.org</a> describing what you would like removed.</p>

  <h2>Contact</h2>
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
