import { Router } from 'express';
import JournalsController from '../controllers/journals.controller';

const router = Router();

router.post('/', JournalsController.addJournal);
router.get('/', JournalsController.findJournals);
router.get('/:journalId', JournalsController.findJournalById);
router.delete('/:journalId', JournalsController.deleteJournalById);
router.get('/:journalId/tags', JournalsController.findJournalTags);
router.post('/:journalId/tags', JournalsController.addJournalTags);
router.delete(
  '/:journalId/tags/:tagId',
  JournalsController.deleteJournalTagById,
);

export default router;
