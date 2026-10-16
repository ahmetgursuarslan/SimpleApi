const { parseTrustProxy } = require('../app/config/env');

describe('parseTrustProxy', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['false', false],
    ['off', false],
    ['0', false],
    ['true', true],
    ['YES', true],
    // Hop counts stay hop counts; `1` must not widen to "trust everyone".
    ['1', 1],
    ['2', 2],
    [' 3 ', 3],
    // Subnet names and CIDR lists are passed through to proxy-addr.
    ['loopback', 'loopback'],
    ['10.0.0.0/8, 172.16.0.0/12', '10.0.0.0/8, 172.16.0.0/12'],
    ['1.2.3.4', '1.2.3.4'],
  ])('parses %p as %p', (raw, expected) => {
    expect(parseTrustProxy(raw)).toEqual(expected);
  });
});
