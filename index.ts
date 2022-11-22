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
    trainingDataSize: 50,
    validationDataSize: 10,
    batchSize: 5,
    epochs: 50,
    strategy: ETrainingStrategy.AGAINST_BASELINE,
  })

  closeConnection()
})()
