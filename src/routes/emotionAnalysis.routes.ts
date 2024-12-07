import { Router } from 'express';
import EmotionAnalysisController from '../controllers/emotionsAnalysis.controller';

const router = Router();

router.get('/', EmotionAnalysisController.getEmotionAnalysis);

export default router;
