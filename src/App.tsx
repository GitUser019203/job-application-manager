// App.tsx
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import JobWizard from './components/JobWizard';
import LoginWall from './components/LoginWall';

export default function App() {
  const user = useContext(AuthContext);
  return user ? <JobWizard /> : <LoginWall onLogin={() => { }} />;
}