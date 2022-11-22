import {runBattle} from './lib/utils/runner'
import './lib/constants/global'
import {connectToController, resetMap} from './lib/services/controller'
import {ELogLevel, info, init} from './lib/utils/log'
import packageInfo from './package.json'
import {BaselineBot} from './lib/utils/baseline-bot'
import './lib/utils/network' // For code suggestions only
import {Network} from './lib/utils/network'
import {normalize} from './lib/utils/normalizer'

init('AI Trainer', ELogLevel.verbose)

info(`${packageInfo.name} ${packageInfo.version}`)
info(`by ${packageInfo.author.name}`)
;(async () => {
  await connectToController()

  // DEBUG
  const net = new Network()

  const {map} = await resetMap()
  const input = normalize(map, 'cm0')

  console.log(net.predict(input, map, 'cm0'))

  // DEBUG
  // await runBattle(BaselineBot, BaselineBot, 1)
})()
