# ML Vendas

Dashboard estático para acompanhar vendas do Mercado Livre, pronto para GitHub Pages.

## O que já faz

- Importa arquivos Excel (`.xlsx`, `.xls`) e CSV no navegador.
- Identifica automaticamente colunas comuns: **Data**, **Produto**, **Pedido**, **Quantidade**, **Preço** e **Total**.
- Exibe faturamento, pedidos, itens, ticket médio, evolução diária e produtos líderes.
- Mantém a última importação no navegador.
- Inclui um GitHub Action para atualizar `data/vendas.json` diariamente a partir da API oficial do Mercado Livre.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie estes arquivos para a branch `main`.
2. Em **Settings → Pages**, selecione **Deploy from a branch**, `main` e a pasta `/(root)`.
3. Aguarde a publicação; a URL do dashboard aparecerá nessa mesma tela.

## Ativar importação diária pelo Mercado Livre

1. Crie um app em [Mercado Livre Developers](https://developers.mercadolivre.com.br/).
2. Faça o fluxo OAuth e obtenha `client_id`, `client_secret` e `refresh_token`.
3. No repositório, vá em **Settings → Secrets and variables → Actions** e cadastre:
   - `ML_CLIENT_ID`
   - `ML_CLIENT_SECRET`
   - `ML_REFRESH_TOKEN`
4. Em **Actions**, execute manualmente **Importar vendas do Mercado Livre** uma vez para validar.

O agendamento roda às 08:15 (horário de São Paulo, enquanto o Brasil estiver em UTC-3) e carrega os últimos sete dias para reduzir risco de pedidos atualizados ficarem de fora. As credenciais ficam somente nos Secrets do GitHub, nunca no site público.

## Formato de importação manual

Uma linha deve representar um item vendido. Exemplo de cabeçalhos:

| Data | Pedido | Produto | Quantidade | Preço unitário | Total |
| --- | --- | --- | ---: | ---: | ---: |
| 29/08/2026 | 2000001 | Produto A | 2 | 50,00 | 100,00 |

O dashboard usa o total da linha se ele existir; caso contrário calcula `quantidade × preço`.

