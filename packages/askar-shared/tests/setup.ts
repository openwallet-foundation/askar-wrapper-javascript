import { afterAll, afterEach, expect } from 'vitest'
import { removeStoreDirectory } from './utils/initialize'
import { trackNativeResources } from './utils/resources'

// Every test frees what it creates: keys, entry lists, sessions, scans and stores. Runs after the tests' own afterEach
const resources = trackNativeResources()

afterEach(() => {
  expect(resources.takeOpen()).toEqual([])
})

afterAll(removeStoreDirectory)
