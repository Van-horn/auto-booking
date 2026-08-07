import { Text } from 'react-native';

export function AppText({ style, bold, ...props }) {
  return (
    <Text style={[{ fontFamily: bold ? 'Roboto_700Bold' : 'Roboto_400Regular' }, style]} {...props} />
  );
}
