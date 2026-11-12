import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  mongoUri: process.env.MONGODB_URI || '',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  demoPassword: process.env.DEMO_PASSWORD || 'Demo@123',
  paymentGateway: process.env.PAYMENT_GATEWAY || 'simulated',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  gpsDeviceKey: process.env.GPS_DEVICE_KEY || 'demo-gps-device-key',
  cloudinaryUrl: process.env.CLOUDINARY_URL || '',
};

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}
