import { Router } from 'express';
import PubsubController from '../controllers/pubsub.controller';

const router = Router();

router.post('/', PubsubController.processOnJournalPublished);

export default router;
