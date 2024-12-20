import { askar } from '@owf/askar-react-native'
import { StyleSheet, Text, View } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export const App = () => (
  <View style={styles.container}>
    <Text>{askar.version()}</Text>
  </View>
)
