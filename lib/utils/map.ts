import {IPosition} from '../types/common'
import {IFeed} from '../types/feed'
import {Position} from './position'

export const getInvertedMap = (map: IFeed) => {
  const invertedMap: IFeed = JSON.parse(JSON.stringify(map))

  for (const obj of invertedMap.objects) {
    obj.my = !obj.my
  }

  return invertedMap
}

export const isWall = (pos: IPosition, map: IFeed) =>
  getTerrain(pos, map) === TERRAIN_MASK_WALL

export const isSwamp = (pos: IPosition, map: IFeed) =>
  getTerrain(pos, map) === TERRAIN_MASK_SWAMP

export const getTerrain = (pos: IPosition, map: IFeed) =>
  map.terrain[Position.hash(pos)]?.terrain ?? null
