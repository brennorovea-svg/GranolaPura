// Assinatura das notificações do Mercado Pago (cabeçalho x-signature).

async function hmacHex(chave: string, mensagem: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(chave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const assinatura = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(mensagem));
  return Array.from(new Uint8Array(assinatura), (b) => b.toString(16).padStart(2, '0')).join('');
}

// https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
export async function assinaturaValida(req: Request, dataId: string, segredo: string) {
  const partes = Object.fromEntries(
    (req.headers.get('x-signature') ?? '').split(',').map((p) => p.trim().split('=') as [string, string]),
  );
  const requestId = req.headers.get('x-request-id') ?? '';
  if (!partes.ts || !partes.v1) return false;
  const manifesto = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${partes.ts};`;
  return (await hmacHex(segredo, manifesto)) === partes.v1;
}
