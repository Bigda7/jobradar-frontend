import { proxyJobRadar } from './_proxy';

export function GET(request: Request): Promise<Response> {
  return proxyJobRadar(request, '/matches');
}
