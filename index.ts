import {BaselineBot} from './lib/utils/baseline-bot'
import {NeuroBot} from './lib/utils/neuro-bot'
import {runBattle} from './lib/utils/runner'
import {Network} from './lib/utils/network'
import './lib/constants/global'
import {closeConnection, connectToController} from './lib/services/controller'
import {ELogLevel, info, init} from './lib/utils/log'
import packageInfo from './package.json'
import {ETrainingStrategy, trainNetwork} from './lib/utils/trainer'
import {MODEL_PATH} from './lib/constants/config'

init('AI Trainer', ELogLevel.info)

info(`${packageInfo.name} ${packageInfo.version}`)
info(`by ${packageInfo.author.name}`)
;(async () => {
  await connectToController()

  await trainNetwork({
    modelPath: MODEL_PATH,
    trainingDataSize: 100,
    validationDataSize: 1000,
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

  // await runBattle(NeuroBot(net), BaselineBot, CREEP_LIFE_TIME, 1000)
})()
