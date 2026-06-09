import { describe, it, expect } from 'vitest';
import { server } from '../mocks/server';
import { handlers } from '../mocks/handlers';
import { fetchMe } from './authService';


describe('fetchMe', () => {
  it('should_resolveWithUser_on200', async () => {
    const user = await fetchMe();
    expect(user.id).toBe('user-uuid-1');
    expect(user.firstName).toBe('Test');
    expect(user.lastName).toBe('User');
    expect(user.email).toBe('test@example.com');
  });

  it('should_throw_on401', async () => {
    server.use(handlers.auth.me.unauthorized);
    await expect(fetchMe()).rejects.toThrow();
  });

  it('should_throw_on500', async () => {
    server.use(handlers.auth.me.serverError);
    await expect(fetchMe()).rejects.toThrow();
  });
});
