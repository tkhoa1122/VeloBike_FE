import { AuthRepository } from '../../repositories/AuthRepository';
import { User } from '../../entities/User';

export class GetCurrentUserUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(): Promise<User | null> {
    try {
      // Check if we have a stored token
      const token = await this.authRepository.getStoredToken();
      if (!token) {
        return null;
      }

      // Try to get current user
      const user = await this.authRepository.getCurrentUser();
      return user;
    } catch (error) {
      // If there's an error (like 401), clear the token
      await this.authRepository.clearStoredToken();
      return null;
    }
  }
}