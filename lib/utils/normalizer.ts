import {FATIGUE_SWAMP} from './../constants/screeps'
import {INormalizedCell, INormalizedFeed} from './../types/network'
import {IFeed} from './../types/feed'
import {getCreepByPosition, isSwamp, isWall} from './map'
import {ICreep} from '../types/simplified-screeps'
import {MAX_BODY_SIZE} from '../constants/screeps'

const BODY_PART_SCORE_K = 1.2
const BODY_PART_SCORE_B = 1

export const normalize = (
  map: IFeed,
  controlledCreepId: string,
): INormalizedFeed => {
  let normalizedFeed: INormalizedFeed = []

  for (let y = 0; y < map.room.height; y++) {
    for (let x = 0; x < map.room.width; x++) {
      const pos = {x, y}

      const swamp = Number(isSwamp(pos, map))
      const wall = Number(isWall(pos, map))
      const plain = Number(!swamp && !wall)

      let attackScore = 0
      let moveScore = 0
      let control = 0
      let friendly = 0
      let fatigue = 0
      let ticksToLive = 0

      const creep = getCreepByPosition(pos, map)

      if (creep) {
        const maxScore = getMaxCreepBodyPartScore()

        attackScore = normalizeNumber(
          getCreepBodyPartScore(creep, ATTACK),
          maxScore,
        )

        moveScore = normalizeNumber(
          getCreepBodyPartScore(creep, MOVE),
          maxScore,
        )

        if (creep.id === controlledCreepId) {
          control = 1
        }

        friendly = Number(creep.my)

        fatigue = normalizeNumber(creep.fatigue, getMaxFatigue())
        ticksToLive = normalizeNumber(creep.ticksToLive, CREEP_LIFE_TIME)
      }

      const cell: INormalizedCell = [
        plain,
        swamp,
        wall,
        attackScore,
        moveScore,
        control,
        friendly,
        fatigue,
        ticksToLive,
      ]

      normalizedFeed[y] = normalizedFeed[y] ? normalizedFeed[y] : []
      normalizedFeed[y].push(cell)
    }
  }

  return normalizedFeed
}

const getCreepBodyPartScore = (creep: ICreep, bodyPartType: BodyPartConstant) =>
  creep.body.reduce(
    (sum, current, index) =>
      current.type === bodyPartType
        ? sum + BODY_PART_SCORE_K * (index + BODY_PART_SCORE_B)
        : sum,
    0,
  )

const getMaxCreepBodyPartScore = () => {
  let score = 0

  for (let index = 1; index <= MAX_BODY_SIZE; index++) {
    score += BODY_PART_SCORE_K * (index + BODY_PART_SCORE_B)
  }

  return score
}

const getMaxFatigue = () => 50 * FATIGUE_SWAMP

const normalizeNumber = (value: number, max: number) => value / max
