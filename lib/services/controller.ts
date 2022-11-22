import {client as Client, connection} from 'websocket'
import {CONTROLLER_URL} from '../constants/config'
import {debug, error, verbose} from '../utils/log'
import {
  EControllerCommand,
  ICommand,
  IControllerCommandReset,
  IControllerCommandTick,
  IControllerResponse,
} from './../types/commands'

const RETRY_DELAY = 3000

let currentConnectionResolve: (data: void) => void = () => {}
let currentResolve: (data: IControllerResponse) => void = () => {}
let currentConnection: connection | null = null

const client = new Client()

const connect = () => {
  verbose('Connecting to map controller service...')
  client.connect(CONTROLLER_URL, 'controller')
}

const retry = () => setTimeout(connect, RETRY_DELAY)

client.on('connectFailed', () => {
  error('Connection to controller service failed!')
  retry()
})

client.on('connect', connection => {
  currentConnection = connection
  currentConnectionResolve()
  verbose('Connected to controller service!')

  connection.on('error', e => {
    error('Error occurred in connection with controller service!')
    error(e.toString())
  })

  connection.on('close', () => {
    error('Connection to controller service was closed! Will retry...')
    retry()
  })

  connection.on('message', message => {
    if (message.type === 'utf8') {
      verbose('Received controller status!')
      debug(message.utf8Data)
      currentResolve(JSON.parse(message.utf8Data))
    } else {
      error('Received unexpected binary message from controller service!')
    }
  })
})

export const resetMap = async (): Promise<IControllerResponse> =>
  new Promise(resolve => {
    currentResolve = resolve

    if (currentConnection?.connected) {
      verbose('Resetting controller')

      const payload: IControllerCommandReset = {
        type: EControllerCommand.RESET,
      }

      const stringPayload = JSON.stringify(payload)

      debug(stringPayload)
      currentConnection.sendUTF(stringPayload)
    } else {
      error(
        'Attempting to make changes to map while not connected to controller service!',
      )
    }
  })

export const runTick = async (
  commands: ICommand[],
): Promise<IControllerResponse> =>
  new Promise(resolve => {
    currentResolve = resolve

    if (currentConnection?.connected) {
      verbose('Updating controller state')

      const payload: IControllerCommandTick = {
        type: EControllerCommand.TICK,
        payload: commands,
      }

      const stringPayload = JSON.stringify(payload)

      debug(stringPayload)
      currentConnection.sendUTF(stringPayload)
    } else {
      error(
        'Attempting to make changes to map while not connected to controller service!',
      )
    }
  })

export const connectToController = () =>
  new Promise(resolve => {
    currentConnectionResolve = resolve
    connect()
  })
