import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

export default function SearchBar({ value, onChangeText, placeholder, onClear }) {
  return (
    <View style={styles.container}>
      <MaterialIcons name="search" size={20} color={COLORS.muted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Buscar...'}
        placeholderTextColor={COLORS.muted}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value ? (
        <TouchableOpacity onPress={onClear || (() => onChangeText(''))} style={styles.clearBtn}>
          <MaterialIcons name="close" size={18} color={COLORS.muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: COLORS.text,
  },
  clearBtn: {
    padding: SPACING.xs,
  },
});
