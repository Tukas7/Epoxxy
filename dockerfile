# Используем официальный образ Node.js в качестве базового
FROM node:18

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем файлы package.json и package-lock.json в рабочую директорию
COPY package*.json ./

# Устанавливаем необходимые пакеты
RUN apt-get update && apt-get install -y \
    build-essential \
    unixodbc-dev \
    python3

# Устанавливаем зависимости проекта
RUN npm install

# Копируем остальные файлы проекта в рабочую директорию
COPY . .

# Указываем команду для запуска приложения
CMD ["node", "server.js"]
