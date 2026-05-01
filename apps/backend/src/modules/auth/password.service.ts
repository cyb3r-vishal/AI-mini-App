import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';

/**
 * Password hashing (bcrypt). Centralized so the cost factor is consistent.
 */
export const passwordService = {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
  },
  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },
};
