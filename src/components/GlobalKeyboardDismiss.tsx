import React, { PropsWithChildren } from 'react';
import { Keyboard, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';

/**
 * Envuelve tu app/navegación. Al tocar fuera de inputs, cierra el teclado.
 * - accessible={false} evita interferir con accesibilidad.
 * - No bloquea Pressables/Buttons dentro; solo escucha el tap en el área vacía.
 */
export default function GlobalKeyboardDismiss({ children }: PropsWithChildren) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>{children}</View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
