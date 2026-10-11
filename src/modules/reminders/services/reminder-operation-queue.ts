// Scheduling and the OS audit must not interleave: an audit would otherwise
// cancel a newly scheduled snooze before its identifier reaches storage.
let operationQueue: Promise<void> = Promise.resolve();

export const runReminderScheduleOperation = <Result>(
  operation: () => Promise<Result>,
): Promise<Result> => {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};
