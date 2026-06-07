import '@testing-library/jest-dom'

// jsdom doesn't implement the Canvas API; some Radix/shadcn components call
// getContext() during module evaluation. Return null to silence the warning.
HTMLCanvasElement.prototype.getContext = () => null
