// Dados de exemplo
let users = [
    {
        id: 1,
        admin: true,
        name: "Richard",
        lastname: "",
        email: "richardbarros@duck.com",
        password: "senha123"
    }
];

let products = [
    {
        id: 1,
        name: "Tomate Fresco",
        price: "R$19,00",
        image: "img/product-1.jpg",
        stockQuantity: 10,
        soldQuantity: 100
    },
    {
        id: 2,
        name: "Morango Orgânico",
        price: "R$15,50",
        image: "img/product-4.jpg",
        stockQuantity: 10,
        soldQuantity: 100
    },
    {
        id: 3,
        name: "Abacaxi Suculento",
        price: "R$12,00",
        image: "img/product-2.jpg",
        stockQuantity: 10,
        soldQuantity: 100
    }
];

let currentUser = null;

// Funções de Login e Logout
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const user = users.find(user => user.email === email && user.password === password);

    if (user) {
        // alert(`Login realizado com sucesso para ${user.name}`);
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        $('#loginModal').modal('hide');
        hideEntrarButton();
        updateUI(); // Atualiza a interface após o login
    } else {
        // alert('Email ou senha incorretos. Por favor, tente novamente.');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    hideLoggedInButtons();
    updateUI(); // Atualiza a interface após o logout
    window.location.href = 'index.html';
}

// Funções de Interface do Usuário
function hideEntrarButton() {
    const entrarButton = document.getElementById('btnEntrar');
    if (entrarButton) entrarButton.style.display = 'none';
}

function showLoggedInButtons() {
    const loggedInButtons = document.getElementById('loggedInButtons');
    if (loggedInButtons) loggedInButtons.style.display = 'flex';

    const entrarButton = document.getElementById('btnEntrar');
    if (entrarButton) entrarButton.style.display = 'none';
}

function hideLoggedInButtons() {
    const loggedInButtons = document.getElementById('loggedInButtons');
    if (loggedInButtons) loggedInButtons.style.display = 'none';

    const entrarButton = document.getElementById('btnEntrar');
    if (entrarButton) entrarButton.style.display = 'block';
}

// Funções de Renderização de Produtos
function createProductCard(product) {
    return `
        <div class="col-xl-3 col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
            <div class="product-item">
                <div class="position-relative bg-light overflow-hidden">
                    <img class="img-fluid w-100" src="${product.image}" alt="${product.name}">
                </div>
                <div class="text-center p-4">
                    <a class="d-block h5 mb-2" href="product.html">${product.name}</a>
                    <span class="text-primary">${product.price}</span>
                </div>
                <div class="d-flex border-top">
                    <small class="w-50 text-center border-end py-2">
                        <a class="text-body" href=""><i class="far fa-money-bill-alt text-primary me-2"></i>Comprar</a>
                    </small>
                    <small class="w-50 text-center py-2">
                        <a class="text-body" href=""><i class="fa fa-shopping-bag text-primary me-2"></i>Adicionar ao Carrinho</a>
                    </small>
                </div>
            </div>
        </div>
    `;
}

function renderProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    let productsHTML = '';
    products.forEach(product => {
        productsHTML += createProductCard(product);
    });

    productList.innerHTML = productsHTML;
}

// Funções de Renderização de Controle de Produtos
function createProductRow(product) {
    return `
        <tr>
            <th scope="row">${product.id}</th>
            <td>${product.name}</td>
            <td>${product.description}</td>
            <td>${product.price}</td>
            <td>${product.stockQuantity}</td>
            <td>${product.soldQuantity}</td>
            <td>
                <button type="button" class="btn btn-link" data-bs-toggle="modal" data-bs-target="#editProductModal">Detalhes</button>
            </td>
        </tr>
    `;
}

function renderControlProducts() {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;

    let rowsHTML = '';
    products.forEach(product => {
        rowsHTML += createProductRow(product);
    });

    tbody.innerHTML = rowsHTML;
}

function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredProducts = products.filter(product => {
        return product.name.toLowerCase().includes(searchTerm);
    });

    renderFilteredProducts(filteredProducts); // Função para renderizar os produtos filtrados
}

function renderFilteredProducts(filteredProducts) {
    const productList = document.getElementById('product-list');
    let productsHTML = '';

    filteredProducts.forEach(product => {
        productsHTML += createProductRow(product);
    });

    productList.innerHTML = productsHTML;
}

// Função para atualizar a interface do usuário com base no estado atual do usuário
function updateUI() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showLoggedInButtons();
        if (currentUser.admin) {
            const controlButton = document.getElementById('controlButton');
            if (controlButton) controlButton.style.display = 'inline-block';
        } else {
            const controlButton = document.getElementById('controlButton');
            if (controlButton) controlButton.style.display = 'none';
        }
    } else {
        hideLoggedInButtons();
        const controlButton = document.getElementById('controlButton');
        if (controlButton) controlButton.style.display = 'none';
    }
}

// Inicialização ao carregar a página
window.onload = function() {
    updateUI(); // Atualiza a interface inicialmente
    renderProducts(); // Renderiza os produtos na página principal
    renderControlProducts(); // Renderiza os produtos na página de controle de produtos (se aplicável)
};
