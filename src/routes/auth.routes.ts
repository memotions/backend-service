import { Router } from 'express';
import passport from 'passport';
import AuthController from '../controllers/auth.controller';
import authHandler from '../middlewares/authHandler';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', authHandler, AuthController.getProfile);
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
  }),
  AuthController.loginWithGoogle,
);

export default router;
