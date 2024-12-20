import type { Askar } from './Askar'

export let askar: Askar

export const registerAskar = ({ _askar }: { _askar: Askar }) => (askar = _askar)
