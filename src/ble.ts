import {
  addDeviceFoundListener,
  connect,
  disconnect,
  discoverServices,
  getCapabilities,
  isBluetoothEnabled,
  readCharacteristic,
  requestBluetoothPermission,
  setServices,
  startAdvertising,
  startScan,
  stopAdvertising,
  stopScan
} from 'react-native-bluetooth-ble';

export const DEFAULT_BLE = {
  serviceUUID: '7d9d5b6d-b5f6-4f7a-8f07-a4fae2d9d0a1',
  characteristicUUID: 'd19439e4-0b6f-40b4-9af9-c77e38cc9b77'
};

export type BleCandidate = { deviceId: string; token: string };

// Attendance tokens are hex-safe ASCII, so we avoid relying on global TextEncoder/TextDecoder polyfills.
function utf8ToHex(value: string) {
  return Array.from(value, (char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

function hexToUtf8(hex: string) {
  const clean = hex.replace(/\s+/g, '');
  const bytes = clean.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [];
  return String.fromCharCode(...bytes);
}

export async function checkBleReady() {
  const granted = await requestBluetoothPermission();
  if (!granted) throw new Error('Bluetooth permission was not granted');
  if (!(await isBluetoothEnabled())) throw new Error('Turn Bluetooth on and try again');
  return getCapabilities();
}

export async function startTeacherBeacon(token: string, config = DEFAULT_BLE) {
  await checkBleReady();
  setServices([
    {
      uuid: config.serviceUUID,
      characteristics: [
        { uuid: config.characteristicUUID, properties: ['read'], value: utf8ToHex(token) }
      ]
    }
  ]);
  await startAdvertising({ serviceUUIDs: [config.serviceUUID], localName: 'Attendify' });
}

export async function stopTeacherBeacon() {
  try { await stopAdvertising(); } catch { /* already stopped */ }
}

export async function listenAndStartScan(
  onCandidate: (candidate: BleCandidate) => void | Promise<void>,
  config = DEFAULT_BLE
) {
  await checkBleReady();

  const removeListener = addDeviceFoundListener((device: any) => {
    const advertised = device.serviceUUIDs ?? [];
    if (!advertised.some((uuid: string) => uuid.toLowerCase() === config.serviceUUID.toLowerCase())) return;

    void (async () => {
      try {
        await connect(device.id);
        await discoverServices(device.id);
        const value = await readCharacteristic(device.id, config.serviceUUID, config.characteristicUUID);
        const token = hexToUtf8(String(value));
        if (token) await onCandidate({ deviceId: device.id, token });
      } catch {
        // Nearby devices can disappear between scan and connection; ignore and continue.
      } finally {
        try { await disconnect(device.id); } catch { /* already disconnected */ }
      }
    })();
  });

  try {
    startScan({ serviceUUIDs: [config.serviceUUID], allowDuplicates: false, scanMode: 'lowLatency' });
  } catch (error) {
    try { removeListener(); } catch { /* noop */ }
    throw error;
  }
  return removeListener;
}

export async function stopStudentScan() {
  try { await stopScan(); } catch { /* already stopped */ }
}
