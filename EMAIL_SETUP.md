# Configuração de E-mail para o Portal do Curso

## Configuração do Gmail para Envio de E-mails

Para que o formulário de contato funcione corretamente, você precisa configurar as credenciais de e-mail no arquivo `.env`.

### Passo 1: Habilitar a Autenticação de Aplicativo

1. Acesse sua conta Gmail (professorsantosbva@gmail.com)
2. Vá para "Configurações" > "Conta" > "Segurança"
3. Habilite a "Verificação em duas etapas" (se ainda não estiver habilitada)
4. Em "Segurança", procure por "Senhas de app"

### Passo 2: Gerar Senha de Aplicativo

1. Clique em "Senhas de app"
2. Selecione "Email" como o tipo de app
3. Escolha o dispositivo (pode ser "Outro" e dar um nome como "PortalCurso")
4. Clique em "Gerar"
5. Uma senha de 16 caracteres será gerada (ex: `abcd efgh ijkl mnop`)

### Passo 3: Configurar o Arquivo .env

O arquivo `.env` no diretório `cursotecnicoinfobva-backend/` já contém as configurações existentes do projeto. Adicione ou atualize as seguintes variáveis:

```env
# Configurações de Email (adicione estas linhas)
EMAIL_USER=professorsantosbva@gmail.com
EMAIL_APP_PASSWORD=sua_senha_de_app_gerada_aqui

# Ou alternativamente:
# GMAIL_USER=professorsantosbva@gmail.com
# GMAIL_APP_PASSWORD=sua_senha_de_app_gerada_aqui
```

**Observação:** O arquivo `.env` já contém as configurações de banco de dados e ambiente existentes do projeto, que foram preservadas.

### Passo 4: Reiniciar o Servidor

Após configurar o arquivo `.env`, reinicie o servidor backend:

```bash
cd cursotecnicoinfobva-backend
npm run dev
```

## Importante

- **Nunca compartilhe sua senha de app** - ela é como uma senha pessoal
- **Use senhas de app em vez da senha principal** do Gmail por segurança
- A senha de app é necessária porque o Gmail não permite autenticação direta com senhas normais para aplicações menos seguras
- As configurações existentes do projeto (banco de dados, ambiente) foram preservadas no arquivo `.env`

## Testando o Envio

Após configurar corretamente:
1. Preencha o formulário de contato na página principal
2. O envio deve retornar "Mensagem enviada com sucesso!"
3. O e-mail será recebido em professorsantosbva@gmail.com

## Solução de Problemas

Se ainda houver problemas de autenticação:
- Verifique se a senha de app está correta (16 caracteres, sem espaços)
- Confirme que a verificação em duas etapas está ativada
- Certifique-se de que está usando a conta correta (professorsantosbva@gmail.com)
- Verifique se o Gmail não bloqueou o acesso por "atividade suspeita"
- Confirme que as configurações de email foram adicionadas ao arquivo `.env` existente
