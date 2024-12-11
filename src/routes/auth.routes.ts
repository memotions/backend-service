import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import authHandler from '../middlewares/authHandler';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.delete('/logout', authHandler, AuthController.logout);
router.get('/profile', authHandler, AuthController.getProfile);

export default router;
