import { createContext, createSignal, createMemo, useContext } from 'solid-js';
import { render } from 'solid-js/web';

// Simple context test
const TestContext = createContext<{
  isEnabled: () => boolean;
  toggle: () => void;
}>({
  isEnabled: () => true,
  toggle: () => {}
});

const TestProvider = ({ children }: { children: any }) => {
  const [enabled, setEnabled] = createSignal(true);
  
  const isEnabled = createMemo(() => enabled());
  
  const context = {
    isEnabled,
    toggle: () => {
      console.log('Toggle called, current:', enabled());
      setEnabled(prev => !prev);
      console.log('After toggle:', enabled());
    }
  };
  
  return (
    <TestContext.Provider value={context}>
      {children}
    </TestContext.Provider>
  );
};

const TestComponent = () => {
  const ctx = useContext(TestContext);
  
  return (
    <div>
      <button onClick={ctx.toggle}>
        Toggle
      </button>
      <div>Status: {ctx.isEnabled() ? 'ON' : 'OFF'}</div>
    </div>
  );
};

const App = () => (
  <TestProvider>
    <TestComponent />
  </TestProvider>
);

render(() => <App />, document.getElementById('root')!);
