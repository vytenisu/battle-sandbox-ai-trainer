export type INormalizedFeed = INormalizedRows[]

export type INormalizedRows = INormalizedCell[]

export type INormalizedCell = [
  plain: number,
  swamp: number,
  wall: number,
  attackScore: number,
  moveScore: number,
  control: number,
  friendly: number,
  fatigue: number,
  ticksToLive: number,
]

export type IRawOutput = [
  moveTop: number,
  moveTopRight: number,
  moveRight: number,
  moveBottomRight: number,
  moveBottom: number,
  moveBottomLeft: number,
  moveLeft: number,
  moveTopLeft: number,
  attackTop: number,
  attackTopRight: number,
  attackRight: number,
  attackBottomRight: number,
  attackBottom: number,
  attackBottomLeft: number,
  attackLeft: number,
  attackTopLeft: number,
]
