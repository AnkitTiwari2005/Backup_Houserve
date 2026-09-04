// This file is intentionally minimal.
// The splash logic has been moved to App.tsx as a SplashOverlay component
// that renders as a fixed overlay on every cold launch, correctly handling
// both first-time and returning users regardless of auth state.
export default function Splash() { return null; }
