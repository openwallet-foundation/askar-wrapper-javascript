import * as koffi from 'koffi'
import { describe, expect, test } from 'vitest'
import { byteBufferToUint8Array, decodeHandleList } from '../src/ffi/index.js'

describe('conversion', () => {
  test.each([0, 1, 2, 3, 31, 32, 33, 1000, 65537])('decodes a native buffer of %i bytes', (len) => {
    const bytes = Uint8Array.from({ length: len }, (_, index) => index % 251)
    const pointer = koffi.alloc('uint8_t', Math.max(len, 1))
    koffi.encode(pointer, 'uint8_t', bytes, len)

    expect(byteBufferToUint8Array({ data: pointer, len })).toEqual(bytes)

    koffi.free(pointer)
  })

  test.each([0, 1, 3])('decodes a native list of %i handles', (len) => {
    const handles = Array.from({ length: len }, (_, index) => index + 10)
    const pointer = koffi.alloc('size_t', Math.max(len, 1))
    koffi.encode(pointer, 'size_t', handles, len)

    expect(decodeHandleList({ data: pointer, len })).toEqual(handles)

    koffi.free(pointer)
  })
})
