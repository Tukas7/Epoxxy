const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const port = process.env.PORT || 3000;

// Конфигурация подключения к базе данных
const config = {
    user: 'Ilusha', // Имя пользователя для SQL Server
    password: 'qwerty123321F', // Пароль пользователя для SQL Server
    database: 'Ilusha',
    server: '92.53.107.236', // IP-адрес или доменное имя удаленного сервера
    port: 1433, // Порт, на котором SQL Server слушает (по умолчанию 1433)
    options: {
        enableArithAbort: true,
        encrypt: true, // Используйте это, если у вас нет доверенного сертификата
    }
};

const uploadDir = path.join(__dirname, 'images');

// Настройка Multer для сохранения загруженных изображений
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images'); // Папка для сохранения файлов
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // Имя файла будет уникальным (текущая дата и время + расширение)
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Максимальный размер файла (5MB)
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);
        if (ext && mimeType) {
            cb(null, true);
        } else {
            cb('Ошибка: Допускаются только файлы изображений!');
        }
    }
}).single('productImage'); // Имя поля в форме загрузки файла

async function executeQuery(query) {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        throw new Error(`Error executing query: ${error.message}`);
    }
}

// Подключаемся к базе данных
sql.connect(config).then(pool => {
    console.log('Connected to MSSQL');
    
    // Запускаем сервер
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch(error => {
    console.error('Database connection failed:', error);
});

// Обслуживание статических файлов из папки "public"
app.use(express.static(__dirname));

app.use(bodyParser.json()); // Middleware для парсинга JSON-тел запросов

// Пример маршрута для получения продуктов
app.get('/products/:category', async (req, res) => {
    const category = req.params.category; // Получаем категорию из URL
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`SELECT * FROM Products WHERE Category = '${category}'`);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Пример маршрута для добавления товара в корзину
app.post('/add-to-cart', async (req, res) => {
    const { productID, userID, quantity, imageURL } = req.body; // Убедитесь, что вы здесь добавили imageURL

    try {
        const pool = await sql.connect(config);
        const checkExistence = await pool.request()
            .input('ProductID', sql.Int, productID)
            .input('UserID', sql.Int, userID)
            .query('SELECT p.Name, p.Price, p.ImageURL, c.Quantity FROM Cart c INNER JOIN Products p ON c.ProductID = p.ProductID WHERE c.ProductID = @ProductID AND c.UserID = @UserID');

        if (checkExistence.recordset.length > 0) {
            const updateQuantity = await pool.request()
                .input('Quantity', sql.Int, quantity)
                .input('ProductID', sql.Int, productID)
                .input('UserID', sql.Int, userID)
                .query('UPDATE Cart SET Quantity = Quantity + @Quantity WHERE ProductID = @ProductID AND UserID = @UserID');
            res.json({ success: true, message: 'Quantity updated' });
        } else {
            const insertProduct = await pool.request()
                .input('ProductID', sql.Int, productID)
                .input('UserID', sql.Int, userID)
                .input('Quantity', sql.Int, quantity)
                .input('ImageURL', sql.NVarChar(255), imageURL) // Добавьте ImageURL в запрос
                .query('INSERT INTO Cart (ProductID, UserID, Quantity, ImageURL) VALUES (@ProductID, @UserID, @Quantity, @ImageURL)');
            res.json({ success: true, message: 'Product added to cart' });
        }
    } catch (error) {
        console.error('Failed to add to cart:', error);
        res.status(500).json({ success: false, message: 'Failed to add product to cart.' });
    }
});

// Пример маршрута для получения товаров из корзины
app.get('/getCartItems', async (req, res) => {
    const userID = 1; 
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('UserID', sql.Int, userID)
            .query('SELECT p.ProductID, p.Name, p.Price, p.ImageURL, c.Quantity FROM Cart c INNER JOIN Products p ON c.ProductID = p.ProductID WHERE c.UserID = @UserID');
        const cartItems = result.recordset;
        res.json(cartItems);
    } catch (error) {
        console.error('Failed to fetch cart items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cart items.' });
    }
});

// Пример маршрута для удаления товара из корзины
app.post('/removeFromCart', async (req, res) => {
    const { productID, userID } = req.body;

    try {
        const pool = await sql.connect(config);
        const deleteItem = await pool.request()
            .input('ProductID', sql.Int, productID)
            .input('UserID', sql.Int, userID)
            .query('DELETE FROM Cart WHERE ProductID = @ProductID AND UserID = @UserID');

        res.json({ success: true, message: 'Товар успешно удален из корзины' });
    } catch (error) {
        console.error('Failed to remove product from cart:', error);
        res.status(500).json({ success: false, message: 'Не удалось удалить товар из корзины' });
    }
});

// Пример маршрута для обновления количества товаров в корзине
app.post('/updateCartItemQuantity', async (req, res) => {
    const { productID, userID, quantity } = req.body;

    try {
        const pool = await sql.connect(config);
        const updateQuantity = await pool.request()
            .input('Quantity', sql.Int, quantity)
            .input('ProductID', sql.Int, productID)
            .input('UserID', sql.Int, userID)
            .query('UPDATE Cart SET Quantity = @Quantity WHERE ProductID = @ProductID AND UserID = @UserID');

        res.json({ success: true, message: 'Quantity updated' });
    } catch (error) {
        console.error('Failed to update cart item quantity:', error);
        res.status(500).json({ success: false, message: 'Failed to update cart item quantity.' });
    }
});

app.post('/checkout', async (req, res) => {
    const { customerName, customerEmail, customerPhone, promoCode } = req.body;

    try {
        const cartItems = await getCartItems(1); // Предположим, что у вас есть функция для получения товаров из корзины
        await sendEmail(customerName, customerEmail, customerPhone, promoCode, cartItems);
        res.json({ success: true, message: 'Заказ успешно оформлен' });
    } catch (error) {
        console.error('Failed to checkout:', error);
        res.status(500).json({ success: false, message: 'Ошибка при оформлении заказа' });
    }
});

async function sendEmail(customerName, customerEmail, customerPhone, promoCode, cartItems) {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.mail.ru',
            port: 465,
            secure: true,
            auth: {
                user: 'vma2302@bk.ru',
                pass: '04JefeLB9YewY8ca48sV'
            }
        });

        const mailOptions = {
            from: 'vma2302@bk.ru',
            to: 'vma23022@gmail.com',
            subject: 'Новый заказ',
            html: `
                <h2>Информация о заказе</h2>
                <p>Имя клиента: ${customerName}</p>
                <p>Email клиента: ${customerEmail}</p>
                <p>Телефон клиента: ${customerPhone}</p>
                <p>Промокод: ${promoCode}</p>
                <h3>Список товаров:</h3>
                <ul>
                    ${cartItems.map(item => `<li>${item.Name} - Количество: ${item.Quantity}, Цена: ${item.Price} р.</li>`).join('')}
                </ul>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}

async function getCartItems(userID) {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('UserID', sql.Int, userID)
            .query('SELECT p.ProductID, p.Name, p.Price, p.ImageURL, c.Quantity FROM Cart c INNER JOIN Products p ON c.ProductID = p.ProductID WHERE c.UserID = @UserID');

        return result.recordset;
    } catch (error) {
        console.error('Failed to fetch cart items:', error);
        throw error;
    }
}

app.get('/products/:category/sort-by-price', async (req, res) => {
    const { category } = req.params;
    const { direction } = req.query; // Направление сортировки (asc или desc)
    
    if (direction !== "asc" && direction !== "desc") {
        return res.status(400).json({ error: "Invalid sorting direction. Use 'asc' or 'desc'." });
    }

    if (!category) {
        return res.status(400).json({ error: "Category is required." });
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`SELECT * FROM Products WHERE Category = '${category}' ORDER BY Price ${direction}`);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/submit-review', async (req, res) => {
    const { userName, userEmail, userReview } = req.body;
    const query = `INSERT INTO Reviews (UserName, UserEmail, UserReview) VALUES ('${userName}', '${userEmail}', '${userReview}')`;
    try {
        await executeQuery(query);
        res.status(200).json({ success: true, message: 'Review submitted successfully' });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
});

app.get('/get-reviews', async (req, res) => {
    const query = 'SELECT * FROM Reviews';
    try {
        const reviews = await executeQuery(query);
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await executeQuery('SELECT * FROM Products');
        res.json(products);
    } catch (error) {
        console.error('Ошибка получения продуктов:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения продуктов' });
    }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await executeQuery('SELECT * FROM Reviews');
        res.json(reviews);
    } catch (error) {
        console.error('Ошибка получения отзывов:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения отзывов' });
    }
});

app.delete('/api/delete-review/:reviewId', async (req, res) => {
    const reviewId = req.params.reviewId;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('ReviewID', sql.Int, reviewId)
            .query('DELETE FROM Reviews WHERE ReviewID = @ReviewID');

        res.status(200).json({ success: true, message: 'Отзыв успешно удален' });
    } catch (error) {
        console.error('Ошибка удаления отзыва:', error);
        res.status(500).json({ success: false, message: 'Не удалось удалить отзыв' });
    }
});

app.post('/api/add-product', (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ success: false, message: err });
        } else {
            const { productName, productDescription, productPrice, productCategory } = req.body;
            const productImage = req.file.filename; // Имя файла, который был загружен

            try {
                const pool = await sql.connect(config);
                const productImageURL = 'images/' + productImage;
                const result = await pool.request()
                    .input('productName', sql.NVarChar(255), productName)
                    .input('productDescription', sql.NVarChar(255), productDescription)
                    .input('productPrice', sql.Decimal(10, 2), productPrice)
                    .input('productCategory', sql.NVarChar(50), productCategory)
                    .input('productImageURL', sql.NVarChar(255), productImageURL)
                    .query(`INSERT INTO Products (Name, Description, Price, Category, ImageURL) VALUES (@productName, @productDescription, @productPrice, @productCategory, @productImageURL)`);

                res.json({ success: true, message: 'Продукт успешно добавлен' });
            } catch (error) {
                console.error('Ошибка при добавлении продукта:', error);
                res.status(500).json({ success: false, message: 'Не удалось добавить продукт' });
            }
        }
    });
});

app.delete('/api/products/:productId', async (req, res) => {
    const productId = req.params.productId;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('ProductId', sql.Int, productId)
            .query('DELETE FROM Products WHERE ProductId = @ProductId');

        res.status(200).json({ success: true, message: 'Продукт успешно удален' });
    } catch (error) {
        console.error('Ошибка удаления продукта:', error);
        res.status(500).json({ success: false, message: 'Не удалось удалить продукт' });
    }
});

app.get('/api/products/search', async (req, res) => {
    const { query } = req.query; // Получаем ключевое слово из параметров запроса

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('searchQuery', sql.NVarChar(255), `%${query}%`)
            .query(`SELECT * FROM Products WHERE Name LIKE @searchQuery OR Description LIKE @searchQuery`);

        res.json(result.recordset);
    } catch (error) {
        console.error('Ошибка при поиске продуктов:', error);
        res.status(500).json({ success: false, message: 'Ошибка при поиске продуктов' });
    }
});

app.post('/send-contact-email', async (req, res) => {
    const { userName, userPhone, messenger, userQuestion } = req.body;

    try {
        await sendContactEmail(userName, userPhone, messenger, userQuestion);
        res.json({ success: true, message: 'Сообщение успешно отправлено' });
    } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        res.status(500).json({ success: false, message: 'Ошибка при отправке сообщения' });
    }
});

async function sendContactEmail(userName, userPhone, messenger, userQuestion) {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.mail.ru',
            port: 465,
            secure: true,
            auth: {
                user: 'vma2302@bk.ru',
                pass: '04JefeLB9YewY8ca48sV'
            }
        });

        const mailOptions = {
            from: 'vma2302@bk.ru',
            to: 'vma23022@gmail.com',
            subject: 'Новое сообщение с сайта',
            text: `Имя: ${userName}\nТелефон: ${userPhone}\nМессенджер: ${messenger}\nВопрос: ${userQuestion}`
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}
