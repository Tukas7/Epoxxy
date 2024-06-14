# Используйте базовый образ
FROM node:18

# Установите рабочую директорию
WORKDIR /app

# Установите необходимые пакеты
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-dev build-essential unixodbc-dev odbcinst1debian2 libodbc1 libgssapi-krb5-2

# Убедитесь, что ODBC установлено правильно
RUN odbcinst -j

# Скопируйте package.json и package-lock.json
COPY package*.json ./

# Установите зависимости
RUN npm install

# Скопируйте остальные файлы приложения
COPY . .

# Откройте порт, на котором работает приложение
EXPOSE 3000

# Запустите приложение
CMD ["npm", "start"]
