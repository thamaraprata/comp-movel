FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para tsx)
RUN npm install --legacy-peer-deps

# Copiar código
COPY . .

# Expor porta
EXPOSE 3334

# Executar com tsx (desenvolvimento)
CMD ["npm", "run", "dev"]
