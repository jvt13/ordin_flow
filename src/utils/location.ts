import * as Location from 'expo-location';
import type { LocationData } from '../types';

export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    let address: string | undefined;
    try {
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (geo) {
        address = [geo.street, geo.district, geo.city].filter(Boolean).join(', ');
      }
    } catch {
      // endereço opcional
    }

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      address,
    };
  } catch {
    return null;
  }
}
