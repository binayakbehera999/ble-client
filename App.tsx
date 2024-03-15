/**
 * Sample BLE React Native App
 */

import React, {useState, useEffect} from 'react';
import {
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
  View,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

const SECONDS_TO_SCAN_FOR = 5;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = false;

import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
} from 'react-native-ble-manager';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

declare module 'react-native-ble-manager' {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

const App = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [location, setLocation] = useState('');
  const [peripheralFound, setPeripheralFound] = useState(false);

  const startScan = () => {
    if (isScanning) {
      // reset found peripherals before scan

      try {
        console.debug('[startScan] starting scan...');
        setIsScanning(true);
        BleManager.scan(SERVICE_UUIDS, SECONDS_TO_SCAN_FOR, ALLOW_DUPLICATES, {
          matchMode: BleScanMatchMode.Sticky,
          scanMode: BleScanMode.LowLatency,
          callbackType: BleScanCallbackType.AllMatches,
        })
          .then(() => {
            console.debug('[startScan] scan promise returned successfully.');
          })
          .catch((err: any) => {
            console.error('[startScan] ble scan returned in error', err);
          });
      } catch (error) {
        console.error('[startScan] ble scan error thrown', error);
      }
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
    console.debug('[handleStopScan] scan is stopped.');
  };

  const handleDisconnectedPeripheral = (
    event: BleDisconnectPeripheralEvent,
  ) => {
    setPeripheralFound(false);
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
    setLocation(coordinates);
  };

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    console.debug('[handleDiscoverPeripheral] new BLE peripheral=', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
  };

  // const togglePeripheralConnection = async (peripheral: Peripheral) => {
  //   if (peripheral && peripheral.connected) {
  //     try {
  //       await BleManager.disconnect(peripheral.id);
  //     } catch (error) {
  //       console.error(
  //         `[togglePeripheralConnection][${peripheral.id}] error when trying to disconnect device.`,
  //         error,
  //       );
  //     }
  //   } else {
  //     await connectPeripheral(peripheral);
  //   }
  // };

  const byteArrayToString = (data: number[]): string => {
    return String.fromCharCode(...data);
  };

  const connectPeripheral = async (peripheral: string) => {
    try {
      if (peripheral) {
        console.log("here here");
        setIsScanning(true);
        //setPeripheral({...peripheral, connecting: true});

        await BleManager.connect(peripheral, {
          autoconnect: true,
        });
        console.debug(`[connectPeripheral][${peripheral}] connected.`);

        await BleManager.createBond(peripheral);
        console.debug(`[connectPeripheral][${peripheral}] bonded.`);

        //setPeripheral({...peripheral, connected: true, connecting: false});

        // before retrieving services, it is often a good idea to let bonding & connection finish properly
        await sleep(900);

        /* Test read current RSSI value, retrieve services first */
        const peripheralData = await BleManager.retrieveServices(peripheral);
        console.debug(
          `[connectPeripheral][${peripheral}] retrieved peripheral services`,
          JSON.stringify(peripheralData),
        );

        const rssi = await BleManager.readRSSI(peripheral);
        console.debug(
          `[connectPeripheral][${peripheral}] retrieved current RSSI value: ${rssi}.`,
        );
        try {
          await BleManager.startNotification(
            peripheralData.id,
            'cb0f22c6-1000-4737-9f86-1c33f4ee9eea',
            'cb0f22c6-1001-41a0-93d4-9025f8b5eafe',
          );

          console.log(
            `[connectPeripheral][${peripheral}] with service id cb0f22c6-1000-4737-9f86-1c33f4ee9eea charaterstic id cb0f22c6-1001-41a0-93d4-9025f8b5eafe started notification`,
          );
        } catch (err) {
          console.error(
            `[connectPeripheral][${peripheral}] with service id cb0f22c6-1000-4737-9f86-1c33f4ee9eea charaterstic id cb0f22c6-1001-41a0-93d4-9025f8b5eafe failed to start notification`,
            err,
          );
        }
        setPeripheralFound(true);
        setIsScanning(false);
      }
    } catch (error) {
      console.error(
        `[connectPeripheral][${peripheral}] connectPeripheral error`,
        error,
      );
    }
  };

  function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  useEffect(() => {
    try {
      BleManager.start({showAlert: false})
        .then(() => console.debug('BleManager started.'))
        .catch((error: any) =>
          console.error('BeManager could not be started.', error),
        );
    } catch (error) {
      console.error('unexpected error starting BleManager.', error);
      return;
    }

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

    handleAndroidPermissions();
    // connectPeripheral('E8:6B:EA:CF:C6:E2');
    return () => {
      console.debug('[app] main component unmounting. Removing listeners...');
      for (const listener of listeners) {
        listener.remove();
      }
    };
  }, []);


  const togglePeripheralConnection = async (peripheral: string) => {
    if (peripheralFound) {
      try {
        setIsScanning(true);
        await BleManager.disconnect(peripheral);
        setPeripheralFound(false);
        setIsScanning(false);
      } catch (error) {
        console.error(
          `[togglePeripheralConnection][${peripheral}] error when trying to disconnect device.`,
          error,
        );
      }
    } else {
      await connectPeripheral(peripheral);
    }
  };

  const handleAndroidPermissions = () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]).then(result => {
        if (result) {
          console.debug(
            '[handleAndroidPermissions] User accepts runtime permissions android 12+',
          );
        } else {
          console.error(
            '[handleAndroidPermissions] User refuses runtime permissions android 12+',
          );
        }
      });
    } else if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(checkResult => {
        if (checkResult) {
          console.debug(
            '[handleAndroidPermissions] runtime permission Android <12 already OK',
          );
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ).then(requestResult => {
            if (requestResult) {
              console.debug(
                '[handleAndroidPermissions] User accepts runtime permission android <12',
              );
            } else {
              console.error(
                '[handleAndroidPermissions] User refuses runtime permission android <12',
              );
            }
          });
        }
      });
    }
  };

  return (
    <>
      <StatusBar />
      <View>

          <View>
            <Text>
            Vechicle - {peripheralFound ? <Text>Connected</Text> : <Text>disconnected</Text>}
            </Text>
            <Text>{location}</Text>
          <Pressable style={styles.scanButton} onPress={() => togglePeripheralConnection('E8:6B:EA:CF:C6:E2')}>
            {!isScanning ? <ActivityIndicator size="large" color="00ff00" /> : <Text style={styles.scanButtonText}>{peripheralFound ? 'Disconnect' : 'Connect'}</Text>}

            </Pressable>
          </View>
      </View>
    </>
  );
};

const boxShadow = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

const styles = StyleSheet.create({
  engine: {
    position: 'absolute',
    right: 10,
    bottom: 0,
    color: Colors.black,
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#0a398a',
    margin: 10,
    borderRadius: 12,
    ...boxShadow,
  },
  scanButtonText: {
    fontSize: 20,
    letterSpacing: 0.25,
    color: Colors.white,
  },
  body: {
    backgroundColor: '#0082FC',
    flex: 1,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  peripheralName: {
    fontSize: 16,
    textAlign: 'center',
    padding: 10,
  },
  rssi: {
    fontSize: 12,
    textAlign: 'center',
    padding: 2,
  },
  peripheralId: {
    fontSize: 12,
    textAlign: 'center',
    padding: 2,
    paddingBottom: 20,
  },
  row: {
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 20,
    ...boxShadow,
  },
  noPeripherals: {
    margin: 10,
    textAlign: 'center',
    color: Colors.white,
  },
});

export default App;
