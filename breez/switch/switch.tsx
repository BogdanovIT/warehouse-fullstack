import React, { useState } from 'react';
import { View, Switch, Text, StyleSheet } from 'react-native';
import { SystemColors } from '../shared/tokens';

interface SwitchButtonProps {
    value: boolean
    onChange: (newValue: boolean) => void
}

const SwitchButton = ({ value, onChange}: SwitchButtonProps) => {
  
  return (
    <View style={styles.container}>
      <Switch
        trackColor={{ false: SystemColors.LightBlue, true: SystemColors.VeryLightBlue }}
        thumbColor={value ? SystemColors.LightBlue : SystemColors.VeryLightBlue}
        ios_backgroundColor="#3e3e3e"
        onValueChange={onChange}
        value={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SwitchButton;