# Granola Pura

Site da Granola Pura, granola artesanal de São Paulo. Site estático no GitHub Pages, com checkout próprio: o cliente calcula o frete, paga pelo Mercado Pago (Pix ou cartão) e acompanha o pedido. O backend roda no Supabase.

## Estrutura

- `index.html`: a página, com o checkout na seção "Faça seu pedido".
- `pedido.html`: acompanhamento do pedido pelo link `pedido.html?c=<código>`.
- `painel.html`: painel da Lynda (login por link no e-mail), com os pedidos pagos e os botões "Saiu para entrega" e "Entregue".
- `css/style.css`: estilos e animações (paleta kraft, fontes Anton, Instrument Serif e DM Sans).
- `js/config.js`: endereço do projeto Supabase e chave publicável.
- `js/main.js`: checkout e animações de entrada no scroll. `js/pedido.js` e `js/painel.js`: as outras páginas.
- `img/`: fotos em WebP, logo e imagem de compartilhamento.
- `supabase/`: banco (`migrations/`) e Edge Functions (`functions/`).

## Como funciona a venda

1. `cotar-frete`: recebe o CEP, busca o endereço no ViaCEP e devolve preço e prazo pela tabela `regioes_entrega`.
2. `criar-pedido`: recalcula preço e frete no servidor, grava o pedido e cria o pagamento no Mercado Pago (Checkout Pro). O site manda o cliente para o link de pagamento.
3. `webhook-mercadopago`: recebe o aviso do Mercado Pago, valida a assinatura, confere o pagamento na API e marca o pedido como pago. Manda o e-mail de confirmação para o cliente e o aviso para a loja.
4. `status-pedido`: alimenta a página de acompanhamento, sem expor e-mail, telefone ou endereço.
5. `atualizar-status`: usada pelo painel; só aceita quem está na tabela `admins`, e avisa o cliente por e-mail.

O público não lê nem grava nenhuma tabela: tudo passa pelas funções, e a RLS só libera leitura para quem está em `admins`.

## Configuração (Supabase › Edge Functions › Secrets)

| Segredo | Para quê |
|---|---|
| `MP_ACCESS_TOKEN` | Access Token do Mercado Pago (de teste, depois o de produção). |
| `MP_WEBHOOK_SECRET` | Assinatura secreta do webhook (Mercado Pago › Suas integrações › Webhooks). |
| `RESEND_API_KEY` | Envio dos e-mails. Sem ela, os e-mails só vão para o log. |
| `EMAIL_REMETENTE` | Opcional. Padrão: `Granola Pura <pedidos@granolapura.com.br>`. |
| `EMAIL_LOJA` | E-mail que recebe o aviso de pedido pago. |
| `SITE_URL` | Opcional. Padrão: `https://www.granolapura.com.br`. |

No Mercado Pago, cadastre o webhook com a URL `https://khjizxhjygtemxyqbsio.supabase.co/functions/v1/webhook-mercadopago` e o evento **Pagamentos**.

Para o painel: em Authentication › URL Configuration, use `https://www.granolapura.com.br` como Site URL e adicione `https://www.granolapura.com.br/painel.html` nas Redirect URLs. Depois convide a Lynda em Authentication › Users › Invite e cadastre o e-mail dela:

```sql
insert into public.admins (email) values ('email-da-lynda@exemplo.com');
```

## Frete

As regiões ficam na tabela `regioes_entrega` (faixa de CEP, preço em centavos e prazo). Se um CEP cair em mais de uma faixa, vale a mais estreita. Para mudar um preço ou abrir uma região, edite a tabela no Supabase (Table Editor), sem mexer no código.

## Como alterar o essencial

- **Preço:** o valor cobrado é `PRECO_CENTAVOS` em `supabase/functions/_shared/loja.ts`. Ao mudar, atualize também `PRECO` em `js/main.js` e os textos do `index.html`.
- **Fotos:** troque os arquivos em `img/` mantendo os nomes.

## Rodar localmente

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000.

Testes das regras de frete e da assinatura do webhook:

```bash
cd supabase/functions && SUPABASE_URL=http://localhost SUPABASE_SERVICE_ROLE_KEY=x deno test --allow-env _shared/regras_test.ts
```

## Publicação

Settings › Pages › Build and deployment: "Deploy from a branch", branch `main`, pasta `/ (root)`.
