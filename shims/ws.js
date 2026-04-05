class WebSocketStub {
  constructor() {
    throw new Error('The ws package is not supported in React Native runtime.');
  }
}

module.exports = WebSocketStub;
module.exports.default = WebSocketStub;
