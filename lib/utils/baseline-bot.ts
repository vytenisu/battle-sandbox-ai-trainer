import {EObjectType, ICreep} from '../types/simplified-screeps'
import {ECommand, ICommand} from './../types/commands'
import {IFeed} from './../types/feed'
import {getDirectionTo} from './path-finder'
import {Position} from './position'

export const BaselineBot = (map: IFeed): ICommand[] => {
  const myCreeps = map.objects.filter(
    obj => obj.objectType === EObjectType.CREEP && obj.my,
  )

  const result: ICommand[] = []

  for (const creep of myCreeps) {
    const command = getCreepCommand(creep, map)

    if (command) {
      result.push(command)
    }
  }

  return result
}

const getCreepCommand = (creep: ICreep, map: IFeed): ICommand => {
  const target = getClosestOpponent(creep, map)

  if (Position.near(creep.pos, target.pos)) {
    return {
      type: ECommand.ATTACK,
      payload: {
        sourceId: creep.id,
        targetId: target.id,
      },
    }
  } else {
    if (!creep.fatigue) {
      const direction = getDirectionTo(creep.pos, target.pos, map)

      return {
        type: ECommand.MOVE,
        payload: {
          sourceId: creep.id,
          direction,
        },
      }
    }
  }
}

const getClosestOpponent = (creep: ICreep, map: IFeed): ICreep => {
  const enemyCreeps = map.objects.filter(
    obj => obj.objectType === EObjectType.CREEP && !obj.my,
  )

  let recordDistance: number = Infinity
  let recordCreep: ICreep = null

  for (const enemyCreep of enemyCreeps) {
    const distance = Position.getOptimisticDistance(enemyCreep.pos, creep.pos)

    if (distance < recordDistance) {
      recordCreep = enemyCreep
      recordDistance = distance
    }
  }

  return recordCreep
}
