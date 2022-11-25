import {ECommand, ICommand} from './../types/commands'
import {FATIGUE_SWAMP} from './../constants/screeps'
import {
  INormalizedCell,
  INormalizedFeed,
  INormalizedSample,
  IRawOutput,
  ISample,
} from './../types/network'
import {IFeed} from './../types/feed'
import {getCreepById, getCreepByPosition, isSwamp, isWall} from './map'
import {ICreep} from '../types/simplified-screeps'
import {MAX_BODY_SIZE} from '../constants/screeps'
import {Position} from './position'

const BODY_PART_SCORE_K = 1.2
const BODY_PART_SCORE_B = 1

export const balanceSamples = (samples: ISample[]) => {
  let amounts = new Array(16).fill(0)

  let normalizedResults: IRawOutput[] = []

  samples.forEach((sample, index) => {
    normalizedResults.push(normalizeResult(sample.command, sample.map))
    const selectedAction = normalizedResults[index].indexOf(1)

    if (selectedAction !== -1) {
      amounts[selectedAction]++
    }
  })

  const maxAmount = Math.min(...amounts)
  const remainingAmounts = new Array(16).fill(maxAmount)

  const balancedSamples: ISample[] = []

  samples.forEach((sample, index) => {
    const selectedAction = normalizedResults[index].indexOf(1)

    if (remainingAmounts[selectedAction]) {
      balancedSamples.push(sample)
      remainingAmounts[selectedAction]--
    }
  })

  return balancedSamples
}

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

      let attackScore = 0
      let moveScore = 0
      let control = 0
      let friendly = 0
      let ticksToLive = 0
      let hits = 0

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

        hits = normalizeNumber(creep.hits, creep.hitsMax)
        ticksToLive = normalizeNumber(creep.ticksToLive, CREEP_LIFE_TIME)
      }

      const normalizedX = normalizeNumber(x, map.room.width)
      const normalizedY = normalizeNumber(y, map.room.height)

      const cell: INormalizedCell = [
        normalizedX,
        normalizedY,
        swamp,
        wall,
        control ? attackScore : 0,
        control ? moveScore : 0,
        control ? hits : 0,
        control ? ticksToLive : 0,
        friendly && !control ? attackScore : 0,
        friendly && !control ? moveScore : 0,
        friendly && !control ? hits : 0,
        friendly && !control ? ticksToLive : 0,
        !friendly ? attackScore : 0,
        !friendly ? attackScore : 0,
        !friendly ? hits : 0,
        !friendly ? ticksToLive : 0,
      ]

      normalizedFeed[y] = normalizedFeed[y] ? normalizedFeed[y] : []
      normalizedFeed[y].push(cell)
    }
  }

  return normalizedFeed
}

export const normalizeResult = (command: ICommand, map: IFeed): IRawOutput => {
  let direction: DirectionConstant = TOP

  const {type} = command

  if (type === ECommand.ATTACK) {
    const sourceCreep = getCreepById(command.payload.sourceId, map)
    const targetCreep = getCreepById(command.payload.targetId, map)
    direction = Position.getDirection(sourceCreep.pos, targetCreep.pos)
  } else {
    direction = command.payload.direction
  }

  return [
    Number(type === ECommand.MOVE && direction === TOP),
    Number(type === ECommand.MOVE && direction === TOP_RIGHT),
    Number(type === ECommand.MOVE && direction === RIGHT),
    Number(type === ECommand.MOVE && direction === BOTTOM_RIGHT),
    Number(type === ECommand.MOVE && direction === BOTTOM),
    Number(type === ECommand.MOVE && direction === BOTTOM_LEFT),
    Number(type === ECommand.MOVE && direction === LEFT),
    Number(type === ECommand.MOVE && direction === TOP_LEFT),
    Number(type === ECommand.ATTACK && direction === TOP),
    Number(type === ECommand.ATTACK && direction === TOP_RIGHT),
    Number(type === ECommand.ATTACK && direction === RIGHT),
    Number(type === ECommand.ATTACK && direction === BOTTOM_RIGHT),
    Number(type === ECommand.ATTACK && direction === BOTTOM),
    Number(type === ECommand.ATTACK && direction === BOTTOM_LEFT),
    Number(type === ECommand.ATTACK && direction === LEFT),
    Number(type === ECommand.ATTACK && direction === TOP_LEFT),
  ]
}

export const normalizeSample = (sample: ISample): INormalizedSample => ({
  xs: normalize(sample.map, sample.controlledCreepId),
  ys: normalizeResult(sample.command, sample.map),
})

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
