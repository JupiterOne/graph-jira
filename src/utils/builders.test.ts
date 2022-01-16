import { normalizeProjectKeys } from './builders';

describe('normalizeProjectKeys', () => {
  test('array, multiple entries', () => {
    expect(normalizeProjectKeys(['string1', 'string2'])).toEqual([
      'string1',
      'string2',
    ]);
  });

  test('array, blank entries', () => {
    expect(normalizeProjectKeys(['string1', '', '  '])).toEqual(['string1']);
  });

  test('string, one entry', () => {
    expect(normalizeProjectKeys('string1')).toEqual(['string1']);
  });

  test('JSON array, multiple entries', () => {
    expect(normalizeProjectKeys('[ "string1", "string2" ]')).toEqual([
      'string1',
      'string2',
    ]);
  });

  test('JSON array, blank entries', () => {
    expect(normalizeProjectKeys('[ "string1", "", "    " ]')).toEqual([
      'string1',
    ]);
  });
});
