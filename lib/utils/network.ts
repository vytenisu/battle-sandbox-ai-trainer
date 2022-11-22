import {INormalizedSample} from './../types/network'
import {Position} from './position'
import {IFeed} from './../types/feed'
import {ECommand, ICommand} from './../types/commands'
import type TensorFlow from '@tensorflow/tfjs-node-gpu'
import {resolve} from 'path'
import {info, verbose} from './log'
import mkdirp from 'mkdirp'
import {INormalizedFeed} from '../types/network'
import {NETWORK_CHANNELS} from '../constants/network'
import {getCreepById, getCreepByPosition} from './map'
import {DIRECTIONS} from '../constants/screeps'
import {existsSync} from 'fs'

const tf: typeof TensorFlow = require('@tensorflow/tfjs-node-gpu')

export class Network {
  private model: TensorFlow.LayersModel

  constructor(modelPath?: string, onReady = () => {}) {
    if (modelPath && this.modelExists(modelPath)) {
      this.loadModel(modelPath).then(() => {
        this.compileModel()
        onReady()
      })
    } else {
      this.createModel()
      this.compileModel()
      onReady()
    }
  }

  private modelExists(modelPath: string) {
    return existsSync(resolve(modelPath, 'model.json'))
  }

  public async saveModel(modelPath: string) {
    await mkdirp(modelPath)
    await this.model.save(tf.io.fileSystem(modelPath))
    info(`Saved model to ${modelPath}`)
  }

  private async loadModel(modelPath: string) {
    this.model = await tf.loadLayersModel(
      tf.io.fileSystem(resolve(modelPath, 'model.json')),
    )

    info(`Loaded model from ${modelPath}`)
  }

  private createModel() {
    this.model = tf.sequential({
      name: 'player',
      layers: [
        tf.layers.conv2d({
          kernelSize: 5,
          filters: 4,
          activation: 'elu',
          dataFormat: 'channelsLast',
          dtype: 'float32',
          inputShape: [50, 50, NETWORK_CHANNELS],
        }),
        tf.layers.avgPool2d({poolSize: [2, 2], strides: [1, 1]}),
        tf.layers.conv2d({
          kernelSize: 5,
          filters: 16,
          activation: 'elu',
          dataFormat: 'channelsLast',
        }),
        tf.layers.avgPool2d({poolSize: [5, 5], strides: [1, 1]}),
        tf.layers.flatten(),
        tf.layers.dense({
          units: 16,
          kernelInitializer: 'varianceScaling',
          activation: 'softmax',
        }),
      ],
    })

    info('Created new model')
  }

  private compileModel() {
    this.model.compile({
      optimizer: tf.train.adam(),
      loss: tf.metrics.categoricalCrossentropy,
      metrics: ['accuracy'],
    })

    verbose('Compiled model')
  }

  public predict(
    input: INormalizedFeed,
    map: IFeed,
    controlledCreepId: string,
  ): ICommand {
    const flat = tf.reshape(input, [50 * 50 * NETWORK_CHANNELS])
    const batched = tf.reshape(flat, [1, 50, 50, NETWORK_CHANNELS])

    let resultTensor = this.model.predict(batched) as TensorFlow.Tensor
    const resultArray = Array.from(resultTensor.dataSync())
    const maxValue = Math.max(...resultArray)
    const predictionIndex = resultArray.findIndex(value => value === maxValue)

    const direction = this.getDirection(predictionIndex)
    const commandType = this.getCommand(predictionIndex)

    if (commandType === ECommand.MOVE) {
      return {
        type: commandType,
        payload: {direction, sourceId: controlledCreepId},
      }
    }

    const sourceCreep = getCreepById(controlledCreepId, map)
    const target = getCreepByPosition(
      Position.moveToDirection(sourceCreep.pos, direction),
      map,
    )

    if (!sourceCreep || !target) {
      return null
    }

    const targetId = target.id

    return {
      type: commandType,
      payload: {sourceId: controlledCreepId, targetId},
    }
  }

  public createDataset(data: INormalizedSample[], batchSize = 10) {
    return tf.data.array(data).shuffle(batchSize).batch(10)
  }

  public async train(
    trainingData: TensorFlow.data.Dataset<TensorFlow.TensorContainer>,
    validationData: TensorFlow.data.Dataset<TensorFlow.TensorContainer>,
    epochs = 10,
    verbose = 1,
  ) {
    await this.model.fitDataset(trainingData, {
      validationData,
      epochs,
      verbose,
    })
  }

  private getDirection(outputIndex: number): DirectionConstant {
    return DIRECTIONS[outputIndex % DIRECTIONS.length] as DirectionConstant
  }

  private getCommand(outputIndex: number) {
    return outputIndex < DIRECTIONS.length ? ECommand.MOVE : ECommand.ATTACK
  }
}
