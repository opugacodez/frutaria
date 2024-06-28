const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

app.use(cors());

// Middleware para interpretar corpos de requisição como JSON
app.use(bodyParser.json());

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img/products'); // Diretório onde as imagens serão salvas
    },
    filename: function (req, file, cb) {
        cb(null, 'product_' + Date.now() + '.' + file.mimetype.split('/')[1]); // Nome do arquivo
    }
});

const upload = multer({ storage: storage });

// Arquivos JSON de dados
const usersFile = './data/users.json';
const productsFile = './data/products.json';
const cartsFile = './data/carts.json';

// Função para ler dados de um arquivo JSON
function readDataFromFile(file, callback) {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            console.error(`Erro ao ler ${file}: ${err}`);
            callback([]);
        } else {
            try {
                const parsedData = JSON.parse(data);
                callback(parsedData);
            } catch (error) {
                console.error(`Erro ao fazer parse do JSON de ${file}: ${error}`);
                callback([]);
            }
        }
    });
}

// Função para escrever dados em um arquivo JSON
function writeDataToFile(file, data, callback) {
    fs.writeFile(file, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error(`Erro ao escrever em ${file}: ${err}`);
            callback(false);
        } else {
            callback(true);
        }
    });
}

// Rotas para CRUD de usuários

// Endpoint para autenticar usuário (login)
app.post('/users/login', (req, res) => {
    const { email, password } = req.body;

    readDataFromFile(usersFile, (users) => {
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            res.json(user);
        } else {
            res.status(401).json({ message: 'Email ou senha incorretos.' });
        }
    });
});


// Obter todos os usuários
app.get('/users', (req, res) => {
    readDataFromFile(usersFile, (users) => {
        res.json(users);
    });
});

// Obter um usuário específico
app.get('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    readDataFromFile(usersFile, (users) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            res.json(user);
        } else {
            res.status(404).send('Usuário não encontrado.');
        }
    });
});

// Adicionar um novo usuário
app.post('/users', (req, res) => {
    let newUser;

    readDataFromFile(usersFile, (users) => {
        newUser = {
            id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
            ...req.body
        };
        users.push(newUser);
        writeDataToFile(usersFile, users, (success) => {
            if (success) {
                res.json(newUser);
            } else {
                res.status(500).send('Erro ao adicionar usuário.');
            }
        });
    });

    readDataFromFile(cartsFile, (carts) => {
        const newCart = {
            id: carts.length > 0 ? carts[carts.length - 1].id + 1 : 1,
            userId: newUser.id,
            items: [],
            total_amount: 0
        }
        carts.push(newCart);
        writeDataToFile(cartsFile, carts, (success) => {
            if (success) {
                res.json(newCart);
            } else {
                res.status(500).send('Erro ao adicionar carrinho.');
            }
        });
    });
});

// Atualizar um produto
app.put('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    readDataFromFile(productsFile, (products) => {
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) {
            // Obter o produto original
            const originalProduct = products[index];

            console.log("REQUEST BODY:", req.body);

            // Construir o produto atualizado com os novos dados recebidos
            const updatedProduct = {
                id: productId,
                name: req.body.name || originalProduct.name,
                description: req.body.description || originalProduct.description,
                price: parseFloat(req.body.price) || originalProduct.price,
                stockQuantity: parseInt(req.body.stockQuantity) || originalProduct.stockQuantity,
                soldQuantity: parseInt(req.body.soldQuantity) || originalProduct.soldQuantity,
                imageUrl: originalProduct.imageUrl // Manter a imagem original
            };

            // Atualizar o produto no array de produtos
            products[index] = updatedProduct;

            // Escrever de volta no arquivo JSON
            writeDataToFile(productsFile, products, (success) => {
                if (success) {
                    res.json(updatedProduct);
                } else {
                    res.status(500).send('Erro ao atualizar produto.');
                }
            });
        } else {
            res.status(404).send('Produto não encontrado.');
        }
    });
});

// Deletar um usuário
app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    readDataFromFile(usersFile, (users) => {
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users.splice(index, 1);
            writeDataToFile(usersFile, users, (success) => {
                if (success) {
                    res.send('Usuário excluído com sucesso.');
                } else {
                    res.status(500).send('Erro ao excluir usuário.');
                }
            });
        } else {
            res.status(404).send('Usuário não encontrado.');
        }
    });
});

// Rotas para CRUD de produtos

// Obter todos os produtos
app.get('/products', (req, res) => {
    readDataFromFile(productsFile, (products) => {
        res.json(products);
    });
});

// Obter um produto específico
app.get('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    readDataFromFile(productsFile, (products) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            res.json(product);
        } else {
            res.status(404).send('Produto não encontrado.');
        }
    });
});


// Adicionar um novo produto
app.post('/products', upload.single('productImage'), (req, res) => {
    readDataFromFile(productsFile, (products) => {
        const newProduct = {
            id: products.length > 0 ? products[products.length - 1].id + 1 : 1,
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price.replace(",", ".")),
            stockQuantity: parseInt(req.body.stockQuantity),
            soldQuantity: parseInt(req.body.soldQuantity),
            imageUrl: req.file.path.replace('public', '') // Caminho da imagem a partir da pasta public
        };
        products.push(newProduct);
        writeDataToFile(productsFile, products, (success) => {
            if (success) {
                res.json(newProduct);
            } else {
                res.status(500).send('Erro ao adicionar produto.');
            }
        });
    });
});

// Atualizar um produto
app.put('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    readDataFromFile(productsFile, (products) => {
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) {
            // Obter o produto original
            const originalProduct = products[index];

            console.log("REQUEST BODY:", req.body);

            // Construir o produto atualizado com os novos dados recebidos
            const updatedProduct = {
                id: productId,
                ...req.body,
                imageUrl: req.body.imageUrl || originalProduct.imageUrl // Manter a imagem original se não for enviada uma nova
            };

            // Se houver uma imagem nova, atualize o imageUrl no objeto updatedProduct
            if (req.body.imageUrl) {
                updatedProduct.imageUrl = req.body.imageUrl;
            }

            // Atualizar o produto no array de produtos
            products[index] = updatedProduct;

            // Escrever de volta no arquivo JSON
            writeDataToFile(productsFile, products, (success) => {
                if (success) {
                    res.json(updatedProduct);
                } else {
                    res.status(500).send('Erro ao atualizar produto.');
                }
            });
        } else {
            res.status(404).send('Produto não encontrado.');
        }
    });
});


// Deletar um produto
app.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    readDataFromFile(productsFile, (products) => {
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) {
            products.splice(index, 1);
            writeDataToFile(productsFile, products, (success) => {
                if (success) {
                    res.send('Produto excluído com sucesso.');
                } else {
                    res.status(500).send('Erro ao excluir produto.');
                }
            });
        } else {
            res.status(404).send('Produto não encontrado.');
        }
    });
});

// Obter todos os carrinhos
app.get('/carts', (req, res) => {
    readDataFromFile(cartsFile, (carts) => {
        res.json(carts);
    });
});

// Endpoint para obter o carrinho do usuário logado
app.get('/carts/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    readDataFromFile(cartsFile, (carts) => {
        const cart = carts.find(c => c.userId === userId);
        if (cart) {
            res.json(cart);
        } else {
            res.status(404).send('Carrinho não encontrado.');
        }
    });
});

// Adicionar um novo carrinho
app.post('/carts', (req, res) => {
    readDataFromFile(cartsFile, (carts) => {
        const newCart = {
            id: carts.length > 0 ? carts[carts.length - 1].id + 1 : 1,
            ...req.body
        };
        carts.push(newCart);
        writeDataToFile(cartsFile, carts, (success) => {
            if (success) {
                res.json(newCart);
            } else {
                res.status(500).send('Erro ao adicionar carrinho.');
            }
        });
    });
});

// Atualizar um carrinho
app.put('/carts/:id', (req, res) => {
    const cartId = parseInt(req.params.id);
    readDataFromFile(cartsFile, (carts) => {
        const index = carts.findIndex(c => c.id === cartId);
        if (index !== -1) {
            const updatedCart = {
                id: cartId,
                ...req.body
            };
            carts[index] = updatedCart;
            writeDataToFile(cartsFile, carts, (success) => {
                if (success) {
                    res.json(updatedCart);
                } else {
                    res.status(500).send('Erro ao atualizar carrinho.');
                }
            });
        } else {
            res.status(404).send('Carrinho não encontrado.');
        }
    });
});

// Deletar um carrinho
app.delete('/carts/:id', (req, res) => {
    const cartId = parseInt(req.params.id);
    readDataFromFile(cartsFile, (carts) => {
        const index = carts.findIndex(c => c.id === cartId);
        if (index !== -1) {
            carts.splice(index, 1);
            writeDataToFile(cartsFile, carts, (success) => {
                if (success) {
                    res.send('Carrinho excluído com sucesso.');
                } else {
                    res.status(500).send('Erro ao excluir carrinho.');
                }
            });
        } else {
            res.status(404).send('Carrinho não encontrado.');
        }
    });
});

// Deletar um item do carrinho
app.delete('/carts/:cartId/items/:itemId', (req, res) => {
    const cartId = parseInt(req.params.cartId);
    const itemId = parseInt(req.params.itemId);

    readDataFromFile(cartsFile, (carts) => {
        const cartIndex = carts.findIndex(c => c.id === cartId);
        if (cartIndex !== -1) {
            const cart = carts[cartIndex];
            const itemIndex = cart.items.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                // Obter o item removido
                const removedItem = cart.items[itemIndex];

                // Atualizar o total_amount do carrinho
                cart.total_amount -= removedItem.price * removedItem.quantity;

                // Remover o item do carrinho
                cart.items.splice(itemIndex, 1);

                writeDataToFile(cartsFile, carts, (success) => {
                    if (success) {
                        res.send('Item removido do carrinho com sucesso.');
                    } else {
                        res.status(500).send('Erro ao atualizar carrinho após remover item.');
                    }
                });
            } else {
                res.status(404).send('Item não encontrado no carrinho.');
            }
        } else {
            res.status(404).send('Carrinho não encontrado.');
        }
    });
});

// Adicionar item ao carrinho
app.post('/carts/:userId/addItem', (req, res) => {
    const userId = parseInt(req.params.userId);
    const newItem = req.body;

    readDataFromFile(cartsFile, (carts) => {
        const cartIndex = carts.findIndex(c => c.userId === userId);
        
        if (cartIndex !== -1) {
            // Carrinho encontrado
            const cart = carts[cartIndex];
            const itemIndex = cart.items.findIndex(item => item.id === newItem.id);

            if (itemIndex !== -1) {
                // Item já existe no carrinho, incrementar quantidade
                cart.items[itemIndex].quantity++;
            } else {
                // Item novo, adicionar ao carrinho
                cart.items.push({
                    id: newItem.id,
                    name: newItem.name,
                    description: newItem.description,
                    price: newItem.price,
                    quantity: 1,
                    imageUrl: newItem.imageUrl
                });
            }

            // Atualizar o total_amount do carrinho
            cart.total_amount += newItem.price;

            // Atualizar o arquivo de dados
            carts[cartIndex] = cart;
            writeDataToFile(cartsFile, carts, (success) => {
                if (success) {
                    res.status(200).send('Item adicionado ao carrinho com sucesso.');
                } else {
                    res.status(500).send('Erro ao adicionar item ao carrinho.');
                }
            });
        } else {
            // Carrinho não encontrado para o usuário
            res.status(404).send('Carrinho não encontrado.');
        }
    });
});

// Endpoint para atualizar o estoque e a quantidade vendida de um produto
app.patch('/products/:productId', (req, res) => {
    const productId = parseInt(req.params.productId);
    const quantity = parseInt(req.body.quantity);

    console.log(quantity);

    // Ler os produtos do arquivo JSON
    readDataFromFile(productsFile, (products) => {
        // Encontrar o índice do produto pelo productId
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).send('Produto não encontrado.');
        }

        // Atualizar a quantidade em estoque do produto
        products[productIndex].stockQuantity -= quantity;
        products[productIndex].soldQuantity += quantity;

        // Escrever os produtos de volta no arquivo JSON
        writeDataToFile(productsFile, products, (success) => {
            if (success) {
                res.send('Estoque e quantidade vendida do produto atualizados com sucesso.');
            } else {
                res.status(500).send('Erro ao atualizar o estoque e a quantidade vendida do produto.');
            }
        });
    });
});

// Endpoint para remover todos os itens do carrinho de um usuário
app.delete('/carts/:userId/items', (req, res) => {
    const userId = parseInt(req.params.userId);

    // Simulação de leitura do carrinho do usuário (substitua com sua lógica real)
    readDataFromFile(cartsFile, (carts) => {
        const cartIndex = carts.findIndex(cart => cart.userId === userId);
        if (cartIndex !== -1) {
            // Limpar itens do carrinho
            carts[cartIndex].items = [];

            // Salvar as alterações no arquivo (simulação)
            writeDataToFile(cartsFile, carts, (success) => {
                if (success) {
                    res.send('Itens do carrinho removidos com sucesso após a compra.');
                } else {
                    res.status(500).send('Erro ao limpar itens do carrinho após a compra.');
                }
            });
        } else {
            res.status(404).send('Carrinho do usuário não encontrado.');
        }
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});