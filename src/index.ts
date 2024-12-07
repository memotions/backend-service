import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import passport from 'passport';
import Logger from './utils/logger';
import httpLogger from './middlewares/httpLogger';
import authRouter from './routes/auth.routes';
import pubsubRouter from './routes/pubsub.routes';
import journalsRouter from './routes/journals.routes';
import tagsRouter from './routes/tags.routes';
import emotionAnalysisRouter from './routes/emotionAnalysis.routes';
import gameRouter from './routes/game.routes';
import './config/passport.config';
import authHandler from './middlewares/authHandler';
import errorHandler from './middlewares/errorHandler';
import debugLogger from './middlewares/debugLogger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);
app.use(debugLogger);
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Halo, Memothians!',
  });
});

app.use('/auth', authRouter);
app.use('/pubsub', pubsubRouter);
app.use(authHandler);
app.use('/journals', journalsRouter);
app.use('/tags', tagsRouter);
app.use('/emotion-analysis', emotionAnalysisRouter);
app.use('/', gameRouter);

app.use(errorHandler);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  Logger.info(`Server is running on port ${port}`);
});
