import * as ImageManipulator from 'expo-image-manipulator';

export async function compressImage(uri: string, maxWidth = 1280): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}
