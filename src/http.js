export const serverOptions = { headersTimeout: 5000, requestTimeout: 5000, connectionsCheckingInterval: 250 };

export async function listen(server, port) {
  server.maxConnections = 32;
  server.headersTimeout = 5000;
  server.requestTimeout = 5000;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  server.removeAllListeners('error');
  let closing;
  return { port: server.address().port, close: () => closing ??= new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }) };
}
