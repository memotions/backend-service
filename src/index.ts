import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import passport from 'passport';
import Logger from './utils/logger';
import httpLogger from './middlewares/httpLogger';
import authRouter from './routes/auth.routes';
import journalsRouter from './routes/journals.routes';
import './config/passport.config';
import authHandler from './middlewares/authHandler';
import errorHandler from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);
app.use(passport.initialize());

app.use('/auth', authRouter);
app.use(authHandler);
app.use('/journals', journalsRouter);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Halo, Memothians!',
  });
});

app.use(errorHandler);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  Logger.info(`Server is running on port ${port}`);
});
