import { api } from './api';
import { DEFAULT_BLE, listenAndStartScan, type BleCandidate } from './ble';

export async function scanAndMarkAttendance(classId: string) {
  return new Promise<{ marked: boolean; candidates: number }>((resolve, reject) => {
    const seen = new Set<string>();
    let candidates = 0;
    let done = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let removeListener: (() => void) | undefined;

    const finish = (result: { marked: boolean; candidates: number }, error?: unknown) => {
      if (done) return;
      done = true;
      if (timeout) clearTimeout(timeout);
      try { removeListener?.(); } catch { /* noop */ }
      if (error) reject(error);
      else resolve(result);
    };

    timeout = setTimeout(() => finish({ marked: false, candidates }), 8000);

    void (async () => {
      try {
        removeListener = await listenAndStartScan(async (candidate: BleCandidate) => {
          if (done || seen.has(candidate.deviceId)) return;
          seen.add(candidate.deviceId);
          candidates += 1;

          try {
            await api.markAttendance(classId, candidate.token);
            finish({ marked: true, candidates });
          } catch {
            // This candidate may belong to another class/session. Keep scanning.
          }
        }, DEFAULT_BLE);
      } catch (error) {
        finish({ marked: false, candidates }, error);
      }
    })();
  });
}
