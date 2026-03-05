import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';
import { webcrypto } from 'node:crypto';

type GlobalLike = typeof globalThis & {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
  crypto?: Crypto;
};

const globalScope = globalThis as GlobalLike;

if (!globalScope.TextEncoder) {
  globalScope.TextEncoder = TextEncoder;
}

if (!globalScope.TextDecoder) {
  globalScope.TextDecoder = TextDecoder;
}

if (!globalScope.crypto?.subtle) {
  globalScope.crypto = webcrypto as unknown as Crypto;
}
