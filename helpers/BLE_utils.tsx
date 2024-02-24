import {Platform, PermissionsAndroid} from 'react-native';
import BleManager, {
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
} from 'react-native-ble-manager';
import {sleep} from './utils';

declare module 'react-native-ble-manager' {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

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

const SECONDS_TO_SCAN_FOR = 5;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = false;

const startBLEManager = () => {
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
};

const startScan = () => {
  try {
    console.debug('[startScan] starting scan...');
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
};

const connectPeripheral = async (peripheral: Peripheral) => {
  try {
    if (peripheral) {
      await BleManager.connect(peripheral.id);
      console.debug(`[connectPeripheral][${peripheral.id}] connected.`);

      // before retrieving services, it is often a good idea to let bonding & connection finish properly
      await sleep(900);

      /* Test read current RSSI value, retrieve services first */
      const peripheralData = await BleManager.retrieveServices(peripheral.id);
      console.debug(
        `[connectPeripheral][${peripheral.id}] retrieved peripheral services`,
        JSON.stringify(peripheralData),
      );

      const rssi = await BleManager.readRSSI(peripheral.id);
      console.debug(
        `[connectPeripheral][${peripheral.id}] retrieved current RSSI value: ${rssi}.`,
      );
      try {
        await BleManager.startNotification(
          peripheralData.id,
          'cb0f22c6-1000-4737-9f86-1c33f4ee9eea',
          'cb0f22c6-1001-41a0-93d4-9025f8b5eafe',
        );

        console.log(
          `[connectPeripheral][${peripheral.id}] with service id cb0f22c6-1000-4737-9f86-1c33f4ee9eea charaterstic id cb0f22c6-1001-41a0-93d4-9025f8b5eafe started notification`,
        );
      } catch (err) {
        console.error(
          `[connectPeripheral][${peripheral.id}] with service id cb0f22c6-1000-4737-9f86-1c33f4ee9eea charaterstic id cb0f22c6-1001-41a0-93d4-9025f8b5eafe failed to start notification`,
          err,
        );
      }
    }
  } catch (error) {
    console.error(
      `[connectPeripheral][${peripheral.id}] connectPeripheral error`,
      error,
    );
  }
};

export {
  handleAndroidPermissions,
  startScan,
  connectPeripheral,
  startBLEManager,
};
