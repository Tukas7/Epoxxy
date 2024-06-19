document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const productTable = document.getElementById('productTable');
    const reviewTable = document.getElementById('reviewTable');
    const addProductForm = document.getElementById('addProductForm');

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

            // Получить данные о продукции и отзывах
            fetchProducts();
            fetchReviews();
        } else {
            alert('Неверный логин или пароль');
        }
    });

    window.fetchProducts = function fetchProducts() {
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
                    <td>${product.name}</td>
                    <td>${product.description}</td>
                    <td><img src="${product.imageurl}" alt="${product.name}" width="100"></td>
                    <td>${product.price}</td>
                    <td>${product.category}</td>
                    <td><button onclick="deleteProduct(${product.productid})">Удалить</button></td>
                `;
                productTableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Ошибка получения данных о продукции:', error));
    };

    window.fetchReviews = function fetchReviews() {
        fetch('/api/reviews')
        .then(response => response.json())
        .then(reviews => {
            // Очищаем существующие строки в таблице отзывов
            const reviewTableBody = document.querySelector('#reviewTable tbody');
            reviewTableBody.innerHTML = '';

            // Проходимся по каждому отзыву и создаем строку таблицы для него
            reviews.forEach(review => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${review.UserName}</td>
                    <td>${review.UsereMail}</td>
                    <td>${review.UserReview}</td>
                    <td><button onclick="deleteReview(${review.ReviewID})">Удалить</button></td>
                `;
                reviewTableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Ошибка получения данных об отзывах:', error));
    };

    window.deleteProduct = function deleteProduct(productId) {
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
    };

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
            fetchProducts(); // Обновляем таблицу продукции после добавления нового товара
        })
        .catch(error => {
            console.error('Ошибка при добавлении продукта:', error);
            alert('Не удалось добавить продукт');
        });
    });

    window.deleteReview = function deleteReview(reviewId) {
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
    };
});
