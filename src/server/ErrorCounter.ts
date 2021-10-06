type CounterType = 'rpcTimeout' | 'other';

class ErrorCounter {
  private static instance: ErrorCounter;
  #counter: Record<CounterType, number>;

  private constructor() {
    this.#counter = { other: 0, rpcTimeout: 0 };
  }

  public getValue = (type: CounterType) => {
    return this.#counter[type];
  };

  public plusOne = (type: CounterType) => {
    this.#counter[type] += 1;
  };

  public total = (): number => {
    return Object.values(this.#counter).reduce((prev, curr) => {
      return prev + curr;
    }, 0);
  };

  public static getInstance(): ErrorCounter {
    if (!ErrorCounter.instance) {
      ErrorCounter.instance = new ErrorCounter();
    }

    return ErrorCounter.instance;
  }
}

export default ErrorCounter.getInstance();
