/**
 * Utility for generating random values
 */
export class Random {
  /**
   * Generates a random integer within a given range
   * @param min Minimum allowed result value (inclusive)
   * @param max Maximum allowed result value (inclusive)
   */
  public static getInteger(min: number, max: number) {
    if (min >= max) {
      return min
    }

    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  /**
   * Selects random item from an array
   * @param dataArray data to be used for random item selection
   * @returns random array item
   */
  public static getArrayItem<T = any>(dataArray: T[]): T | null {
    if (!dataArray.length) {
      return null
    }

    return dataArray[this.getInteger(0, dataArray.length - 1)]
  }
}
