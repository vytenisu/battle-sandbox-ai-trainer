import {INormalizedSample, ISample} from './../types/network'
import {ECommand} from './../types/commands'
import {getCreepById, getEnemyCreeps, getMyCreeps} from './map'
import {Position} from './position'
import {IFeed} from './../types/feed'
import {NeuroBot} from './neuro-bot'
import {Network} from './network'
import {ICommand} from '../types/commands'
import {Random} from './random'
import {DIRECTIONS} from '../constants/screeps'
import {IBot, runBattle} from './runner'
import ProgressBar from 'progress'
import {info, warn} from './log'
import {appendFileSync} from 'fs'
import {resolve} from 'path'
import {ICreep} from '../types/simplified-screeps'
import {resetMap} from '../services/controller'
import {balanceSamples} from './normalizer'

const getNonDeterministicNeuroBot = (
  net: Network,
  onCommandGenerated: (sample: ISample, originalSample: ISample) => void,
  targetIteration = 1,
) => {
  let iteration = 0

  const realBot = NeuroBot(net, true)

  return (map: IFeed): ICommand[] => {
    const commands = realBot(map)

    iteration++

    if (iteration === targetIteration) {
      // Remove random command in order to randomize it

      const randomCommandIndex = Random.getInteger(0, commands.length - 1)
      const deletedCommands = commands.splice(randomCommandIndex, 1)
      const result = commands.filter(Boolean)

      // Find creep which is missing a command

      const myCreeps = getMyCreeps(map)
      const myCreepIds = myCreeps.map(({id}) => id)

      const handledIds = result.map(({payload: {sourceId}}) => sourceId)
      const missingCreepIds = myCreepIds.filter(id => !handledIds.includes(id))

      const selectedCreepId = Random.getArrayItem(missingCreepIds)
      const selectedCreep = getCreepById(selectedCreepId, map)

      // Verify possible attack vectors
      const enemyCreeps = getEnemyCreeps(map)
      const enemyCreepsNearby = enemyCreeps.filter(({pos}) =>
        Position.near(pos, selectedCreep.pos),
      )
      const canAttack = Boolean(enemyCreepsNearby.length)

      // Randomize command

      let availableCommands = [ECommand.MOVE]

      if (canAttack) {
        availableCommands.push(ECommand.ATTACK)
      }

      const selectedCommand = Random.getArrayItem(availableCommands) as ECommand

      let command: ICommand

      if (selectedCommand === ECommand.MOVE) {
        command = {
          type: ECommand.MOVE,
          payload: {
            direction: Random.getArrayItem(DIRECTIONS) as DirectionConstant,
            sourceId: selectedCreepId,
          },
        }
      } else {
        const targetCreep = Random.getArrayItem(enemyCreepsNearby)

        command = {
          type: ECommand.ATTACK,
          payload: {sourceId: selectedCreepId, targetId: targetCreep.id},
        }
      }

      const clonedMap = JSON.parse(JSON.stringify(map))

      const originalSample: ISample = deletedCommands.length
        ? {
            controlledCreepId: deletedCommands[0].payload.sourceId,
            command: deletedCommands[0],
            map: clonedMap,
          }
        : null

      onCommandGenerated(
        {
          controlledCreepId: selectedCreepId,
          command,
          map: clonedMap,
        },
        originalSample,
      )

      result.push(command)

      return result
    }

    return commands.filter(Boolean)
  }
}

export const generateCopySamples = async (
  getCreepCommand: (creep: ICreep, map: IFeed) => ICommand,
  amount: number,
  logContext: string,
  verbose = 1,
  additionalUnbalancedSamples: ISample[] = [],
): Promise<ISample[]> => {
  let samples = []

  const bar = verbose
    ? new ProgressBar(
        `Borrowing ${logContext} samples from baseline [:bar] :percent`,
        {
          total: amount,
          width: 20,
        },
      )
    : null

  for (let i = 0; i < amount; i++) {
    const {map} = await resetMap()

    const myCreeps = getMyCreeps(map)
    const myCreepIds = myCreeps.map(({id}) => id)

    let first = true

    for (const controlledCreepId of myCreepIds) {
      const creep = getCreepById(controlledCreepId, map)
      const command = getCreepCommand(creep, map)
      const sample: ISample = {map, command, controlledCreepId}
      samples.push(sample)

      if (verbose) {
        bar.tick()
      }

      if (first) {
        first = false
      } else {
        i++
      }
    }
  }

  if (verbose) {
    bar.terminate()
  }

  const unbalancedSamples = samples
  samples = balanceSamples([...samples, ...additionalUnbalancedSamples])

  if (!samples.length) {
    warn('No samples were generated! Will retry')

    return await generateCopySamples(
      getCreepCommand,
      amount,
      logContext,
      verbose,
      unbalancedSamples,
    )
  }

  return samples
}

export const generateSamples = async (
  net: Network,
  opponentBot: IBot,
  attempts: number,
  logContext: string,
  modelPath: string,
  maxIterations?: number,
  verbose = 1,
): Promise<ISample[]> => {
  let samples = []

  const bar = verbose
    ? new ProgressBar(`Generating ${logContext} samples [:bar] :percent`, {
        total: attempts,
        width: 20,
      })
    : null

  for (let i = 0; i < attempts; i++) {
    samples.push(await generateSample(net, opponentBot, maxIterations))

    if (verbose) {
      bar.tick()
    }
  }

  if (verbose) {
    bar.terminate()
  }

  const filteredSamples = samples.filter(Boolean)

  if (verbose) {
    info(
      `Generated ${
        filteredSamples.length
      } ${logContext} samples out of ${attempts} attempts (${Math.round(
        (filteredSamples.length / attempts) * 100,
      )}%)`,
    )

    const accuracy = 100 - Math.round((filteredSamples.length / attempts) * 100)

    appendFileSync(
      resolve(modelPath, logContext + '_prediction_success_rate.log'),
      `\n${accuracy}`,
    )

    info(`Prediction success rate: ${accuracy}%`)
  }

  if (!filteredSamples.length) {
    warn(`No ${logContext} samples were generated! Retrying...`)

    return await generateSamples(
      net,
      opponentBot,
      attempts,
      logContext,
      modelPath,
      maxIterations,
      verbose,
    )
  }

  return filteredSamples
}

export const describeSamples = (normalizedSamples: INormalizedSample[]) => {
  let amounts: {[index: string]: number} = {}

  const commandMap: {[i: number]: string} = {
    0: 'moveTop',
    1: 'moveTopRight',
    2: 'moveRight',
    3: 'moveBottomRight',
    4: 'moveBottom',
    5: 'moveBottomLeft',
    6: 'moveLeft',
    7: 'moveTopLeft',
    8: 'attackTop',
    9: 'attackTopRight',
    10: 'attackRight',
    11: 'attackBottomRight',
    12: 'attackBottom',
    13: 'attackBottomLeft',
    14: 'attackLeft',
    15: 'attackTopLeft',
  }

  normalizedSamples.forEach(({ys}) => {
    ys.forEach((y, i) => {
      amounts[commandMap[i]] = amounts[commandMap[i]] ?? 0
      amounts[commandMap[i]] += y
    })

    if (ys.every(y => !y)) {
      amounts['-'] = amounts['-'] ?? 0
      amounts['-']++
    }
  })

  info(`Sample distribution: ${Object.values(amounts).join(', ')}`)
  info(`Generated samples: ${normalizedSamples.length}`)
}

const generateSample = async (
  net: Network,
  opponentBot: IBot,
  maxIterations = 100,
): Promise<ISample | null> => {
  let potentialSample: ISample | null = null
  let unchangedSample: ISample | null = null

  const baselineScore = await runBattle(
    NeuroBot(net),
    opponentBot,
    maxIterations,
  )
  const alteredScore = await runBattle(
    getNonDeterministicNeuroBot(net, (newSample, oldSample) => {
      potentialSample = newSample
      unchangedSample = oldSample
    }),
    opponentBot,
    maxIterations,
  )

  if (alteredScore > baselineScore) {
    return potentialSample
  } else {
    return unchangedSample
  }
}
