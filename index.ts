import {runBattle} from './lib/utils/runner'
import './lib/constants/global'
import {connectToController} from './lib/services/controller'
import {ELogLevel, info, init} from './lib/utils/log'
import packageInfo from './package.json'
import {BaselineBot} from './lib/utils/baseline-bot'

init('AI Trainer', ELogLevel.verbose)

info(`${packageInfo.name} ${packageInfo.version}`)
info(`by ${packageInfo.author.name}`)
;(async () => {
  await connectToController()

  // DEBUG
  await runBattle(BaselineBot, BaselineBot, 1)
})()
