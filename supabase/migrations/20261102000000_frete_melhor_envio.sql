-- O frete passa a vir do Melhor Envio. O pedido guarda qual serviço de entrega
-- o cliente escolheu; a coluna regiao passa a guardar o nome do serviço.
alter table public.pedidos add column servico_frete integer;
comment on column public.pedidos.servico_frete is 'Id do serviço no Melhor Envio.';
comment on column public.pedidos.regiao is 'Nome do serviço de entrega escolhido (transportadora e serviço).';
