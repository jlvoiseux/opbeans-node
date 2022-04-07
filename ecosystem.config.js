module.exports = {
  apps: [{
    name: 'server',
    script: './server.js',
    node_args:'--require ./otel-config',
    instances: 1
  }]
}
