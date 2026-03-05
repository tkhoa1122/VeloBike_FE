import { AuthRepository } from '../../repositories/AuthRepository';

export class LogoutUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(): Promise<void> {
    try {
      // Call server logout - sends refreshToken for revocation
      await this.authRepository.logout();
    } catch (error) {
      // Even if server logout fails, we should clear local data
      console.warn('Server logout failed, but clearing local data', error);
    }
    
    // Always clear local stored tokens (accessToken + refreshToken)
    await this.authRepository.clearStoredTokens();
    await this.authRepository.unregisterPushToken();
  }
}