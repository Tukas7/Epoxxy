function toggleMenu() {
    var menu = document.querySelector('.side-menu');
    if (menu.style.transform === 'translateX(0%)') {
        menu.style.transform = 'translateX(100%)';
        setTimeout(() => menu.classList.add('hidden'), 300);
    } else {
        menu.classList.remove('hidden');
        setTimeout(() => menu.style.transform = 'translateX(0%)', 10);
    }
}

async function loadProductsByCategory(category) {
    const response = await fetch(`/products/${category}`);
    const products = await response.json();
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <div><img class="product-image" src="${product.imageurl}" alt="${product.Name}" class="product-image"></div>
            <div class="product-name">${product.name}</div>
            <div class="Price">${product.price} р.</div>
        `;
        productsContainer.appendChild(productElement);

        productElement.addEventListener('click', () => showProductDetails(product));
    });
}


const urlPath = window.location.pathname;
let category = urlPath.substring(1, urlPath.lastIndexOf('.html')); // Получаем часть URL между '/' и '.html'


loadProductsByCategory(category);


function showProductDetails(product) {
    document.getElementById('modalProductImage').src = product.imageurl;
    document.getElementById('modalProductImage').alt = product.name;
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductDescription').textContent = product.description;
    document.getElementById('modalProductPrice').textContent = `Цена: ${product.price}`;
    
    // Измените следующую строку, чтобы передать ImageURL в addToCart
    document.getElementById('addToCartBtn').onclick = () => addToCart(product.productid, product.Imageurl);
    
    document.querySelector('.modal').style.display = 'block';
}






async function addToCart(productid, imageurl) {
    const userid = 1;
    const quantity = 1;

    try {
        const response = await fetch('/add-to-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productid, userid, quantity, imageurl }), // Добавьте imageURL в запрос
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        if (data.success) {
            console.log(data.message);
            updateCart();
            alert('Продукт успешно добавлен в корзину');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Failed to add product to cart:", error);
    }
}



function openCart() {
    document.getElementById('cartModal').style.display = 'block';
    const cartItemsDiv = document.getElementById('cartItems');
    cartItemsDiv.innerHTML = '';
    const cartTotalDiv = document.getElementById('cartTotal');
    cartTotalDiv.textContent = '';

    fetch('/getCartItems')
    .then(response => response.json())
    .then(data => {
        const cartItemsDiv = document.getElementById('cartItems');
        cartItemsDiv.innerHTML = ''; 
        let totalAmount = 0; 
        data.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = `
                <div class="cart-item">
                <img src="${item.imageurl}" alt="${item.name}" class="cart-item-image">
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">
                            <button class="decrement-button" onclick="decrementCartItem(${item.productid}, ${item.quantity})">-</button>
                            ${item.quantity} шт.
                            <button class="increment-button" onclick="incrementCartItem(${item.productid}, ${item.quantity})">+</button>
                            - ${item.price} р.
                        </span>
                    </div>
                    <button class="remove-button" onclick="removeFromCart(${item.productid})">Удалить</button>
                </div>
            `;
            cartItemsDiv.appendChild(itemDiv);
            totalAmount += item.quantity * item.price;
        });
        const cartTotalDiv = document.getElementById('cartTotal');
        cartTotalDiv.textContent = `Общая сумма заказа: ${totalAmount} р.`;
    })
    .catch(error => {
        console.error('Failed to fetch cart items:', error);
    });
}


// Закрытие корзины
function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}




// Функция для очистки корзины
function clearCart() {
    // Очистите список товаров в корзине
    const cartItemsDiv = document.getElementById('cartItems');
    cartItemsDiv.innerHTML = '';

    // Закройте модальное окно корзины
    closeCart();
}
// Функция для удаления товара из корзины
function removeFromCart(productid) {
    const userID = 1; // Получите ID пользователя, например, из сессии или локального хранилища

    // Отправьте запрос на сервер для удаления товара
    fetch('/removeFromCart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productid, userID }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(data.message);
            // Здесь может быть код для обновления интерфейса корзины пользователя
            updateCart();
        } else {
            console.error(data.message);
        }
    })
    .catch(error => {
        console.error('Failed to remove from cart:', error);
    });
    
}

async function updateCart() {
    try {
        // Отправьте запрос на сервер для получения данных о корзине пользователя
        const response = await fetch('/getCartItems');
        const cartItems = await response.json();

        // Отобразите товары в корзине
        const cartItemsDiv = document.getElementById('cartItems');
        cartItemsDiv.innerHTML = ''; // Очистите текущий список товаров в корзине

        let totalAmount = 0; // Инициализируем общую сумму

        cartItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = `
            <div class="cart-item">
            <img src="${item.imageurl}" alt="${item.name}" class="cart-item-image">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">
                        <button class="decrement-button" onclick="decrementCartItem(${item.productid}, ${item.quantity})">-</button>
                        ${item.quantity} шт.
                        <button class="increment-button" onclick="incrementCartItem(${item.productid}, ${item.quantity})">+</button>
                        - ${item.price} р.
                    </span>
                </div>
                <button class="remove-button" onclick="removeFromCart(${item.productid})">Удалить</button>
            </div>
            `;
            cartItemsDiv.appendChild(itemDiv);

            // Обновляем общую сумму с каждым товаром
            totalAmount += item.quantity * item.price;
        });

        // Отобразите общую сумму заказа
        const cartTotal = document.getElementById('cartTotal');
        cartTotal.textContent = `Общая сумма заказа: ${totalAmount} р.`;
    } catch (error) {
        console.error('Failed to update cart:', error);
    }
}
function incrementCartItem(productID, currentQuantity) {
    // Отправьте запрос на сервер для увеличения количества товара
    updateCartItemQuantity(productID, currentQuantity + 1);
}

function decrementCartItem(productID, currentQuantity) {
    if (currentQuantity > 1) {
        // Отправьте запрос на сервер для уменьшения количества товара, если текущее количество больше 1
        updateCartItemQuantity(productID, currentQuantity - 1);
    }
}


function updateCartItemQuantity(productID, newQuantity) {
    const userID = 1; // Получите ID пользователя, например, из сессии или локального хранилища
    fetch('/updateCartItemQuantity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productID, userID, quantity: newQuantity }), // Здесь укажите соответствующий userID и новое количество
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Количество товара успешно обновлено, обновите корзину
            openCart();
        } else {
            console.error(data.message);
        }
    })
    .catch(error => {
        console.error('Failed to update cart item quantity:', error);
    });
}
async function checkout() {
    try {
        // Получите данные о пользователе из формы
        const customerName = document.getElementById('customerName').value;
        const customerEmail = document.getElementById('customerEmail').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const promoCode = document.getElementById('promoCode').value;

        // Отправьте запрос на сервер для оформления заказа с данными о пользователе
        const response = await fetch('/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customerName, customerEmail, customerPhone, promoCode }),
        });

        if (!response.ok) {
            throw new Error('Не удалось выполнить запрос');
        }

        const data = await response.json();
        if (data.success) {
            window.alert('Заказ успешно оформлен');
            // Дополнительные действия при успешном оформлении заказа
        } else {
            throw new Error(data.message || 'Ошибка оформления заказа');
        }
    } catch (error) {
        console.error('Failed to checkout:', error);
    }
}


function sortProducts() {
    const direction = document.getElementById('sortDirection').value;
    fetch(`/products/${category}/sort-by-price?direction=${direction}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to sort products by price');
            }
            return response.json();
        })
        .then(data => {
            // Обновляем отображение отсортированных товаров на странице
            updateProductList(data);
        })
        .catch(error => {
            console.error('Error sorting products:', error);
        });
}


// Функция для обновления списка товаров на странице
async function updateProductList(data) {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';

    data.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <div><img class="product-image" src="${product.imageurl}" alt="${product.name}" class="product-image"></div>
            <div class="product-name">${product.name}</div>
            <div class="Price">${product.price} р.</div>
        `;
        productsContainer.appendChild(productElement);

        productElement.addEventListener('click', () => showProductDetails(product));
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.close').addEventListener('click', () => {
        document.querySelector('.modal').style.display = 'none';
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('reviewForm');
    const reviewsContainer = document.getElementById('reviewsContainer');

    reviewForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Предотвращаем отправку формы по умолчанию

        const userNamee = document.getElementById('userNamee').value;
        const userEmail = document.getElementById('userEmail').value;
        const userReview = document.getElementById('userReview').value;
        

        // Отправка данных на сервер
        sendReviewToServer(userNamee, userEmail, userReview);
        alert('Отзыв успешно добавлен');
        document.location.reload();

    });

    function sendReviewToServer(userNamee, userEmail, userReview) {
        fetch('/submit-review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userNamee, userEmail, userReview }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to submit review');
            }
            return response.json();
        })
        .then(data => {
            // Отобразить сообщение об успешной отправке отзыва или обработать другую логику
            console.log(data.message);
            // Очистить форму после успешной отправки
            reviewForm.reset();
            
            
        })
        .catch(error => {
            console.error('Error submitting review:', error);
        });
    }
});


function searchProducts() {
    // Получите ключевое слово из поля ввода
    const searchQuery = document.getElementById('searchInput').value.trim();
  
    // Используйте ключевое слово в запросе на сервер, передав его явно в URL-адресе
    fetch(`/api/products/search?query=${searchQuery}`) // Изменили URL-адрес на `/api/products/search`
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to search products');
            }
            return response.json();
        })
        .then(data => {
            // Обновляем отображение найденных товаров на странице
            updateProductList(data);
        })
        .catch(error => {
            console.error('Error searching products:', error);
        });
}
function checkouts() {
    // Получение данных из формы
    const userName = document.getElementById('userName').value;
    const userPhone = document.getElementById('userPhone').value;
    const messenger = document.getElementById('messenger').value;
    const userQuestion = document.getElementById('userQuestion').value;

    // Создание объекта с данными формы
    const formData = {
        userName,
        userPhone,
        messenger,
        userQuestion
    };

    // Отправка данных на сервер с помощью fetch
    fetch('/send-contact-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    
    
}

document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const lightThemeIcon = themeToggle.querySelector('.light-theme-icon');
    const darkThemeIcon = themeToggle.querySelector('.dark-theme-icon');

    // Функция для обновления иконок в зависимости от темы
    function updateThemeIcon() {
        if (body.classList.contains('dark-theme')) {
            lightThemeIcon.style.display = 'block';
            darkThemeIcon.style.display = 'none';
        } else {
            lightThemeIcon.style.display = 'none';
            darkThemeIcon.style.display = 'block';
        }
    }

    // Проверяем, сохранена ли тема в localStorage и применяем её
    if (localStorage.getItem('darkTheme') === 'true') {
        body.classList.add('dark-theme');
    }
    updateThemeIcon(); // Обновляем иконку при загрузке страницы

    // Слушаем клик по кнопке и переключаем тему
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-theme');
        updateThemeIcon(); // Обновляем иконки при смене темы
        
        // Сохраняем выбор темы пользователя
        localStorage.setItem('darkTheme', body.classList.contains('dark-theme').toString());
    });
});