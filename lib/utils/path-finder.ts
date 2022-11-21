import {IFeed} from '../types/feed'
import {IPosition} from './../types/common'
import {isWall} from './map'
import {Position} from './position'

interface ISteps {
  [hash: string]: IStepInfo
}

interface IStepInfo {
  from?: IPosition
  direction?: DirectionConstant
}

export const getDirectionTo = (
  start: IPosition,
  end: IPosition,
  map: IFeed,
): DirectionConstant | null => {
  const result = calculateDirectionTo(start, end, map)

  if (!result) {
    return null
  } else {
    return result.direction
  }
}

const calculateDirectionTo = (
  start: IPosition,
  end: IPosition,
  map: IFeed,
  steps: ISteps = {},
  visitedMap: ISteps = {}, // Only carry hashes - no payload
): {
  direction: DirectionConstant
  previousPosition: IPosition
} => {
  if (!Object.keys(steps).length) {
    const hash = Position.hash(start)
    visitedMap[hash] = {}
    steps[hash] = {}
  }

  const targetHash = Position.hash(end)

  if (steps[targetHash]) {
    return {
      direction: steps[targetHash].direction,
      previousPosition: steps[targetHash].from,
    }
  }

  const directions = [
    TOP,
    TOP_RIGHT,
    RIGHT,
    BOTTOM_RIGHT,
    BOTTOM,
    BOTTOM_LEFT,
    LEFT,
    TOP_LEFT,
  ]

  const nextSteps: ISteps = {}

  for (const [hash] of Object.entries(steps)) {
    const position = Position.decodeFromHash(hash)

    for (const direction of directions) {
      const potentialPosition = Position.moveToDirection(position, direction)

      if (
        potentialPosition.x < 0 ||
        potentialPosition.y < 0 ||
        potentialPosition.x >= map.room.width ||
        potentialPosition.y >= map.room.height ||
        isWall(potentialPosition, map) ||
        (map.objects.find(obj => Position.equal(potentialPosition, obj.pos)) &&
          !Position.equal(end, potentialPosition))
      ) {
        continue
      }

      const nextHash = Position.hash(potentialPosition)

      if (visitedMap[nextHash]) {
        continue
      }

      visitedMap[nextHash] = {}

      nextSteps[nextHash] = {
        direction,
        from: position,
      }
    }
  }

  if (!Object.keys(nextSteps).length) {
    return null
  }

  const result = calculateDirectionTo(start, end, map, nextSteps, visitedMap)

  if (result === null) {
    return null
  } else if (Position.equal(result.previousPosition, start)) {
    return result
  }

  const hash = Position.hash(result.previousPosition)

  return {
    direction: steps[hash].direction,
    previousPosition: steps[hash].from,
  }
}
