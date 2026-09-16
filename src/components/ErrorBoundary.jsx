import { Component } from "react";

// React unmounts the entire tree when a render throws, which shows up as a
// blank white page. This catches that and shows what actually went wrong.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="empty-state large">
          <h3>Something broke on this page</h3>
          <p>{this.state.error.message}</p>
          <button
            className="secondary-button"
            onClick={() => this.setState({ error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
