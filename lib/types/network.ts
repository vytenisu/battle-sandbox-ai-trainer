import type TensorFlow from '@tensorflow/tfjs-node-gpu'
import {ICommand} from './commands'
import {IFeed} from './feed'

export type INormalizedFeed = INormalizedRows[]
export type INormalizedRows = INormalizedCell[]

export type INormalizedCell = [
  swamp: number,
  wall: number,
  myAttackScore: number,
  myMoveScore: number,
  myHits: number,
  myTicksToLive: number,
  friendAttackScore: number,
  friendMoveScore: number,
  friendHits: number,
  friendTicksToLive: number,
  enemyAttackScore: number,
  enemyMoveScore: number,
  enemyHits: number,
  enemyTicksToLive: number,
]

export type IRawOutput = [
  moveTop: number,
  moveTopRight: number,
  moveRight: number,
  moveBottomRight: number,
  moveBottom: number,
  moveBottomLeft: number,
  moveLeft: number,
  moveTopLeft: number,
  attackTop: number,
  attackTopRight: number,
  attackRight: number,
  attackBottomRight: number,
  attackBottom: number,
  attackBottomLeft: number,
  attackLeft: number,
  attackTopLeft: number,
]

export interface ISample {
  map: IFeed
  controlledCreepId: string
  command: ICommand
}

export interface INormalizedSample {
  [index: string]: INormalizedFeed | IRawOutput
  xs: INormalizedFeed
  ys: IRawOutput
}

export interface ITrainCallback {
  setParams: () => void
  setModel: (model: TensorFlow.LayersModel) => void
  onTrainBegin: () => void
  onEpochBegin: () => void
  onBatchBegin: () => void
  onBatchEnd: () => void
  onEpochEnd: (epochNumber: number, accuracyInfo: any) => void
  onTrainEnd: () => void
}
