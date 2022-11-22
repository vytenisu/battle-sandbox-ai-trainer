import {normalizeSample} from './lib/utils/normalizer'
import {runBattle} from './lib/utils/runner'
import './lib/constants/global'
import {connectToController, resetMap} from './lib/services/controller'
import {ELogLevel, info, init} from './lib/utils/log'
import packageInfo from './package.json'
import {BaselineBot} from './lib/utils/baseline-bot'
import './lib/utils/network' // For code suggestions only
import {Network} from './lib/utils/network'
import {generateSamples} from './lib/utils/sample-generator'
import {ETrainingStrategy, trainNetwork} from './lib/utils/trainer'
import {MODEL_PATH} from './lib/constants/config'

init('AI Trainer', ELogLevel.info)

info(`${packageInfo.name} ${packageInfo.version}`)
info(`by ${packageInfo.author.name}`)
;(async () => {
  await connectToController()

  let iteration = 0

  while (true) {
    iteration++

    info(`Running training iteration ${iteration} ...`)

    await trainNetwork({
      modelPath: MODEL_PATH,
      trainingDataSize: 100,
      validationDataSize: 20,
      batchSize: 5,
      epochs: 50,
      strategy: ETrainingStrategy.AGAINST_BASELINE,
    })

    info(`Training iteration ${iteration} is completed!`)
  }
})()
