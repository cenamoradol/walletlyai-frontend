import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

export default function DismissibleScrollView(props: ScrollViewProps) {
  return (
    <ScrollView
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      {...props}
    />
  );
}
