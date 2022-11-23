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
    trainingDataSize: 1000,
    validationDataSize: 300,
    batchSize: 10,
    epochs: 100,
    patience: 50,
    strategy: ETrainingStrategy.COPY_BASELINE,
  })

  closeConnection()
})()
