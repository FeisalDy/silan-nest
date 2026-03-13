import { AuthUser } from '../modules/users/interfaces/auth-user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
