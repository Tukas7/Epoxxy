# Используйте базовый образ
FROM node:18

# Установите рабочую директорию
WORKDIR /app

# Установите необходимые пакеты
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-dev build-essential apt-transport-https curl gnupg2

# Установка Microsoft ODBC Driver 17 для SQL Server
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/debian/10/prod.list > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql17 unixodbc-dev

# Проверка наличия sqltypes.h
RUN if [ ! -f /usr/include/sqltypes.h ]; then echo "sqltypes.h not found"; exit 1; else echo "sqltypes.h found"; fi

# Скопируйте package.json и package-lock.json
COPY package*.json ./

# Установите зависимости
RUN npm install || cat /root/.npm/_logs/*

# Скопируйте остальные файлы приложения
COPY . .

# Откройте порт, на котором работает приложение
EXPOSE 3000

# Запустите приложение
CMD ["npm", "start"]
