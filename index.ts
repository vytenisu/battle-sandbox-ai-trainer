import './lib/constants/global'
import {connectToController} from './lib/services/controller'
import {ELogLevel, info, init} from './lib/utils/log'
import packageInfo from './package.json'
import {ETrainingStrategy, trainNetwork} from './lib/utils/trainer'
import {MODEL_PATH} from './lib/constants/config'
import {Network} from './lib/utils/network'
import {runBattle} from './lib/utils/runner'
import {NeuroBot} from './lib/utils/neuro-bot'
import {BaselineBot} from './lib/utils/baseline-bot'

init('AI Trainer', ELogLevel.info)

info(`${packageInfo.name} ${packageInfo.version}`)
info(`by ${packageInfo.author.name}`)
;(async () => {
  await connectToController()

  await trainNetwork({
    modelPath: MODEL_PATH,
    trainingDataSize: 30000,
    validationDataSize: 30000,
    batchSize: 1,
    epochs: 1,
    patience: 1,
    strategy: ETrainingStrategy.COPY_BASELINE,
  })

  process.exit(1)

  // To test run this:

  // let resolve: (data: any) => void

  // const promise = new Promise(r => {
  //   resolve = r
  // })

  // const net = new Network(MODEL_PATH, () => resolve(null))

  // await promise

  // // await runBattle(NeuroBot(net), BaselineBot, CREEP_LIFE_TIME, 1000)
  // await runBattle(NeuroBot(net), NeuroBot(net), CREEP_LIFE_TIME, 1000)
})()
