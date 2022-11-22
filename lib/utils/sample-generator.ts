import {ISample} from './../types/network'
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

const getNonDeterministicNeuroBot = (
  net: Network,
  onCommandGenerated: (sample: ISample) => void,
  targetIteration = 10,
) => {
  let iteration = 0

  const realBot = NeuroBot(net, true)

  return (map: IFeed): ICommand[] => {
    const commands = realBot(map)

    iteration++

    if (iteration === targetIteration) {
      // Remove random command in order to randomize it

      const randomCommandIndex = Random.getInteger(0, commands.length - 1)
      commands.splice(randomCommandIndex, 1)
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

      onCommandGenerated({
        controlledCreepId: selectedCreepId,
        command,
        map: JSON.parse(JSON.stringify(map)),
      })

      result.push(command)

      return result
    }

    return commands.filter(Boolean)
  }
}

// Scroll samples until at least 1 pair of own and enemy creeps are near

export const generateSamples = async (
  net: Network,
  opponentBot: IBot,
  attempts: number,
  logContext: string,
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

    info(`Network accuracy: ${accuracy}%`)
  }

  if (!filteredSamples.length) {
    warn(`No ${logContext} samples were generated! Retrying...`)

    return await generateSamples(
      net,
      opponentBot,
      attempts,
      logContext,
      maxIterations,
      verbose,
    )
  }

  return filteredSamples
}

const generateSample = async (
  net: Network,
  opponentBot: IBot,
  maxIterations = 100,
): Promise<ISample | null> => {
  let potentialSample: ISample | null = null

  const baselineScore = await runBattle(
    NeuroBot(net),
    opponentBot,
    maxIterations,
  )
  const alteredScore = await runBattle(
    getNonDeterministicNeuroBot(net, newSample => {
      potentialSample = newSample
    }),
    opponentBot,
    maxIterations,
  )

  if (alteredScore > baselineScore) {
    return potentialSample
  } else {
    return null
  }
}
