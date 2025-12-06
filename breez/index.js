import { registerRootComponent } from 'expo';
import AppLayout from './app/_layout';
import 'expo-router/entry'

export default function App() {
  return <AppLayout />;
}

registerRootComponent(App);