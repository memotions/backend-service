import { Router } from 'express';
import {
  createJournalController,
  getJournalByIdController,
  getJournalsController,
} from '../controllers/journals.controller';

const router = Router();

router.post('/', createJournalController);
router.get('/', getJournalsController);
router.get('/:id', getJournalByIdController);

export default router;
