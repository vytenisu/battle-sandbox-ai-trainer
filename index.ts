import './lib/constants/global'
import {connectToController} from './lib/services/controller'
import {ELogLevel, info, init} from './lib/utils/log'
import packageInfo from './package.json'
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
