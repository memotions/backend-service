import { Router } from 'express';
import PubsubController from '../controllers/pubsub.controller';

const router = Router();

router.post('/', PubsubController.processJournalEvent);

export default router;
