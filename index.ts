import './lib/constants/global'
import {connectToController, resetMap, runTick} from './lib/services/controller'
import {ECommand} from './lib/types/commands'
import {ELogLevel, info, init} from './lib/utils/log'
import packageInfo from './package.json'

init('AI Trainer', ELogLevel.verbose)

info(`${packageInfo.name} ${packageInfo.version}`)
info(`by ${packageInfo.author.name}`)
;(async () => {
  await connectToController()

  // DEBUG

  await resetMap()

  // cm{i}, cr{i}

  // setInterval(
  //   async () =>
  //     await runTick([
  //       {
  //         type: ECommand.MOVE,
  //         payload: {sourceId: 'cm0', direction: BOTTOM_LEFT},
  //       },
  //     ]),
  //   1000,
  // )
})()
