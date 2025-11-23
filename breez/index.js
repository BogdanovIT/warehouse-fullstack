import { registerRootComponent } from 'expo';
import AppLayout from './app/_layout';

export default function App() {
  return <AppLayout />;
}

registerRootComponent(App);