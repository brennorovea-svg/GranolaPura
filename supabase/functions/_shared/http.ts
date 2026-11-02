// CORS e respostas JSON. O site é estático e chama as funções de outro domínio.

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });

export const erro = (mensagem: string, status = 400) => json({ erro: mensagem }, status);
