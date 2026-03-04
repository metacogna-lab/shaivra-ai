import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';
import { webcrypto } from 'node:crypto';

if (!globalThis.TextEncoder) {
  // @ts-expect-error - assigning to global scope for test runtime
  globalThis.TextEncoder = TextEncoder;
}

if (!globalThis.TextDecoder) {
  // @ts-expect-error - assigning to global scope for test runtime
  globalThis.TextDecoder = TextDecoder;
}

if (!globalThis.crypto?.subtle) {
  // @ts-expect-error - align Node's webcrypto with browser expectation
  globalThis.crypto = webcrypto as Crypto;
}
