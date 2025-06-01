import { expect, test } from '@playwright/test';

import self from './parse-value.js';

test('works', () => {
  expect(self(JSON.stringify({ foo: 'bar' }), 'object')).toEqual({
    foo: 'bar',
  });

  expect(self('42', 'number')).toEqual(42);
  expect(self('42.5', 'integer')).toEqual(42.5);
  expect(self('true', 'boolean')).toBeTruthy();
  expect(self('false', 'boolean')).toBeFalsy();
  expect(self('', 'integer')).toBeUndefined();
  expect(self('foo')).toEqual('foo');
});
