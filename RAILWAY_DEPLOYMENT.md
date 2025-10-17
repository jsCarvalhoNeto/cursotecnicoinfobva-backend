# Deploy no Railway

## Configuração de Variáveis de Ambiente

Para o backend funcionar corretamente no Railway, as seguintes variáveis de ambiente devem ser configuradas:

### Opção 1: Usando DATABASE_URL (recomendado)
Se você tiver um serviço MySQL hospedado externamente ou no Railway:

```
DATABASE_URL=mysql://username:password@host:port/database_name
```

### Opção 2: Usando variáveis separadas
Se você estiver usando o serviço MySQL do Railway:

```
DB_HOST=mysql.railway.internal
DB_USER=root
DB_PASSWORD=hKqzfPhyDJLAJujRUPjZebecKknlbMVN
DB_NAME=railway
PORT=2540
NODE_ENV=production
CORS_ORIGIN=https://cursotecnicoinfobva-frontend-production.up.railway.app
TRUST_PROXY=true
```

## Script de Inicialização

Certifique-se de que o Railway esteja usando o script correto para iniciar o servidor:

**Comando de inicialização:** `npm start`

Ou se preferir o script de produção:

**Comando de inicialização:** `npm run production`

**Importante:** O Railway não deve usar `npm run dev` em produção, pois isso pode causar problemas de desempenho e segurança.

## Configurações Adicionais

### CORS
As origens permitidas já estão configuradas para funcionar com domínios do Railway:

```
https://*.railway.app
https://*.up.railway.app
```

## Troubleshooting

### Banco de dados mockado sendo usado
Se o log mostrar "Usando banco de dados mockado", verifique:

1. **Variáveis de ambiente**: Confirme que `DATABASE_URL` ou as variáveis `DB_*` estão configuradas corretamente
2. **Conexão com MySQL**: Verifique se o serviço MySQL está ativo no Railway
3. **Script de inicialização**: Confirme que está usando `npm start` e não `npm run dev`

### URLs com barras duplicadas
Se o frontend mostrar erros como `//api/auth/me` (com duas barras), isso foi resolvido com as seguintes correções:

1. **Frontend**: Atualizado `api.ts` para garantir que não haja barra final no `baseURL`
2. **Backend**: Configurado para servir rotas tanto com quanto sem prefixo `/api` para manter compatibilidade

### Rotas 404 no módulo estudante
Se as rotas `/subjects` e `/activities/student` retornarem 404 apenas no módulo estudante no Railway, isso foi resolvido com:

1. **Padronização de rotas**: Agora todas as rotas principais estão disponíveis tanto com quanto sem prefixo `/api` no backend
2. **Correção no frontend**: Garantido que não haja conflito de URLs com dupla barra
3. **Configuração do frontend**: Usar `VITE_API_URL=https://cursotecnicoinfobva-backend-production.up.railway.app/api` no ambiente de produção

### Host bloqueado no frontend (Vite)
Se aparecer "Blocked request. This host is not allowed", verifique o `vite.config.ts`:
- Adicione os domínios do Railway em `server.allowedHosts`
- Domínios comuns: `.railway.app`, `.up.railway.app`

### Logs úteis
O middleware de banco de dados mostra logs detalhados como:
- `🔍 Debug - Variáveis de ambiente do banco de dados`
- `📡 Configuração de conexão final`
- `🔌 Tentando conectar ao MySQL`

## Estrutura do Banco de Dados

O sistema espera as seguintes tabelas no banco de dados:
- `users`
- `profiles`
- `user_roles`
- `subjects`
- `teacher_subjects`
- `enrollments`
- `activities`
- `activity_grades`
- `grades`
- `attendances`
- `subject_content`
- `subject_resources`

## Scripts Disponíveis

- `npm start` - Inicia o servidor em modo de produção
- `npm run production` - Inicia com NODE_ENV=production explicitamente
- `npm run dev` - Modo de desenvolvimento com hot reload (não recomendado para produção)

## Health Check

O servidor responde em `/api` com uma mensagem de status para verificação de saúde da aplicação.

## Deploy Checklist

Antes de fazer o deploy:

- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Script de inicialização definido como `npm start`
- [ ] Banco de dados MySQL ativo e configurado
- [ ] Frontend configurado com URL do backend com prefixo `/api`
- [ ] Verificar logs após deploy para confirmar conexão com banco de dados

## Problemas Comuns e Soluções

### Erro "jsxDEV is not a function" no frontend
Se o frontend mostrar este erro, pode ser necessário instalar o plugin `@vitejs/plugin-react` e atualizar o `vite.config.ts` para usá-lo em vez de `@vitejs/plugin-react-swc`.

**Solução:**
1. Instale o plugin: `npm install @vitejs/plugin-react --save-dev`
2. Atualize o `vite.config.ts` para importar e usar `@vitejs/plugin-react` em vez de `@vitejs/plugin-react-swc`
3. Rebuild o projeto para produção

### Rotas retornando 404 no Railway - Problema Resolvido
O problema de rotas como `/subjects` e `/activities/student` retornando 404 apenas no módulo estudante no Railway foi resolvido com:

1. **Compatibilidade total no backend**: Agora todas as rotas principais estão disponíveis tanto com quanto sem prefixo `/api` para garantir funcionamento em ambos ambientes
2. **Correção de dupla barra no frontend**: Atualizado o serviço de API para evitar URLs com `//`
3. **Configuração**: O frontend deve usar `VITE_API_URL` com o sufixo `/api` para ambiente de produção, mas as rotas funcionam em ambos formatos
4. **Manutenção de compatibilidade**: Tanto `/api/subjects` quanto `/subjects` funcionam para manter ambos ambientes operacionais
