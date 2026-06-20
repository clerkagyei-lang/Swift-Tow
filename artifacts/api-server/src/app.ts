import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';
import router from './routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split('?')[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', router);

// Redirect root to admin dashboard
app.get('/', (_req, res) => {
  res.redirect(301, '/admin-dashboard/');
});

const adminDistPath = path.resolve(
  __dirname,
  '../../admin-dashboard/dist/public',
);
app.use('/admin-dashboard', express.static(adminDistPath));
app.get('/admin-dashboard/*path', (_req, res) => {
  res.sendFile(path.join(adminDistPath, 'index.html'));
});

const mobileWebDistPath = path.resolve(
  __dirname,
  '../../mobile/dist-web',
);
app.use('/mobile', express.static(mobileWebDistPath));
app.get('/mobile/*path', (_req, res) => {
  res.sendFile(path.join(mobileWebDistPath, 'index.html'));
});

export default app;
