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
DB_PASSWORD=sua_senha_do_railway
DB_NAME=railway
DB_PORT=3306
NODE_ENV=production
PORT=8080
```

## Script de Inicialização

Certifique-se de que o Railway esteja usando o script correto para iniciar o servidor:

**Comando de inicialização:** `npm start`

Ou se preferir o script de produção:

**Comando de inicialização:** `npm run production`

## Configurações Adicionais

### CORS
As origens permitidas já estão configuradas para funcionar com domínios do Railway:

```
https://*.railway.app
https://*.up.railway.app
```

### Proxy do Railway
O backend já está configurado para lidar com o proxy reverso do Railway, então não é necessário configurar nada adicional.

## Troubleshooting

### Banco de dados mockado sendo usado
Se o log mostrar "Usando banco de dados mockado", verifique:

1. **Variáveis de ambiente**: Confirme que `DATABASE_URL` ou as variáveis `DB_*` estão configuradas corretamente
2. **Conexão com MySQL**: Verifique se o serviço MySQL está ativo no Railway
3. **Script de inicialização**: Confirme que está usando `npm start` e não `npm run dev`

### Logs úteis
O middleware de banco de dados mostra logs detalhados como:
- `🔍 Debug - Variáveis de ambiente do banco de dados`
- `📡 Configuração de conexão final`
- `🔌 Tentando conectar ao MySQL`
- `💡 Dica:` - mensagens com sugestões de correção

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
