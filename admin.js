document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const productTable = document.getElementById('productTable');
    const reviewTable = document.getElementById('reviewTable');
    
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (username === 'admin' && password === 'admin') {
            // Показать таблицы после успешной авторизации
            productTable.classList.remove('hidden');
            reviewTable.classList.remove('hidden');
            addProductForm.classList.remove('hidden');
            loginForm.reset();
            loginForm.style.display = 'none'; // Скрыть форму входа после успешной авторизации
            // Здесь можно отправить запросы на сервер для получения данных о продукции и отзывах
            // Например, с помощью fetch()
fetch('/api/products')
.then(response => response.json())
.then(products => {
// Очистим существующие строки в таблице продукции
const productTableBody = document.querySelector('#productTable tbody');
productTableBody.innerHTML = '';

// Пройдемся по каждому продукту и создадим строку таблицы для него
products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${product.Name}</td>
        <td>${product.Description}</td>
        <td><img src="${product.ImageURL}" alt="${product.Name}" width="100"></td>
        <td>${product.Price}</td>
        <td>${product.Category}</td>
        <td><button onclick="deleteProduct(${product.ProductID})">Удалить</button></td>
    `;
    productTableBody.appendChild(row);
});
})
.catch(error => console.error('Ошибка получения данных о продукции:', error));
// Обработчик клика на кнопку "Удалить" в таблице отзывов

fetch('/api/reviews')
.then(response => response.json())
.then(reviews => {
// Очистим существующие строки в таблице отзывов
const reviewTableBody = document.querySelector('#reviewTable tbody');
reviewTableBody.innerHTML = '';

// Пройдемся по каждому отзыву и создадим строку таблицы для него
reviews.forEach(review => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${review.UserName}</td>
        <td>${review.UserEmail}</td>
        <td>${review.UserReview}</td>
        <td><button onclick="deleteReview(${review.ReviewID})">Удалить</button></td>
    `;
    reviewTableBody.appendChild(row);
});
})
.catch(error => console.error('Ошибка получения данных об отзывах:', error));
        } else {
            alert('Неверный логин или пароль');
        }
    });
});


function deleteReview(reviewId) {
fetch(`/api/delete-review/${reviewId}`, {
method: 'DELETE'
})
.then(response => {
if (response.ok) {
    // Если удаление прошло успешно, обновляем таблицу отзывов
    fetchReviews();
    alert('Отзыв успешно удален');
} else {
    // Если произошла ошибка, выводим сообщение об ошибке
    throw new Error('Ошибка удаления отзыва');
}
})
.catch(error => {
console.error('Ошибка удаления отзыва:', error);
alert('Не удалось удалить отзыв');
});
}

function fetchReviews() {
fetch('/api/reviews')
.then(response => {
if (response.ok) {
    return response.json();
} else {
    throw new Error('Ошибка получения данных об отзывах');
}
})
.then(reviews => {
// Очищаем существующие строки в таблице отзывов
const reviewTableBody = document.querySelector('#reviewTable tbody');
reviewTableBody.innerHTML = '';

// Проходимся по каждому отзыву и создаем строку таблицы для него
reviews.forEach(review => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${review.UserName}</td>
        <td>${review.UserEmail}</td>
        <td>${review.UserReview}</td>
        <td><button onclick="deleteReview(${review.ReviewID})">Удалить</button></td>
    `;
    reviewTableBody.appendChild(row);
});
})
.catch(error => {
console.error('Ошибка получения данных об отзывах:', error);
alert('Не удалось получить данные об отзывах');
});
}

document.getElementById('addProductForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const productName = document.getElementById('productName').value;
    const productDescription = document.getElementById('productDescription').value;
    const productImage = document.getElementById('productImageURL').files[0]; // Получаем выбранный файл
    const productPrice = document.getElementById('productPrice').value;
    const productCategory = document.getElementById('productCategory').value;

    const formData = new FormData(); // Создаем объект FormData для отправки данных на сервер
    formData.append('productName', productName);
    formData.append('productDescription', productDescription);
    formData.append('productImage', productImage); // Добавляем выбранный файл в объект FormData
    formData.append('productPrice', productPrice);
    formData.append('productCategory', productCategory);

    fetch('/api/add-product', {
        method: 'POST',
        body: formData // Отправляем данные на сервер
    })
    .then(response => response.json())
    .then(data => {
        console.log(data); // Обрабатываем ответ от сервера
        alert('Продукт успешно добавлен');
    })
    .catch(error => {
        console.error('Ошибка при добавлении продукта:', error);
        alert('Не удалось добавить продукт');
    });
});

function deleteProduct(productId) {
    fetch(`/api/products/${productId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            // Если удаление прошло успешно, обновляем таблицу продукции
            fetchProducts();
            alert('Продукт успешно удален');
        } else {
            // Если произошла ошибка, выводим сообщение об ошибке
            throw new Error('Ошибка удаления продукта');
        }
    })
    .catch(error => {
        console.error('Ошибка удаления продукта:', error);
        alert('Не удалось удалить продукт');
    });
}
function fetchProducts() {
    fetch('/api/products')
    .then(response => response.json())
    .then(products => {
        // Очищаем существующие строки в таблице продукции
        const productTableBody = document.querySelector('#productTable tbody');
        productTableBody.innerHTML = '';

        // Проходимся по каждому продукту и создаем строку таблицы для него
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.Name}</td>
                <td>${product.Description}</td>
                <td><img src="${product.ImageURL}" alt="${product.Name}" width="100"></td>
                <td>${product.Price}</td>
                <td>${product.Category}</td>
                <td><button onclick="deleteProduct(${product.ProductID})">Удалить</button></td>
            `;
            productTableBody.appendChild(row);
        });
    })
    .catch(error => console.error('Ошибка получения данных о продукции:', error));
}
