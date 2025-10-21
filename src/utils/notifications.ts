import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function ensurePushPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED) {
    return true;
  }
  const req = await Notifications.requestPermissionsAsync();
  return req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
}

export async function getExpoPushToken(projectId?: string): Promise<string | null> {
  if (!Device.isDevice) return null;
  const granted = await ensurePushPermission();
  if (!granted) return null;

  const resp = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  return resp.data ?? null;
}
