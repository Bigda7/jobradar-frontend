import { proxyJobRadar } from './_proxy.js';

export function GET(request: Request): Promise<Response> {
  return proxyJobRadar(request, '/sources');
}
