import React, {useState, useEffect} from 'react';
import {
  NativeModules,
  NativeEventEmitter,
  View,
  ActivityIndicator,
  Button,
} from 'react-native';
import {
  handleConnectPeripheral,
  handleDisconnectedPeripheral,
  handleDiscoverPeripheral,
  handleStopScan,
  handleUpdateValueForCharacteristic,
} from './helpers/BLE_listeners';
import {styles} from './styles/style';
import {handleAndroidPermissions, startBLEManager} from './helpers/BLE_utils';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const useOnce = (callback: Function) => {
  const [hasBeenCalled, setHasBeenCalled] = useState(false);

  useEffect(() => {
    if (!hasBeenCalled && typeof callback === 'function') {
      callback();
      setHasBeenCalled(true);
    }
  }, [hasBeenCalled, callback]);
};

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  // const [peripherals, setPeripherals] = useState(
  //   new Map<Peripheral['id'], Peripheral>(),
  // );

  useOnce(() => {
    handleAndroidPermissions();
    startBLEManager();
    const listeners = [
      bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      ),
      bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),
      bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      ),
      bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdateValueForCharacteristic,
      ),
      bleManagerEmitter.addListener(
        'BleManagerConnectPeripheral',
        handleConnectPeripheral,
      ),
    ];

    return () => {
      console.debug('[app] main component unmounting. Removing listeners...');
      for (const listener of listeners) {
        listener.remove();
      }
    };
  });

  const handlePress = () => {
    setIsScanning(!isScanning);
  };

  useEffect(() => {}, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="00ff00" animating={isScanning} />
      <Button onPress={handlePress} title="change" />
    </View>
  );
};

export default App;
