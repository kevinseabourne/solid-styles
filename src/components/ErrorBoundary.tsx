import { Component, JSX, createSignal, Show, ErrorBoundary as SolidErrorBoundary } from "solid-js";
import { errorHandler, ErrorType, ErrorSeverity } from "../error-handling";
import { styled } from "../index";

interface ErrorBoundaryProps {
  children: JSX.Element;
  fallback?: (error: Error, reset: () => void) => JSX.Element;
  onError?: (error: Error) => void;
  isolate?: boolean;
  showDetails?: boolean;
}

// Styled components for error display
const ErrorContainer = styled("div")`
  padding: 20px;
  margin: 20px;
  border: 1px solid #dc3545;
  border-radius: 8px;
  background-color: #f8d7da;
  color: #721c24;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const ErrorTitle = styled("h2")`
  margin: 0 0 10px 0;
  font-size: 1.5em;
  color: #dc3545;
`;

const ErrorMessage = styled("p")`
  margin: 10px 0;
  font-size: 1em;
  line-height: 1.5;
`;

const ErrorStack = styled("pre")`
  margin: 10px 0;
  padding: 10px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875em;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
`;

const ResetButton = styled("button")`
  padding: 8px 16px;
  margin-top: 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c82333;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const ErrorDetails = styled("details")`
  margin-top: 15px;
  cursor: pointer;

  summary {
    font-weight: bold;
    user-select: none;
  }
`;

export const ErrorBoundary: Component<ErrorBoundaryProps> = (props) => {
  const [errorCount, setErrorCount] = createSignal(0);

  return (
    <SolidErrorBoundary
      fallback={(error, reset) => {
        setErrorCount((c) => c + 1);

        // Log to error handler
        errorHandler.handleError({
          type: ErrorType.RUNTIME_ERROR,
          severity: ErrorSeverity.ERROR,
          message: error.message,
          component: "ErrorBoundary",
          stack: error.stack,
          context: {
            errorCount: errorCount(),
          },
          timestamp: Date.now(),
        });

        // Call custom error handler if provided
        props.onError?.(error);

        // Error logged to handler

        // Use custom fallback if provided
        if (props.fallback) {
          return props.fallback(error, reset);
        }

        // Default error UI
        return (
          <ErrorContainer>
            <ErrorTitle>{props.isolate ? "Component Error" : "Application Error"}</ErrorTitle>

            <ErrorMessage>
              <strong>Something went wrong:</strong> {error.message}
            </ErrorMessage>

            <Show
              when={errorCount() > 1}
              children={<ErrorMessage>This error has occurred {errorCount()} times.</ErrorMessage>}
            />

            <Show
              when={props.showDetails !== false && process.env.NODE_ENV === "development"}
              children={
                <ErrorDetails>
                  <summary>Error Details</summary>

                  <Show
                    when={error.stack}
                    children={<ErrorStack>{error.stack}</ErrorStack>}
                  />

                  <p>
                    <strong>Timestamp:</strong> {new Date().toLocaleString()}
                  </p>
                </ErrorDetails>
              }
            />

            <ResetButton onClick={reset}>Reset Component</ResetButton>
          </ErrorContainer>
        );
      }}
      children={props.children}
    />
  );
};

// Animation-specific error boundary
export const AnimationErrorBoundary: Component<{
  children: JSX.Element;
  fallback?: JSX.Element;
}> = (props) => {
  return (
    <ErrorBoundary
      fallback={(error, reset) => {
        // Log animation-specific error
        errorHandler.handleError({
          type: ErrorType.ANIMATION_ERROR,
          severity: ErrorSeverity.WARNING,
          message: `Animation failed: ${error.message}`,
          component: "AnimationErrorBoundary",
          stack: error.stack,
          timestamp: Date.now(),
        });

        return (
          props.fallback || (
            <div
              style={{
                padding: "10px",
                background: "#fff3cd",
                border: "1px solid #ffeaa7",
                "border-radius": "4px",
                color: "#856404",
              }}
            >
              <p>Animation failed to load. Content displayed without animation.</p>
              <button
                onClick={reset}
                style={{
                  padding: "4px 8px",
                  background: "#ffc107",
                  border: "none",
                  "border-radius": "3px",
                  cursor: "pointer",
                }}
              >
                Retry Animation
              </button>
            </div>
          )
        );
      }}
      children={props.children}
    />
  );
};

// Style-specific error boundary for handling CSS parsing errors
export const StyleErrorBoundary: Component<{
  children: JSX.Element;
  componentName?: string;
}> = (props) => {
  const fallbackStyles = {
    padding: "20px",
    border: "2px dashed #ccc",
    "border-radius": "4px",
    background: "#f5f5f5",
    color: "#666",
    "text-align": "center" as const,
  };

  return (
    <ErrorBoundary
      fallback={(error) => {
        errorHandler.handleError({
          type: ErrorType.STYLE_PARSE_ERROR,
          severity: ErrorSeverity.ERROR,
          message: `Style parsing failed: ${error.message}`,
          component: props.componentName || "Unknown",
          stack: error.stack,
          timestamp: Date.now(),
        });

        return (
          <div style={fallbackStyles}>
            <p>Failed to apply styles{props.componentName ? ` to ${props.componentName}` : ""}</p>
            <small>Rendering with fallback styles</small>
          </div>
        );
      }}
      isolate
      showDetails={false}
      children={props.children}
    />
  );
};

// Export convenience wrapper for styled components with error boundaries
export function withErrorBoundary<T extends Component<Record<string, unknown>>>(
  WrappedComponent: T,
  options?: {
    fallback?: (error: Error, reset: () => void) => JSX.Element;
    onError?: (error: Error) => void;
    isolate?: boolean;
  }
): T {
  return ((props: Record<string, unknown>) => (
    <ErrorBoundary
      {...options}
      children={<WrappedComponent {...props} />}
    />
  )) as T;
}
