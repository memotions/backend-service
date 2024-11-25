import { Router } from 'express';
import passport from 'passport';
import {
  register,
  login,
  loginWithGoogle,
} from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
  }),
  loginWithGoogle,
);

export default router;
