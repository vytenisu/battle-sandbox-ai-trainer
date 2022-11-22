import {getMyCreeps} from './map'
import {ICommand} from './../types/commands'
import {IFeed} from '../types/feed'
import {Network} from './network'
import {ICreep} from '../types/simplified-screeps'
import {normalize} from './normalizer'

export const NeuroBot =
  (net: Network, pushNullCommands = false) =>
  (map: IFeed): ICommand[] => {
    const myCreeps = getMyCreeps(map)

    const result: ICommand[] = []

    for (const creep of myCreeps) {
      const command = getCreepCommand(creep, map, net)

      if (command || pushNullCommands) {
        result.push(command)
      }
    }

    return result
  }

const getCreepCommand = (
  creep: ICreep,
  map: IFeed,
  net: Network,
): ICommand | null => {
  const normalizedMap = normalize(map, creep.id)
  return net.predict(normalizedMap, map, creep.id)
}
