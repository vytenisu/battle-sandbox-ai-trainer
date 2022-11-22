import {BaselineBot} from './baseline-bot'
import {Network} from './network'
import {NeuroBot} from './neuro-bot'
import {normalizeSample} from './normalizer'
import {generateSamples} from './sample-generator'

export enum ETrainingStrategy {
  AGAINST_BASELINE,
  AGAINST_SELF,
}

export interface ITrainNetworkProps {
  modelPath: string
  strategy: ETrainingStrategy
  trainingDataSize: number
  validationDataSize: number
  epochs: number
  batchSize: number
  net?: Network
}

export const trainNetwork = async ({
  modelPath,
  strategy,
  trainingDataSize,
  validationDataSize,
  epochs,
  batchSize,
  net,
}: ITrainNetworkProps) => {
  if (!net) {
    await new Promise(resolve => {
      net = new Network(modelPath, () => resolve(null))
    })
  }

  const opponentBot =
    strategy === ETrainingStrategy.AGAINST_BASELINE
      ? BaselineBot
      : NeuroBot(net)

  const trainingSamples = await generateSamples(
    net,
    opponentBot,
    trainingDataSize,
    'training',
    modelPath,
  )

  const normalizedTrainingSamples = trainingSamples.map(normalizeSample)

  const trainingData = net.createDataset(normalizedTrainingSamples, batchSize)

  const validationSamples = await generateSamples(
    net,
    opponentBot,
    validationDataSize,
    'validation',
    modelPath,
  )

  const normalizedValidationSamples = validationSamples.map(normalizeSample)

  const validationData = net.createDataset(
    normalizedValidationSamples,
    batchSize,
  )

  await net.train(trainingData, validationData, epochs)

  await net.saveModel(modelPath)

  return net
}
