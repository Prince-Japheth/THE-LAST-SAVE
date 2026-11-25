import {requireOrigin,readBody,issueTicket,publicConfig,PushError,errorResponse} from '../../../../lib/push-server.mjs';
export const runtime='nodejs';
export async function POST(request){try{requireOrigin(request);if(!publicConfig(request).configured)throw new PushError('Configure VAPID on the server first.',503);const body=await readBody(request);return Response.json({ticket:issueTicket(body.subscription)},{headers:{'Cache-Control':'no-store'}})}catch(e){return errorResponse(e)}}
