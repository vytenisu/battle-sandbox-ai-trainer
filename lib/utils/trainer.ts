import {ISample} from '../types/network'
import {BaselineBot, getCreepCommand} from './baseline-bot'
import {Network} from './network'
import {NeuroBot} from './neuro-bot'
import {normalizeSample} from './normalizer'
import {generateCopySamples, generateSamples} from './sample-generator'

export enum ETrainingStrategy {
  COPY_BASELINE,
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

  let trainingSamples: ISample[]
  let validationSamples: ISample[]

  if (strategy === ETrainingStrategy.COPY_BASELINE) {
    trainingSamples = await generateCopySamples(
      getCreepCommand,
      trainingDataSize,
      'training',
      1,
    )

    validationSamples = await generateCopySamples(
      getCreepCommand,
      validationDataSize,
      'validation',
      1,
    )
  } else {
    const opponentBot =
      strategy === ETrainingStrategy.AGAINST_BASELINE
        ? BaselineBot
        : NeuroBot(net)

    trainingSamples = await generateSamples(
      net,
      opponentBot,
      trainingDataSize,
      'training',
      modelPath,
    )

    validationSamples = await generateSamples(
      net,
      opponentBot,
      validationDataSize,
      'validation',
      modelPath,
    )
  }

  const normalizedTrainingSamples = trainingSamples.map(normalizeSample)
  const normalizedValidationSamples = validationSamples.map(normalizeSample)

  const trainingData = net.createDataset(normalizedTrainingSamples, batchSize)
  const validationData = net.createDataset(
    normalizedValidationSamples,
    batchSize,
  )

  await net.train(trainingData, validationData, epochs)
  await net.saveModel(modelPath)

  return net
}
