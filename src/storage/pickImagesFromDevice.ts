import * as ImagePicker from 'expo-image-picker';

const ANDROID_BROWSES_EVERY_FOLDER_NOT_JUST_THE_PHOTO_LIBRARY = { legacy: true };

export const pickImagesFromDevice = (options: ImagePicker.ImagePickerOptions) =>
  ImagePicker.launchImageLibraryAsync({
    ...ANDROID_BROWSES_EVERY_FOLDER_NOT_JUST_THE_PHOTO_LIBRARY,
    ...options,
  });
