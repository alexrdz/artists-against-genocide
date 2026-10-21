import { describe, it, expect } from 'vitest';
import { nameToSlug, nameToId, nameToSortKey, evidenceToId, hashString } from '../../src/lib/slug';

describe('slug utilities', () => {
  describe('nameToSlug', () => {
    it('converts a simple name to a slug', () => {
      expect(nameToSlug('Brian Eno')).toBe('brian-eno');
    });

    it('handles special characters', () => {
      expect(nameToSlug('Fontaines D.C.')).toBe('fontaines-dc');
    });

    it('handles Arabic names', () => {
      const slug = nameToSlug('مريم صالح - Maryam Saleh');
      expect(slug).toBeTruthy();
      expect(slug).not.toContain(' ');
    });

    it('handles numbers in names', () => {
      expect(nameToSlug('070 Shake')).toBe('070-shake');
    });

    it('handles names with parentheses', () => {
      const slug = nameToSlug('0046blkn (Germany)');
      expect(slug).not.toContain('(');
      expect(slug).not.toContain(')');
    });

    it('produces a fallback for names that become empty', () => {
      const slug = nameToSlug('!!!');
      expect(slug).toMatch(/^artist-/);
    });

    it('is deterministic — same input yields same output', () => {
      expect(nameToSlug('Brian Eno')).toBe(nameToSlug('Brian Eno'));
    });
  });

  describe('nameToId', () => {
    it('produces a stable ID with a- prefix', () => {
      expect(nameToId('Brian Eno')).toMatch(/^a-[a-z0-9]+$/);
    });

    it('is deterministic', () => {
      expect(nameToId('Brian Eno')).toBe(nameToId('Brian Eno'));
    });

    it('produces different IDs for different names', () => {
      expect(nameToId('Brian Eno')).not.toBe(nameToId('Dua Lipa'));
    });

    it('is case-insensitive', () => {
      expect(nameToId('Brian Eno')).toBe(nameToId('brian eno'));
    });
  });

  describe('evidenceToId', () => {
    it('produces a stable ID with e- prefix', () => {
      expect(evidenceToId('a-abc', 'G-C', 'summary', 'https://example.com')).toMatch(/^e-[a-z0-9]+$/);
    });

    it('is deterministic', () => {
      expect(evidenceToId('a-abc', 'G-C', 'summary', 'https://example.com'))
        .toBe(evidenceToId('a-abc', 'G-C', 'summary', 'https://example.com'));
    });

    it('produces different IDs for different evidence', () => {
      expect(evidenceToId('a-abc', 'G-C', 'summary1', 'https://example.com'))
        .not.toBe(evidenceToId('a-abc', 'G-C', 'summary2', 'https://example.com'));
    });
  });

  describe('nameToSortKey', () => {
    it('strips leading articles', () => {
      expect(nameToSortKey('The Beatles')).toBe('beatles');
    });

    it('handles names without articles', () => {
      expect(nameToSortKey('Brian Eno')).toBe('brian eno');
    });

    it('is case-insensitive', () => {
      expect(nameToSortKey('BRIAN ENO')).toBe('brian eno');
    });
  });

  describe('hashString', () => {
    it('is deterministic', () => {
      expect(hashString('test')).toBe(hashString('test'));
    });

    it('returns different hashes for different strings', () => {
      expect(hashString('test1')).not.toBe(hashString('test2'));
    });

    it('returns a 32-bit unsigned integer', () => {
      const h = hashString('test');
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xFFFFFFFF);
    });
  });
});
