import { Router } from 'express';
import JournalsController from '../controllers/journals.controller';

const router = Router();

router.post('/', JournalsController.addJournal);
router.get('/', JournalsController.findJournals);
router.get('/:journalId', JournalsController.findJournalById);
router.patch('/:journalId', JournalsController.updateJournalById);
router.delete('/:journalId', JournalsController.deleteJournalById);
router.patch('/:journalId/star', JournalsController.toggleStarJournal);
router.get('/:journalId/tags', JournalsController.findJournalTags);
router.patch('/:journalId/tags/:tagId', JournalsController.toggleJournalTag);

export default router;
