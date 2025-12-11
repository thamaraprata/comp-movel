FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar código
COPY . .

# Expor porta
EXPOSE 5173

# Executar em dev mode com host 0.0.0.0 para aceitar conexões externas
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
