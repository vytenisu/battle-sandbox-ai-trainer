export enum EObjectType {
  CREEP,
}

export type IObject = ICreep & {objectType: EObjectType}

export type ICreep = Pick<
  Creep,
  'id' | 'my' | 'pos' | 'body' | 'hitsMax' | 'hits' | 'fatigue' | 'ticksToLive'
> & {
  objectType: EObjectType.CREEP
}

export type ITerrainMask = TERRAIN_MASK_WALL | TERRAIN_MASK_SWAMP
