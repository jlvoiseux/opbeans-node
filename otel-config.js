const api = require('@opentelemetry/api');
const opentelemetry = require("@opentelemetry/sdk-node");
const { OTLPTraceExporterGRPC } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPTraceExporterHTTP } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes: ResourceAttributesSC } = require('@opentelemetry/semantic-conventions');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { HostMetrics } = require('@opentelemetry/host-metrics');
const apiMetrics = require('@opentelemetry/api-metrics');
const { MeterProvider, ConsoleMetricExporter } = require('@opentelemetry/sdk-metrics-base');
const { OTLPMetricExporterGRPC } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { OTLPMetricExporterHTTP } = require('@opentelemetry/exporter-metrics-otlp-http');
const execSync = require('child_process').execSync;

module.exports =  (serviceName, environment) => {

  var traceExporter = {}
  var metricExporter = {}

  if (process.env.OTEL_EXPORTER_OTLP_PROTOCOL == "http"){
    traceExporter = new OTLPTraceExporterHTTP({
      url: "http://apm-server:8200", // url is optional and can be omitted - default is http://localhost:55681/v1/traces
      headers: {}, // an optional object containing custom headers to be sent with each request
      concurrencyLimit: 1000, // an optional limit on pending requests
    });

    metricExporter = new OTLPMetricExporterHTTP({
      url: "http://apm-server:8200", // url is optional and can be omitted - default is http://localhost:55681/v1/traces
      concurrencyLimit: 1000, // an optional limit on pending requests
    });
  }
  else {
    traceExporter = new OTLPTraceExporterGRPC({
      url: "http://apm-server:8200", // url is optional and can be omitted - default is http://localhost:55681/v1/traces
      headers: {}, // an optional object containing custom headers to be sent with each request
      concurrencyLimit: 1000, // an optional limit on pending requests
    });

    metricExporter = new OTLPMetricExporterGRPC({
      url: "http://apm-server:8200", // url is optional and can be omitted - default is http://localhost:55681/v1/traces
      concurrencyLimit: 1000, // an optional limit on pending requests
    });
  }


  const resource = new Resource({
    [ResourceAttributesSC.CONTAINER_ID]: execSync('basename $(cat /proc/1/cpuset)').toString()
  });

  const sdk = new opentelemetry.NodeSDK({
    resource: resource,
    traceExporter: traceExporter,
    metricExporter: metricExporter,
    metricInterval: 2000,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  if(process.env.APM_AGENT_TYPE == "opentelemetry"){
    sdk.start().then(() => {

      const hostMetrics = new HostMetrics(apiMetrics.metrics.getMeterProvider());
      hostMetrics.start();

    });
  }

  return api.trace.getTracer(process.env.OPBEANS_NODE_OTEL_SERVICE_NAME);
};
