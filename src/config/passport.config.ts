import 'dotenv/config';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import AuthService from '../services/auth.service';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    AuthService.jwtVerifyCallback,
  ),
);
