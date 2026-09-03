import * as ImagePicker from 'expo-image-picker';

const compressedImageOptions = {
  quality: 0.7,
  base64: true as const,
  exif: false as const,
};

function guessMime(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) {
    return 'image/png';
  }
  if (lower.includes('.webp')) {
    return 'image/webp';
  }
  if (lower.includes('.gif')) {
    return 'image/gif';
  }
  return 'image/jpeg';
}

function resultToDataUri(result: ImagePicker.ImagePickerResult): string | null {
  if (result.canceled || !result.assets[0]?.base64) {
    return null;
  }

  const asset = result.assets[0];
  const mime = asset.mimeType || guessMime(asset.fileName || asset.uri);
  return `data:${mime};base64,${asset.base64}`;
}

/**
 * 打开系统相册，返回可供 WebView Image 使用的 data URI。
 * 不用 file:// / content://，Android WebView 经常读不到。
 */
export async function pickLibraryImageAsDataUri(): Promise<string | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      ...compressedImageOptions,
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
    });
    return resultToDataUri(result);
  } catch {
    return null;
  }
}

/** 打开系统相机拍照，返回 data URI；未授权或取消则为 null。 */
export async function takeCameraImageAsDataUri(): Promise<string | null> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return null;
    }

    const result = await ImagePicker.launchCameraAsync(compressedImageOptions);
    return resultToDataUri(result);
  } catch {
    return null;
  }
}
