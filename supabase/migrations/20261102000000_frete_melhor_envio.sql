-- O frete passa a vir do Melhor Envio. A tabela de regiões provisória sai,
-- e o pedido guarda qual serviço de entrega o cliente escolheu.
-- A coluna regiao passa a guardar o nome do serviço (ex.: "Loggi Express").
drop table public.regioes_entrega;

alter table public.pedidos add column servico_frete integer;
comment on column public.pedidos.servico_frete is 'Id do serviço no Melhor Envio.';
comment on column public.pedidos.regiao is 'Nome do serviço de entrega escolhido (transportadora e serviço).';
