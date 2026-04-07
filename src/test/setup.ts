import '@testing-library/jest-dom'

// jsdom doesn't implement HTMLMediaElement methods
window.HTMLMediaElement.prototype.load = () => {}
window.HTMLMediaElement.prototype.play = () => Promise.resolve()
window.HTMLMediaElement.prototype.pause = () => {}
