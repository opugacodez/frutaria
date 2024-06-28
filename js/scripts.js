let currentUser = null;

// URL da API
const apiUrl = 'http://localhost:3000';

// Função para buscar produtos da API
async function fetchProducts() {
    try {
        const response = await fetch(`${apiUrl}/products`);
        if (!response.ok) {
            throw new Error('Erro ao buscar produtos.');
        }
        const products = await response.json();
        console.log(products);
        return products;
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return [];
    }
}

// Função para validar usuário através da API
async function login() {
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const response = await fetch(`${apiUrl}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            throw new Error('Email ou senha incorretos.');
        }
        const user = await response.json();
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        $('#loginModal').modal('hide');
        hideEntrarButton();
        updateUI();
    } catch (error) {
        console.error('Erro ao fazer login:', error);
    }
}

// Função para logout
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    hideLoggedInButtons();
    updateUI();
    window.location.href = 'index.html';
}

// Funções auxiliares para manipulação da interface do usuário (mantidas como antes)
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

// Função para renderizar produtos na página principal
async function renderProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    const products = await fetchProducts();
    let productsHTML = '';
    products.forEach(product => {
        productsHTML += createProductCard(product);
    });

    productList.innerHTML = productsHTML;
}

// Função para criar linha de produto na tabela de controle
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
                <button type="button" class="btn btn-link" onclick="openEditModal(${product.id})" data-bs-toggle="modal"
                    data-bs-target="#editProductModal">Detalhes</button>
                <button type="button" class="btn btn-link text-danger" onclick="confirmDelete(${product.id})" data-bs-toggle="modal"
                    data-bs-target="#deleteProductModal">Deletar</button>
            </td>
        </tr>
    `;
}

// Função para confirmar exclusão de produto
function confirmDelete(productId) {
    // Configura o ID do produto a ser deletado no modal de exclusão
    document.getElementById('deleteProductId').value = productId;
}

// Função para deletar o produto
async function deleteProduct() {
    const productId = document.getElementById('deleteProductId').value;

    try {
        const response = await fetch(`${apiUrl}/products/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erro ao deletar produto.');
        }

        // Fechar o modal após deletar
        $('#deleteProductModal').modal('hide');

        // Atualizar a lista de produtos após exclusão
        await renderControlProducts();

    } catch (error) {
        console.error('Erro ao deletar produto:', error);
    }
}

// Função para abrir modal de edição com dados do produto
async function openEditModal(productId) {
    try {
        const response = await fetch(`${apiUrl}/products/${productId}`);
        if (!response.ok) {
            throw new Error('Produto não encontrado.');
        }
        const product = await response.json();

        // Preenche os campos do modal com os dados do produto
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductDescription').value = product.description || '';
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductStockQuantity').value = product.stockQuantity;
        document.getElementById('editProductSoldQuantity').value = product.soldQuantity;

    } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
    }
}

// Função para salvar as alterações no produto editado
async function saveEditedProduct() {
    const productId = document.getElementById('editProductId').value;
    const productName = document.getElementById('editProductName').value;
    const productDescription = document.getElementById('editProductDescription').value;
    const productPrice = document.getElementById('editProductPrice').value;
    const productStockQuantity = document.getElementById('editProductStockQuantity').value;
    const productSoldQuantity = document.getElementById('editProductSoldQuantity').value;

    const formDataUpdate = new FormData();
    formDataUpdate.append('name', productName);
    formDataUpdate.append('description', productDescription);
    formDataUpdate.append('price', productPrice);
    formDataUpdate.append('stockQuantity', productStockQuantity);
    formDataUpdate.append('soldQuantity', productSoldQuantity);
    // Adicionar a imagem, se necessário
    const productImageInput = document.getElementById('editProductImage');
    if (productImageInput) {
        if (productImageInput.files.length > 0) {
            formDataUpdate.append('productImage', productImageInput.files[0]);
        }
    }

    try {
        const response = await fetch(`${apiUrl}/products/${productId}`, {
            method: 'PUT',
            body: formDataUpdate
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar produto.');
        }

        // Fechar o modal após salvar
        $('#editProductModal').modal('hide');

        // Atualizar a lista de produtos após edição
        await renderControlProducts();

    } catch (error) {
        console.error('Erro ao salvar produto:', error);
    }
}

// Função para adicionar um novo produto
async function addProduct() {
    const productName = document.getElementById('productName').value;
    const productDescription = document.getElementById('productDescription').value;
    const productPrice = document.getElementById('productPrice').value;
    const productStockQuantity = document.getElementById('productStockQuantity').value;
    const productSoldQuantity = document.getElementById('productSoldQuantity').value;

    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', productDescription);
    formData.append('price', productPrice);
    formData.append('stockQuantity', productStockQuantity);
    formData.append('soldQuantity', productSoldQuantity);
    // Adicionar a imagem, se necessário
    const productImageInput = document.getElementById('productImage');
    if (productImageInput.files.length > 0) {
        formData.append('productImage', productImageInput.files[0]);
    }

    try {
        const response = await fetch(`${apiUrl}/products`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erro ao adicionar produto.');
        }

        // Fechar o modal após adicionar o produto
        $('#addProductModal').modal('hide');

        // Limpar o formulário após adicionar o produto (opcional)
        document.getElementById('addProductForm').reset();

        // Atualizar a lista de produtos após adição
        await renderControlProducts();

    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
    }
}


// Função para renderizar produtos na página de controle de produtos (se aplicável)
async function renderControlProducts() {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;

    const products = await fetchProducts();
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

// Função para renderizar os itens do carrinho
async function renderCartItems() {
    try {
        const response = await fetch(`${apiUrl}/carts/${currentUser.id}`); // Supondo que o ID do carrinho do usuário logado seja 1
        if (!response.ok) {
            throw new Error('Erro ao obter itens do carrinho.');
        }
        const cart = await response.json();
        const cartItemsContainer = document.getElementById('cartItems');
        cartItemsContainer.innerHTML = ''; // Limpa o conteúdo atual

        if (cart.items.length === 0) {
            cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio :(</p>';
        } else {
            cart.items.forEach(item => {
                const cartItemHTML = `
                    <div class="cart-item">
                        <img src="${`G:/Meus%20Projetos/frutaria/api/public${item.imageUrl.replace(/\\/g, '/')}`}" alt="${item.name}" style="width: 25%;">
                        <div class="cart-item-info">
                            <h6>${item.name}</h6>
                            <p class="cart-item-price">${item.price}</p>
                        </div>
                    </div>
                `;
                cartItemsContainer.innerHTML += cartItemHTML;
            });
        }

        // Atualiza o resumo da compra (subtotal, entrega, total, etc.)
        updateCheckoutSummary(cart);

    } catch (error) {
        console.error('Erro ao renderizar itens do carrinho:', error);
    }
}

// Função para atualizar o resumo da compra
function updateCheckoutSummary(cart) {
    const checkoutSummary = document.querySelector('.checkout-summary');
    checkoutSummary.innerHTML = `
        <h6>Resumo da compra</h6>
        <div class="d-flex justify-content-between">
            <p>Subtotal</p>
            <p>${formatCurrency(cart.subtotal)}</p>
        </div>
        <div class="d-flex justify-content-between">
            <p>Entrega</p>
            <p>A calcular</p>
        </div>
        <div class="d-flex justify-content-between">
            <h6>Total</h6>
            <h6>${formatCurrency(cart.total)}</h6>
        </div>
        <p>Cartão de Crédito</p>
        <div class="container" style="padding-bottom: 10px;">
            <div class="col-12">
                <div class="form-floating">
                    <input type="text" class="form-control" id="cardNumber" placeholder="Número">
                    <label for="cardNumber">Número</label>
                </div>
            </div>
        </div>
        <button class="btn btn-primary">Finalizar a compra</button>
    `;
}

// Função utilitária para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Função para adicionar um item ao carrinho
async function addToCart(productId, productName, productPrice, productImageUrl) {
    try {
        const newItem = {
            id: productId,
            name: productName,
            price: productPrice,
            quantity: 1, // Definir a quantidade inicial
            imageUrl: productImageUrl
        };

        const response = await fetch(`${apiUrl}/carts/${currentUser.id}/addItem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newItem),
        });

        if (!response.ok) {
            throw new Error('Erro ao adicionar item ao carrinho.');
        }

        // Atualiza a interface para refletir o item adicionado ao carrinho
        await renderCartItems();

    } catch (error) {
        console.error('Erro ao adicionar item ao carrinho:', error);
    }
}

// Função para criar o card do produto
function createProductCard(product) {
    const imageUrl = `G:/Meus%20Projetos/frutaria/api/public${product.imageUrl.replace(/\\/g, '/')}`;

    return `
        <div class="col-xl-3 col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
            <div class="product-item">
                <div class="position-relative bg-light overflow-hidden">
                    <img class="img-fluid w-100" src="${imageUrl}" alt="${product.name}">
                </div>
                <div class="text-center p-4">
                    <a class="d-block h5 mb-2" href="#">${product.name}</a>
                    <span class="text-primary">${product.price}</span>
                </div>
                <div class="d-flex border-top">
                    <small class="w-50 text-center border-end py-2">
                        <a class="text-body" href="#"><i class="far fa-money-bill-alt text-primary me-2"></i>Comprar</a>
                    </small>
                    <small class="w-50 text-center py-2">
                        <a class="text-body" href="" onclick="addToCart(${product.id}, '${product.name}', '${product.price}', '${imageUrl}')"><i class="fa fa-shopping-bag text-primary me-2"></i>Adicionar ao Carrinho</a>
                    </small>
                </div>
            </div>
        </div>
    `;
}


// Inicialização ao carregar a página
window.onload = function() {
    updateUI();
    renderProducts();
    renderControlProducts(); // Renderiza os produtos na página de controle de produtos (se aplicável)
    renderCartItems();
};
