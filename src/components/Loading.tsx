import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  // Dark theme colors
  const backgroundColor = '#0A0A0A';
  const textColor = '#E8E8E8';
  const primaryColor = '#4A9EFF';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ActivityIndicator size="large" color={primaryColor} />
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    // backgroundColor will be set dynamically
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    // color will be set dynamically
  },
});

export default Loading;