import {INormalizedSample, ITrainCallback} from './../types/network'
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
      name: 'bot',
      layers: [
        tf.layers.conv2d({
          kernelSize: 3,
          padding: 'same',
          filters: 9, // 8 filters for attack vectors, 1 for untouched
          strides: 1,
          activation: 'relu',
          inputShape: [5, 5, NETWORK_CHANNELS],
        }),
        tf.layers.flatten(),
        tf.layers.dense({units: 1000, activation: 'relu'}),
        tf.layers.dense({units: 16, activation: 'softmax'}),
      ],
    })

    // DEBUG
    // this.model.summary()
    // process.exit(1)
  }

  private compileModel() {
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: tf.metrics.categoricalCrossentropy,
      // loss: tf.metrics.meanSquaredError,
      metrics: ['accuracy'],
    })

    verbose('Compiled model')
  }

  public predict(
    input: INormalizedFeed,
    map: IFeed,
    controlledCreepId: string,
  ): ICommand {
    const flat = tf.reshape(input, [5 * 5 * NETWORK_CHANNELS])
    const batched = tf.reshape(flat, [1, 5, 5, NETWORK_CHANNELS])

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
    patience = 10,
    additionalCallbacks: ITrainCallback[] = [], // Could not
    verbose = 1,
  ) {
    const earlyStop = tf.callbacks.earlyStopping({
      patience,
      mode: 'min',
      verbose: 1,
    })

    await this.model.fitDataset(trainingData, {
      validationData,
      epochs,
      verbose,
      callbacks: [earlyStop, ...additionalCallbacks],
    })
  }

  private getDirection(outputIndex: number): DirectionConstant {
    return DIRECTIONS[outputIndex % DIRECTIONS.length] as DirectionConstant
  }

  private getCommand(outputIndex: number) {
    return outputIndex < DIRECTIONS.length ? ECommand.MOVE : ECommand.ATTACK
  }
}
