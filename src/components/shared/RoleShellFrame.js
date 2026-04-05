import { StyleSheet, View } from 'react-native';

export function RoleShellFrame({ children }) {
  return <View style={styles.frame}>{children}</View>;
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    minHeight: 0,
    overflow: 'visible',
  },
});
