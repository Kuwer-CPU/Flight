import { describe, expect, it } from 'vitest';
import { partnerResourceOrigins } from '../../src/lib/partner-resource-origins';

describe('partner CSP resources', () => {
  it('normalizes and deduplicates explicitly configured HTTPS origins', () => {
    expect(partnerResourceOrigins(' https://tpwidg.com/, https://TPWIDG.com, https://partner-cdn.net ')).toEqual(['https://tpwidg.com', 'https://partner-cdn.net']);
  });
  it.each([undefined, '', 'http://tpwidg.com', '*', 'https:', "https://tpwidg.com; script-src *", 'https://user:password@tpwidg.com', 'https://tpwidg.com/widget.js', 'https://tpwidg.com?secret=private', 'https://localhost', 'https://tpwidg.com,', 'https://tpwidg.com,#unsafe'])('never expands CSP from an invalid source: %s', source => {
    expect(partnerResourceOrigins(source)).toEqual([]);
  });
});
