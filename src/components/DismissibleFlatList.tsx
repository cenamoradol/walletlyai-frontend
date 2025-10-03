import React from 'react';
import { FlatList, FlatListProps } from 'react-native';

export default function DismissibleFlatList<T>(props: FlatListProps<T>) {
  return (
    <FlatList
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      {...props}
    />
  );
}
