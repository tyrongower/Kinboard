type OnError = (error: unknown) => void;

function normalizeError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === 'string') return new Error(err);
  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error('Unknown error');
  }
}

export function registerGlobalErrorHandlers(onError: OnError): () => void {
  const cleanupFns: Array<() => void> = [];

  // React Native global JS exception handler
  const errorUtils = (globalThis as any)?.ErrorUtils;
  if (errorUtils?.setGlobalHandler) {
    const previousHandler = errorUtils.getGlobalHandler?.();
    errorUtils.setGlobalHandler((err: any, isFatal?: boolean) => {
      // eslint-disable-next-line no-console
      console.error('Unhandled JS exception', err, { isFatal });
      onError(normalizeError(err));
      if (previousHandler) previousHandler(err, isFatal);
    });
    cleanupFns.push(() => {
      if (previousHandler) errorUtils.setGlobalHandler(previousHandler);
    });
  }

  // Web / environments that support event listeners
  const addListener = (globalThis as any)?.addEventListener;
  const removeListener = (globalThis as any)?.removeEventListener;
  if (typeof addListener === 'function' && typeof removeListener === 'function') {
    const onUnhandledRejection = (event: any) => {
      const reason = event?.reason ?? event;
      // eslint-disable-next-line no-console
      console.error('Unhandled promise rejection', reason);
      onError(normalizeError(reason));
    };
    addListener.call(globalThis, 'unhandledrejection', onUnhandledRejection);
    cleanupFns.push(() => removeListener.call(globalThis, 'unhandledrejection', onUnhandledRejection));
  }

  // Node-like fallback (sometimes present in RN bundlers)
  const proc: any = (globalThis as any)?.process;
  if (proc?.on && typeof proc.on === 'function') {
    const handler = (reason: any) => {
      // eslint-disable-next-line no-console
      console.error('Unhandled promise rejection (process.on)', reason);
      onError(normalizeError(reason));
    };
    proc.on('unhandledRejection', handler);
    cleanupFns.push(() => {
      try {
        proc.off?.('unhandledRejection', handler);
        proc.removeListener?.('unhandledRejection', handler);
      } catch {
        // ignore
      }
    });
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
