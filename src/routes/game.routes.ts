import { Router } from 'express';
import GameController from '../controllers/game.controller';

const router = Router();

router.get('/streak', GameController.getCurrentStreak);
router.get('/level', GameController.getCurrentLevel);
router.get('/stats', GameController.getStats);
router.get('/achievements', GameController.getAllAchievements);
router.get('/achievements/:achievementId', GameController.getAchievementById);

export default router;
