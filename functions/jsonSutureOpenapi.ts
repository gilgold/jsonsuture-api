import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  createClientFromRequest(req);
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'JSONSuture API',
      version: '1.0.0',
      description: 'Deterministically repair malformed JSON and validate it against JSON Schema. No LLM calls and no payload retention.'
    },
    servers: [{ url: 'https://vesper-3159a405.base44.app/functions' }],
    paths: {
      '/v1RepairJson': {
        post: {
          operationId: 'repairJson',
          summary: 'Repair and validate JSON',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['text'],
                  properties: {
                    text: { type: 'string', maxLength: 131072 },
                    schema: { type: 'object' },
                    options: {
                      type: 'object',
                      properties: {
                        coerce_types: { type: 'boolean', default: false },
                        use_defaults: { type: 'boolean', default: false }
                      },
                      additionalProperties: false
                    }
                  },
                  additionalProperties: false
                }
              }
            }
          },
          responses: {
            '200': { description: 'Repaired result' },
            '400': { description: 'Invalid input or schema' },
            '401': { description: 'Invalid API key' },
            '402': { description: 'Monthly quota exhausted' },
            '413': { description: 'Payload or schema too large' },
            '422': { description: 'Input cannot be repaired deterministically' },
            '429': { description: 'Rate limit exceeded' }
          }
        }
      },
      '/v1CreateKey': {
        post: {
          operationId: 'createFreeApiKey',
          summary: 'Create a free API key',
          responses: {
            '201': { description: 'Key created; raw key is returned once' },
            '429': { description: 'Signup limit reached' }
          }
        }
      },
      '/jsonSutureHealth': {
        get: {
          operationId: 'getHealth',
          summary: 'Service health',
          responses: { '200': { description: 'Operational status' } }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JSONSuture API key' }
      }
    }
  };
  return new Response(JSON.stringify(spec, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    }
  });
});
