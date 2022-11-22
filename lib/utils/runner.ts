import {ICommand, IControllerResponse} from './../types/commands'
import {IFeed} from '../types/feed'
import {resetMap, runTick} from '../services/controller'
import {getInvertedMap} from './map'
import {CREEP_LIFE_TIME} from '../constants/screeps'

export type IBot = (map: IFeed) => ICommand[]

export const runBattle = async (
  mainBot: IBot,
  enemyBot: IBot,
  maxIterations = CREEP_LIFE_TIME,
  delayBetweenSteps = 0,
): Promise<number> => {
  const {map, concluded, score} = await resetMap()

  let currentMap = map
  let currentScoreSum = score
  let currentScoreAmount = 1
  let done = concluded
  let remainingIterations = maxIterations

  while (!done && remainingIterations) {
    const invertedMap = getInvertedMap(currentMap)
    const mainBotActions = mainBot(currentMap)
    const enemyBotActions = enemyBot(invertedMap)
    const commands = [...mainBotActions, ...enemyBotActions]

    const {map, score, concluded} = (await new Promise(resolve => {
      setTimeout(async () => {
        resolve(await runTick(commands))
      }, delayBetweenSteps)
    })) as IControllerResponse

    currentMap = map
    currentScoreSum += score
    currentScoreAmount++
    done = concluded
    remainingIterations--
  }

  return currentScoreSum / currentScoreAmount
}
