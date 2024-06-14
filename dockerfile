# Используем базовый образ Node.js
FROM node:18

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

# Успешная установка зависимостей и деплой
npm WARN deprecated uuid@3.4.0: Please upgrade to version 7 or higher.
npm WARN deprecated adal-node@0.2.4: This package is no longer supported.
npm WARN deprecated @azure/msal-node@1.18.4: A newer major version of this library is available.
