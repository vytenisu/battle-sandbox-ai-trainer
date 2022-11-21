import * as constants from './screeps'

const g = global as any

for (const [key, value] of Object.entries(constants)) {
  g[key] = value
}
