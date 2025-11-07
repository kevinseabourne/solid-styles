/**
 * Animation System Debug Tools
 *
 * This module provides visual debugging tools for the animation system
 */

import { createSignal, onCleanup, onMount, For, Show } from "solid-js";
import { styled } from "../src";
import { getRegisteredAnimations, runAnimationDiagnostics } from "./diagnostics";
import { AnimationState } from "./spring-bridge";

// Debug panel styles
const DebugPanel = styled("div")`
  position: fixed;
  bottom: 10px;
  right: 10px;
  width: 300px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  z-index: 9999;
  max-height: 400px;
  overflow-y: auto;
`;

const DebugHeader = styled("div")`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
`;

const DebugTitle = styled("div")`
  font-weight: bold;
`;

const DebugButton = styled("button")`
  background: #555;
  color: white;
  border: none;
  padding: 2px 5px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 10px;

  &:hover {
    background: #777;
  }
`;

const AnimationItem = styled("div")`
  margin-bottom: 5px;
  padding: 5px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
`;

interface StateIndicatorProps {
  state: AnimationState;
}

const StateIndicator = styled("span")`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
  background-color: ${(props: { state: AnimationState }) => {
    switch (props.state) {
      case "idle":
        return "#888";
      case "running":
        return "#4caf50";
      case "paused":
        return "#ff9800";
      case "completed":
        return "#2196f3";
      default:
        return "#f44336";
    }
  }};
`;

// Animation debugger component
export function AnimationDebugger() {
  const [visible, setVisible] = createSignal(true);
  const [animations, setAnimations] = createSignal<[string, any][]>([]);
  const [expanded, setExpanded] = createSignal<Record<string, boolean>>({});
  const [eventLog, setEventLog] = createSignal<string[]>([]);

  // Update animation list periodically
  let intervalId: number;

  onMount(() => {
    // Add event listeners to capture animation events
      originalConsoleLog(...args);

      // Capture animation related logs
      const message = args.join(" ");
      if (message.includes("[ANIM-")) {
        setEventLog((prev) => [...prev.slice(-19), message]);
      }
    };

    // Initialize update interval
    intervalId = window.setInterval(() => {
      const registeredAnimations = getRegisteredAnimations();
      setAnimations(Array.from(registeredAnimations.entries()));
    }, 500);

    onCleanup(() => {
      clearInterval(intervalId);
    });
  });

  // Toggle animation details
  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Run diagnostics
  const runDiagnostics = () => {
    runAnimationDiagnostics();
  };

  // Monitor element event listeners
  const analyzeEventListeners = () => {

    // Find all elements with data-test-id attributes (our animated elements)
    const elements = document.querySelectorAll("[data-test-id]");

    elements.forEach((el) => {
      const testId = el.getAttribute("data-test-id");
    });
  };

  // Utility to check event listeners (browser dev tools compatibility)
  function getEventListeners(element: HTMLElement) {
    try {
      // In Chrome Dev Tools, getEventListeners is available in the console
      // For this helper function, we'll use a different approach to detect listeners
      const events = ["mouseover", "mouseout", "click"];
      const result: Record<string, boolean> = {};

      events.forEach((eventType) => {
        // Create a test event
        const testEvent = new Event(eventType, { bubbles: true });

        // Track if event is handled
        let handled = false;
        const originalAddEventListener = element.addEventListener;

        // Override addEventListener temporarily
        element.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject) {
          if (type === eventType) {
            handled = true;
          }
          return originalAddEventListener.apply(this, [type, listener]);
        };

        // Dispatch test event
        element.dispatchEvent(testEvent);

        // Restore original
        element.addEventListener = originalAddEventListener;

        result[eventType] = handled;
      });

      return result;
    } catch (e) {
      return "Error analyzing event listeners";
    }
  }

  if (!visible())
    return (
      <DebugButton
        style={{ position: "fixed", bottom: "10px", right: "10px", "z-index": 9999 }}
        onClick={() => setVisible(true)}
      >
        Show Animation Debug
      </DebugButton>
    );

  return (
    <DebugPanel>
      <DebugHeader>
        <DebugTitle>Animation Debugger</DebugTitle>
        <div>
          <DebugButton onClick={runDiagnostics}>Run Diagnostics</DebugButton>
          <DebugButton onClick={analyzeEventListeners}>Check Events</DebugButton>
          <DebugButton onClick={() => setVisible(false)}>Hide</DebugButton>
        </div>
      </DebugHeader>

      <div style={{ margin: "10px 0", "font-weight": "bold" }}>Active Animations ({animations().length})</div>

      <Show
        when={animations().length === 0}
        children={<p>No active animations</p>}
      />

      <For
        each={animations()}
        children={([id, instance]: [string, any]) => (
          <AnimationItem>
            <div
              style={{ cursor: "pointer" }}
              onClick={() => toggleExpand(id)}
            >
              <StateIndicator state={instance.state || "running"} />
              <strong>{id}</strong> - {instance.status || "running"}
            </div>

            <Show
              when={expanded()[id]}
              children={
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  <div>Progress: {Math.round((instance.progress || 0) * 100)}%</div>
                  <div>Value: {JSON.stringify(instance.value)}</div>
                  <div>Target: {JSON.stringify(instance.target)}</div>
                </div>
              }
            />
          </AnimationItem>
        )}
      />

      <div style={{ marginTop: "10px", borderTop: "1px solid #ccc", paddingTop: "10px" }}>
        <strong>Event Log:</strong>
        <For
          each={eventLog()}
          children={(log: string) => <div style={{ "margin-bottom": "2px" }}>{log}</div>}
        />
      </div>
    </DebugPanel>
  );
}
