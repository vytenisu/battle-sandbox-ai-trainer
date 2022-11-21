import {ICommand, IControllerResponse} from './../types/commands'
import {IFeed} from '../types/feed'
import {resetMap, runTick} from '../services/controller'
import {getInvertedMap} from './map'

export type IBot = (map: IFeed) => ICommand[]

export const runBattle = async (
  mainBot: IBot,
  enemyBot: IBot,
  delayBetweenSteps = 0,
): Promise<number> => {
  const {map, concluded, score} = await resetMap()

  let currentMap = map
  let currentScore = score
  let done = concluded

  while (!done) {
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
    currentScore = score
    done = concluded
  }

  return score
}
