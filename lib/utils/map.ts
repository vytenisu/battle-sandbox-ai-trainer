import {IPosition} from '../types/common'
import {IFeed} from '../types/feed'
import {EObjectType, ICreep} from '../types/simplified-screeps'
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

export const getCreepById = (id: string, map: IFeed): ICreep =>
  map.objects.find(obj => obj.objectType === EObjectType.CREEP && obj.id === id)

export const getCreepByPosition = (pos: IPosition, map: IFeed): ICreep =>
  map.objects.find(
    obj => obj.objectType === EObjectType.CREEP && Position.equal(pos, obj.pos),
  )

export const getMyCreeps = (map: IFeed) =>
  map.objects.filter(obj => obj.objectType === EObjectType.CREEP && obj.my)

export const getEnemyCreeps = (map: IFeed) =>
  map.objects.filter(obj => obj.objectType === EObjectType.CREEP && !obj.my)
