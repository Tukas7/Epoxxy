const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const nodemailer = require('nodemailer');

const pool = new Pool({
    user: 'postgres',
    host: 'viaduct.proxy.rlwy.net',
    database: 'eppoxy',
    password: 'VABbgCjkjLffcsYvmgjOYcWeUmolovRb',
    port: 13266,
});

const uploadDir = path.join(__dirname, 'images');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images'); // Папка для сохранения файлов
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Уникальное имя файла (текущая дата и время + расширение)
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
}).single('productImage');

async function executeQuery(query, params = []) {
  try {
    const client = await pool.connect();
    const result = await client.query(query, params);
    client.release();
    return result.rows;
  } catch (error) {
    throw new Error(`Ошибка выполнения запроса: ${error.message}`);
  }
}

app.use(express.static(__dirname));
app.use(bodyParser.json());

app.get('/products/:category', async (req, res) => {
  const category = req.params.category;
  try {
    const result = await executeQuery('SELECT * FROM Products WHERE Category = $1', [category]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/add-to-cart', async (req, res) => {
  const { productid, userid, quantity, imageurl } = req.body;

  try {
    const result = await executeQuery('SELECT p.name, p.price, p.imageurl, c.quantity FROM Cart c INNER JOIN products p ON c.productid = p.productid WHERE c.productid = $1 AND c.userid = $2', [productid, userid]);

    if (result.length > 0) {
      await executeQuery('UPDATE Cart SET quantity = quantity + $1 WHERE productid = $2 AND UserID = $3', [quantity, productid, userid]);
      res.json({ success: true, message: 'Количество обновлено' });
    } else {
      await executeQuery('INSERT INTO Cart (productid, userid, quantity, imageurl) VALUES ($1, $2, $3, $4)', [productid, userid, quantity, imageurl]);
      res.json({ success: true, message: 'Продукт добавлен в корзину' });
    }
  } catch (error) {
    console.error('Не удалось добавить в корзину:', error);
    res.status(500).json({ success: false, message: 'Не удалось добавить продукт в корзину.' });
  }
});

app.get('/getCartItems', async (req, res) => {
  const userID = 1;
  try {
    const result = await executeQuery('SELECT p.ProductID, p.Name, p.Price, p.ImageURL, c.Quantity FROM Cart c INNER JOIN Products p ON c.ProductID = p.ProductID WHERE c.UserID = $1', [userID]);
    res.json(result);
  } catch (error) {
    console.error('Не удалось получить товары из корзины:', error);
    res.status(500).json({ success: false, message: 'Не удалось получить товары из корзины.' });
  }
});

app.post('/removeFromCart', async (req, res) => {
  const { productid, userID } = req.body;

  try {
    await executeQuery('DELETE FROM Cart WHERE ProductID = $1 AND UserID = $2', [productid, userID]);
    res.json({ success: true, message: 'Товар успешно удален из корзины' });
  } catch (error) {
    console.error('Не удалось удалить продукт из корзины:', error);
    res.status(500).json({ success: false, message: 'Не удалось удалить товар из корзины' });
  }
});

app.post('/updateCartItemQuantity', async (req, res) => {
  const { productID, userID, quantity } = req.body;

  try {
    await executeQuery('UPDATE Cart SET Quantity = $1 WHERE ProductID = $2 AND UserID = $3', [quantity, productID, userID]);
    res.json({ success: true, message: 'Количество обновлено' });
  } catch (error) {
    console.error('Не удалось обновить количество товара в корзине:', error);
    res.status(500).json({ success: false, message: 'Не удалось обновить количество товара в корзине.' });
  }
});

app.post('/checkout', async (req, res) => {
  const { customerName, customerEmail, customerPhone, promoCode } = req.body;

  try {
    const cartItems = await getCartItems(1); 
    await sendEmail(customerName, customerEmail, customerPhone, promoCode, cartItems);
    res.json({ success: true, message: 'Заказ успешно оформлен' });
  } catch (error) {
    console.error('Ошибка при оформлении заказа:', error);
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
        pass: 'n7r9tRnmEpLHrjykG5bf'
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
          ${cartItems.map(item => `<li>${item.name} - Количество: ${item.quantity}, Цена: ${item.price}</li>`).join('')}
        </ul>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email отправлен успешно');
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    throw error;
  }
}

async function getCartItems(userID) {
  try {
    return await executeQuery('SELECT p.ProductID, p.Name, p.Price, p.ImageURL, c.Quantity FROM Cart c INNER JOIN Products p ON c.ProductID = p.ProductID WHERE c.UserID = $1', [userID]);
  } catch (error) {
    console.error('Не удалось получить товары из корзины:', error);
    throw error;
  }
}

app.get('/products/:category/sort-by-price', async (req, res) => {
  const { category } = req.params;
  const { direction } = req.query;

  if (direction !== 'asc' && direction !== 'desc') {
    return res.status(400).json({ error: "Неверное направление сортировки. Используйте 'asc' или 'desc'." });
  }

  if (!category) {
    return res.status(400).json({ error: 'Категория обязательна.' });
  }

  try {
    const result = await executeQuery('SELECT * FROM Products WHERE Category = $1 ORDER BY Price ' + direction, [category]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/submit-review', async (req, res) => {
  const { userNamee, userEmail, userReview } = req.body;

  try {
    await executeQuery('INSERT INTO Reviews (UserName, UserEmail, UserReview) VALUES ($1, $2, $3)', [userNamee, userEmail, userReview]);
    res.status(200).json({ success: true, message: 'Отзыв успешно отправлен' });
  } catch (error) {
    console.error('Ошибка отправки отзыва:', error);
    res.status(500).json({ success: false, message: 'Не удалось отправить отзыв' });
  }
});

app.get('/get-reviews', async (req, res) => {
  try {
    const reviews = await executeQuery('SELECT * FROM Reviews');
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    res.status(500).json({ success: false, message: 'Не удалось получить отзывы' });
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
    await executeQuery('DELETE FROM Reviews WHERE ReviewID = $1', [reviewId]);
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
      const productImage = req.file.filename;

      try {
        const productImageURL = 'images/' + productImage;
        await executeQuery(
          `INSERT INTO Products (Name, Description, Price, Category, ImageURL) VALUES ($1, $2, $3, $4, $5)`,
          [productName, productDescription, productPrice, productCategory, productImageURL]
        );
        res.json({ success: true, message: 'Продукт успешно добавлен' });
      } catch (error) {
        console.error('Ошибка добавления продукта:', error);
        res.status(500).json({ success: false, message: 'Не удалось добавить продукт' });
      }
    }
  });
});

app.delete('/api/products/:productid', async (req, res) => {
  const productid = req.params.productid;

  try {
    await executeQuery('DELETE FROM Products WHERE ProductId = $1', [productid]);
    res.status(200).json({ success: true, message: 'Продукт успешно удален' });
  } catch (error) {
    console.error('Ошибка удаления продукта:', error);
    res.status(500).json({ success: false, message: 'Не удалось удалить продукт' });
  }
});

app.get('/api/products/search', async (req, res) => {
  const { query } = req.query;

  try {
    const result = await executeQuery('SELECT * FROM Products WHERE Name LIKE $1 OR Description LIKE $1', [`%${query}%`]);
    res.json(result);
  } catch (error) {
    console.error('Ошибка поиска продуктов:', error);
    res.status(500).json({ success: false, message: 'Ошибка поиска продуктов' });
  }
});

app.post('/send-contact-email', async (req, res) => {
  const { userName, userPhone, messenger, userQuestion } = req.body;

  try {
    await sendContactEmail(userName, userPhone, messenger, userQuestion);
    res.json({ success: true, message: 'Сообщение успешно отправлено' });
  } catch (error) {
    console.error('Ошибка отправки контактного email:', error);
    res.status(500).json({ success: false, message: 'Ошибка отправки контактного email' });
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
        pass: 'n7r9tRnmEpLHrjykG5bf'
      }
    });

    const mailOptions = {
    from: 'vma2302@bk.ru', // Адрес отправителя
    to: 'vma23022@gmail.com', // Адрес получателя
      subject: 'Новое сообщение с сайта',
      text: `Имя: ${userName}\nТелефон: ${userPhone}\nМессенджер: ${messenger}\nВопрос: ${userQuestion}`
    };

    await transporter.sendMail(mailOptions);
    console.log('Email отправлен успешно');
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    throw error;
  }
}

pool.connect()
  .then(() => {
    console.log('Подключено к PostgreSQL');
    app.listen(port, () => {
      console.log(`Сервер запущен на порту ${port}`);
    });
  })
  .catch((error) => {
    console.error('Не удалось подключиться к базе данных:', error);
  });
