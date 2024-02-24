const byteArrayToString = (data: number[]): string => {
  return String.fromCharCode(...data);
};

const sleep = (ms: number) => {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
};

export {byteArrayToString, sleep};
