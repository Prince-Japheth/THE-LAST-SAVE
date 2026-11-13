import {publicConfig} from '../../../../lib/push-server.mjs';
export const runtime='nodejs';
export function GET(request){const {subject,...config}=publicConfig(request);return Response.json(config,{headers:{'Cache-Control':'no-store'}})}
