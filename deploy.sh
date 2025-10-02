#!/bin/bash

# Script de Deploy para Produção - Portal do Curso Técnico em Informática

echo "Iniciando deploy para produção..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "Erro: package.json não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

# Instalar dependências de produção
echo "Instalando dependências..."
npm install --production

# Verificar se a pasta de uploads existe, caso contrário criar
if [ ! -d "public/uploads" ]; then
    mkdir -p public/uploads
    echo "Pasta de uploads criada."
fi

# Configurar permissões
chmod -R 755 public/uploads
mkdir -p logs
chmod -R 755 logs

# Parar aplicação anterior se estiver rodando
pm2 stop informatica-wave 2>/dev/null || true

# Iniciar aplicação com PM2
echo "Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js

# Salvar configuração do PM2 para reiniciar automaticamente
pm2 save

# Verificar se a aplicação está rodando
pm2 status

echo "Deploy concluído!"
echo "A aplicação está rodando na porta configurada no .env (padrão: 4002)"
echo "Lembre-se de configurar o Nginx como proxy reverso para o domínio."
