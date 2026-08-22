import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { importAvatarIntoAppStorage, resolveMediaUri } from '@/storage/mediaStore';
import { pickImagesFromDevice } from '@/storage/pickImagesFromDevice';
import type { AccountDraft } from '@/store/useAppStore';
import { avatarDiameter, spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';

type AccountFormProps = {
  initialDraft: AccountDraft;
  submitLabel: string;
  onSubmit: (draft: AccountDraft) => void;
};

const countFromInput = (rawInput: string) => {
  const digitsOnly = rawInput.replace(/[^0-9]/g, '');
  return digitsOnly.length === 0 ? 0 : Number(digitsOnly);
};

export const AccountForm = ({ initialDraft, submitLabel, onSubmit }: AccountFormProps) => {
  const palette = usePalette();
  const [draft, setDraft] = useState(initialDraft);

  const changeDraft = (changes: Partial<AccountDraft>) =>
    setDraft((existing) => ({ ...existing, ...changes }));

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to set a profile picture.');
      return;
    }

    const picker = await pickImagesFromDevice({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    const pickedAsset = picker.canceled ? undefined : picker.assets[0];
    if (!pickedAsset) return;

    const avatarPath = await importAvatarIntoAppStorage({
      uri: pickedAsset.uri,
      width: pickedAsset.width,
      height: pickedAsset.height,
    });
    changeDraft({ avatarPath });
  };

  const submitIfValid = () => {
    if (draft.handleWithoutAtSign.trim().length === 0) {
      Alert.alert('Handle needed', 'Give this account a handle so you can tell grids apart.');
      return;
    }
    onSubmit({
      ...draft,
      displayName: draft.displayName.trim(),
      handleWithoutAtSign: draft.handleWithoutAtSign.trim().replace(/^@/, ''),
      bio: draft.bio.trim(),
    });
  };

  const labelledInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    extraProps: { multiline?: boolean; keyboardType?: 'number-pad' } = {}
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.secondaryText }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          extraProps.multiline ? styles.multilineInput : null,
          { color: palette.primaryText, borderColor: palette.separator },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={palette.secondaryText}
        autoCapitalize="none"
        {...extraProps}
      />
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable style={styles.avatarPicker} onPress={pickAvatar}>
        {draft.avatarPath ? (
          <Image
            source={{ uri: resolveMediaUri(draft.avatarPath) }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: palette.placeholder }]} />
        )}
        <Text style={[styles.avatarLabel, { color: palette.accent }]}>Change photo</Text>
      </Pressable>

      {labelledInput('Display name', draft.displayName, (displayName) =>
        changeDraft({ displayName })
      )}
      {labelledInput('Handle', draft.handleWithoutAtSign, (handleWithoutAtSign) =>
        changeDraft({ handleWithoutAtSign })
      )}
      {labelledInput('Bio', draft.bio, (bio) => changeDraft({ bio }), { multiline: true })}
      {labelledInput(
        'Followers shown',
        String(draft.displayedFollowerCount),
        (rawInput) => changeDraft({ displayedFollowerCount: countFromInput(rawInput) }),
        { keyboardType: 'number-pad' }
      )}
      {labelledInput(
        'Following shown',
        String(draft.displayedFollowingCount),
        (rawInput) => changeDraft({ displayedFollowingCount: countFromInput(rawInput) }),
        { keyboardType: 'number-pad' }
      )}

      <Pressable
        style={[styles.submitButton, { backgroundColor: palette.accent }]}
        onPress={submitIfValid}
      >
        <Text style={styles.submitLabel}>{submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.roomy,
    gap: spacing.regular,
  },
  avatarPicker: {
    alignItems: 'center',
    gap: spacing.snug,
    paddingBottom: spacing.snug,
  },
  avatar: {
    width: avatarDiameter.profileHeader,
    height: avatarDiameter.profileHeader,
    borderRadius: avatarDiameter.profileHeader / 2,
  },
  avatarLabel: {
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  field: {
    gap: spacing.tight,
  },
  label: {
    fontSize: typeScale.caption,
    fontWeight: '600',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: spacing.regular,
    paddingVertical: spacing.regular,
    fontSize: typeScale.body,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: spacing.regular,
    alignItems: 'center',
    marginTop: spacing.snug,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: typeScale.emphasis,
    fontWeight: '700',
  },
});
