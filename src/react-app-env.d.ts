/// <reference types="react-scripts" />

// Declare module types for components
declare module './components/*' {
  const Component: React.ComponentType<any>;
  export default Component;
}
declare module './types' {
  export * from './components/types';
}
declare module '*.css';