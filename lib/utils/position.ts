import {IPosition} from '../types/common'

export class Position {
  public static fromRoomPosition(roomPosition: RoomPosition): IPosition {
    return {x: roomPosition.x, y: roomPosition.y}
  }

  public static hash(pos: IPosition): string {
    return `${pos.x}:${pos.y}`
  }

  public static decodeFromHash(hash: string): IPosition {
    const [x, y] = hash.split(':').map(Number)
    return {x, y}
  }

  public static near(a: IPosition, b: IPosition): boolean {
    return Boolean(
      Math.abs(a.x - b.x) <= 1 &&
        Math.abs(a.y - b.y) <= 1 &&
        !Position.equal(a, b),
    )
  }

  public static equal(...positions: IPosition[]): boolean {
    const hashes = positions.map(pos => Position.hash(pos))
    return Boolean(hashes.every(hash => hash === hashes[0]))
  }

  public static touching(a: IPosition, b: IPosition): boolean {
    return Boolean(
      (Math.abs(a.x - b.x) === 1 && a.y - b.y === 0) ||
        (a.x - b.x === 0 && Math.abs(a.y - b.y) === 1),
    )
  }

  public static moveToDirection(
    pos: IPosition,
    direction: DirectionConstant,
  ): IPosition {
    switch (direction) {
      case TOP:
        return {x: pos.x, y: pos.y - 1}
      case TOP_RIGHT:
        return {x: pos.x + 1, y: pos.y - 1}
      case RIGHT:
        return {x: pos.x + 1, y: pos.y}
      case BOTTOM_RIGHT:
        return {x: pos.x + 1, y: pos.y + 1}
      case BOTTOM:
        return {x: pos.x, y: pos.y + 1}
      case BOTTOM_LEFT:
        return {x: pos.x - 1, y: pos.y + 1}
      case LEFT:
        return {x: pos.x - 1, y: pos.y}
      case TOP_LEFT:
        return {x: pos.x - 1, y: pos.y - 1}
      default:
        return pos
    }
  }

  public static reverseDirection(
    direction: DirectionConstant,
  ): DirectionConstant {
    switch (direction) {
      case TOP:
        return BOTTOM
      case TOP_RIGHT:
        return BOTTOM_LEFT
      case RIGHT:
        return LEFT
      case BOTTOM_RIGHT:
        return TOP_LEFT
      case BOTTOM:
        return TOP
      case BOTTOM_LEFT:
        return TOP_RIGHT
      case LEFT:
        return RIGHT
      case TOP_LEFT:
        return BOTTOM_RIGHT
      default:
        return TOP
    }
  }

  public static getOptimisticDistance(a: IPosition, b: IPosition) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
  }

  public static getDirection(
    from: IPosition,
    to: IPosition,
  ): DirectionConstant {
    const diffX = to.x - from.x
    const diffY = to.y - from.y

    if (diffX === 0 && diffY < 0) {
      return TOP
    } else if (diffX > 0 && diffY < 0) {
      return TOP_RIGHT
    } else if (diffX > 0 && diffY === 0) {
      return RIGHT
    } else if (diffX > 0 && diffY > 0) {
      return BOTTOM_RIGHT
    } else if (diffX === 0 && diffY > 0) {
      return BOTTOM
    } else if (diffX < 0 && diffY > 0) {
      return BOTTOM_LEFT
    } else if (diffX < 0 && diffY === 0) {
      return LEFT
    }

    return TOP_LEFT
  }
}
