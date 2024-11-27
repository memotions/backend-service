import { Router } from 'express';
import TagsController from '../controllers/tags.controller';

const router = Router();

router.post('/', TagsController.createTag);
router.get('/', TagsController.findAllTags);
router.get('/:tagId', TagsController.findTagById);
router.delete('/:tagId', TagsController.deleteTag);

export default router;
