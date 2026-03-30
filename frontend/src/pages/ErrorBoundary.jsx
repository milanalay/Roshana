import { Component } from 'react';

/**
 * ErrorBoundary — App-wide React error boundary.
 * Catches unhandled render errors and shows a friendly recovery screen.
 * Wrap the root app content with this in App.js.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in development — replace with error monitoring in production
    if (process.env.NODE_ENV === 'development') {
      console.error('[Roshana] Render error caught by ErrorBoundary:', error);
      console.error('Component stack:', info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="error-boundary-screen"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '2rem',
            textAlign: 'center',
            background: '#F4F6F9',
            maxWidth: '448px',
            margin: '0 auto',
          }}
        >
          {/* Icon */}
          <span style={{ fontSize: '4rem', marginBottom: '1rem' }} role="img" aria-label="stethoscope">
            🩺
          </span>

          {/* Heading */}
          <h1
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#1B3A6B',
              marginBottom: '0.5rem',
            }}
          >
            Something went wrong
          </h1>

          {/* Message */}
          <p
            style={{
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '0.875rem',
              color: '#6B7280',
              lineHeight: 1.6,
              marginBottom: '0.5rem',
              maxWidth: '280px',
            }}
          >
            Roshana encountered an unexpected error. Your data is safe — reload the app to continue.
          </p>

          {/* Error detail (dev only) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: '#EF4444',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1.5rem',
                maxWidth: '320px',
                wordBreak: 'break-word',
                textAlign: 'left',
              }}
            >
              {this.state.error.toString()}
            </p>
          )}

          {/* Spacer when no error detail */}
          {!(process.env.NODE_ENV === 'development' && this.state.error) && (
            <div style={{ marginBottom: '1.5rem' }} />
          )}

          {/* Reload button */}
          <button
            data-testid="error-reload-btn"
            onClick={() => window.location.reload()}
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: '#FFFFFF',
              background: '#1B3A6B',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.875rem 2rem',
              minHeight: '48px',
              minWidth: '160px',
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>

          {/* Disclaimer */}
          <p
            style={{
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '0.625rem',
              color: '#9CA3AF',
              marginTop: '2rem',
              maxWidth: '260px',
              lineHeight: 1.5,
            }}
          >
            For educational use only. In a clinical setting, always use your facility's approved references.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
