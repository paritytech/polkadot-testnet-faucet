
class ErrorCounter {
  private static instance: ErrorCounter;
  #counter: number;

  private constructor () {
    this.#counter = 0;
  }

  public getValue = () => {
    return this.#counter;
  }

  public plusOne = () => {
    this.#counter += 1;
  }

  public static getInstance (): ErrorCounter {
    if (!ErrorCounter.instance) {
      ErrorCounter.instance = new ErrorCounter();
    }

    return ErrorCounter.instance;
  }
}

export default ErrorCounter.getInstance();
