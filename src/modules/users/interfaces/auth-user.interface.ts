import { Role } from '../../../common/constants/role.constant';
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}
