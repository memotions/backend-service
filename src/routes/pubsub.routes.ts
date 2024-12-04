import { Router } from 'express';
import PubsubController from '../controllers/pubsub.controller';

const router = Router();

router.get('/', PubsubController.hello)
router.post('/', PubsubController.processJournalEvent);


export default router;
