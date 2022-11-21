import {IFeed} from './feed'

export enum EControllerCommand {
  RESET = 'reset',
  TICK = 'tick',
}

export interface IControllerResponse {
  map: IFeed
  score: number
  concluded: boolean
  commandSucceeded: boolean
}

export type IControllerCommand =
  | IControllerCommandReset
  | IControllerCommandTick

export interface IControllerCommandReset {
  type: EControllerCommand.RESET
}

export interface IControllerCommandTick {
  type: EControllerCommand.TICK
  payload: ICommand[]
}

export enum ECommand {
  MOVE = 'move',
  ATTACK = 'attack',
}

export type ICommand = ICommandMove | ICommandAttack

export interface ICommandMove {
  type: ECommand.MOVE
  payload: IMovePayload
}

export interface ICommandAttack {
  type: ECommand.ATTACK
  payload: IAttackPayload
}

export interface IMovePayload {
  sourceId: string
  direction: DirectionConstant
}

export interface IAttackPayload {
  sourceId: string
  targetId: string
}
