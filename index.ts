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

  await trainNetwork({
    modelPath: MODEL_PATH,
    trainingDataSize: 300,
    validationDataSize: 3000,
    batchSize: 1,
    epochs: 1,
    patience: 1,
    strategy: ETrainingStrategy.COPY_BASELINE,
  })

  process.exit(1)

  // Verify quality of samples

  // const samples = await generateCopySamples(
  //   getCreepCommand,
  //   1000,
  //   'quality verification',
  // )

  // const normalizedSamples = samples.map(normalizeSample)

  // let amounts: {[index: string]: number} = {}

  // const commandMap: {[i: number]: string} = {
  //   0: 'moveTop',
  //   1: 'moveTopRight',
  //   2: 'moveRight',
  //   3: 'moveBottomRight',
  //   4: 'moveBottom',
  //   5: 'moveBottomLeft',
  //   6: 'moveLeft',
  //   7: 'moveTopLeft',
  //   8: 'attackTop',
  //   9: 'attackTopRight',
  //   10: 'attackRight',
  //   11: 'attackBottomRight',
  //   12: 'attackBottom',
  //   13: 'attackBottomLeft',
  //   14: 'attackLeft',
  //   15: 'attackTopLeft',
  // }

  // normalizedSamples.forEach(({ys}) => {
  //   ys.forEach((y, i) => {
  //     amounts[commandMap[i]] = amounts[commandMap[i]] ?? 0
  //     amounts[commandMap[i]] += y
  //   })

  //   if (ys.every(y => !y)) {
  //     amounts['-'] = amounts['-'] ?? 0
  //     amounts['-']++
  //   }
  // })

  // console.log(amounts)
  // console.log('Total: ', samples.length)

  // const balancedSamples = balanceSamples(samples)
  // const normalizedBalancedSamples = balancedSamples.map(normalizeSample)

  // amounts = {}

  // normalizedBalancedSamples.forEach(({ys}) => {
  //   ys.forEach((y, i) => {
  //     amounts[commandMap[i]] = amounts[commandMap[i]] ?? 0
  //     amounts[commandMap[i]] += y
  //   })

  //   if (ys.every(y => !y)) {
  //     amounts['-'] = amounts['-'] ?? 0
  //     amounts['-']++
  //   }
  // })

  // console.log(amounts)
  // console.log('Total balanced: ', balancedSamples.length)

  // To test run this:

  // let resolve: (data: any) => void

  // const promise = new Promise(r => {
  //   resolve = r
  // })

  // const net = new Network(MODEL_PATH, () => resolve(null))

  // await promise

  // await runBattle(NeuroBot(net), BaselineBot, CREEP_LIFE_TIME, 1000)
})()
