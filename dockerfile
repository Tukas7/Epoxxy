# Используем базовый образ Node.js
FROM node:14

# Устанавливаем рабочую директорию
WORKDIR /app

# Установка Python и других необходимых инструментов
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-dev build-essential

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем файлы приложения
COPY . .

# Открываем порт для приложения
EXPOSE 3000

# Запуск приложения
CMD ["npm", "start"]
