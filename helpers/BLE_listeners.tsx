import {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  Peripheral,
} from 'react-native-ble-manager';
import {byteArrayToString} from './utils';

const handleStopScan = () => {
  console.debug('[handleStopScan] scan is stopped.');
};

const handleDisconnectedPeripheral = (event: BleDisconnectPeripheralEvent) => {
  console.debug(
    `[handleDisconnectedPeripheral][${event.peripheral}] disconnected.`,
  );
};

const handleConnectPeripheral = (event: any) => {
  console.log(`[handleConnectPeripheral][${event.peripheral}] connected.`);
};

const handleUpdateValueForCharacteristic = (
  data: BleManagerDidUpdateValueForCharacteristicEvent,
) => {
  let coordinates = byteArrayToString(data.value);
  let time = new Date().toLocaleTimeString();
  console.debug(
    `[handleUpdateValueForCharacteristic] At ${time} received data coordinates value='${coordinates}'`,
  );
};

const handleDiscoverPeripheral = (peripheral: Peripheral) => {
  console.debug('[handleDiscoverPeripheral] new BLE peripheral=', peripheral);
};

export {
  handleConnectPeripheral,
  handleDisconnectedPeripheral,
  handleDiscoverPeripheral,
  handleStopScan,
  handleUpdateValueForCharacteristic,
};
