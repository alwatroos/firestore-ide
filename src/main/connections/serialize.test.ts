import type { StoredConnection } from '@shared/types/connection';
import { describe, expect, it } from 'vitest';
import { parseServiceAccount, toMeta } from './serialize';

describe('toMeta', () => {
  it('strips encrypted credentials from stored connections', () => {
    const stored: StoredConnection = {
      id: '1',
      name: 'Prod',
      projectId: 'p',
      clientEmail: 'svc@p.iam',
      createdAt: '2026-01-01T00:00:00.000Z',
      encryptedCredentials: 'cipher',
    };
    const meta = toMeta(stored);
    expect(meta).not.toHaveProperty('encryptedCredentials');
    expect(meta.projectId).toBe('p');
  });
});

describe('parseServiceAccount', () => {
  it('parses a valid key', () => {
    const json = JSON.stringify({ project_id: 'p', client_email: 'e', private_key: 'k' });
    expect(parseServiceAccount(json).project_id).toBe('p');
  });

  it('throws when required fields are missing', () => {
    expect(() => parseServiceAccount('{}')).toThrow();
  });
});
