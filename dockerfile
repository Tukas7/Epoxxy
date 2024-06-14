# Используем официальный образ Node.js
FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файл package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости для компиляции пакетов Node.js
RUN apt-get update && apt-get install -y \
    build-essential \
    unixodbc-dev

# Устанавливаем зависимости приложения
RUN npm install

# Копируем файлы приложения
COPY . .

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "app.js"]
