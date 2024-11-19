import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Logger from './utils/logger';
import httpLogger from './middlewares/httpLogger';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Halo, Memothians!',
  });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  Logger.info(`Server is running on port ${port}`);
});
