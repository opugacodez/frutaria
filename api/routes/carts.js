const express = require('express');
const router = express.Router();
const fs = require('fs');
const cartsFile = './data/carts.json';

// Função para ler dados de um arquivo JSON
function readDataFromFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) {
                reject(`Erro ao ler ${file}: ${err}`);
            } else {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (error) {
                    reject(`Erro ao fazer parse do JSON de ${file}: ${error}`);
                }
            }
        });
    });
}

// Função para escrever dados em um arquivo JSON
function writeDataToFile(file, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                reject(`Erro ao escrever em ${file}: ${err}`);
            } else {
                resolve(true);
            }
        });
    });
}

// Rotas para CRUD de carrinhos
// Obter todos os carrinhos
router.get('/carts', (req, res) => {
    readDataFromFile(cartsFile, (carts) => {
        res.json(carts);
    });
});

// Endpoint para obter o carrinho do usuário logado
router.get('/carts/:userId', (req, res) => {
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
router.post('/carts', (req, res) => {
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
router.put('/carts/:id', (req, res) => {
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
router.delete('/carts/:id', (req, res) => {
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

// Adicionar um item ao carrinho do usuário
router.post('/carts/:userId/addItem', (req, res) => {
    const userId = parseInt(req.params.userId);
    const newItem = req.body;

    readDataFromFile(cartsFile, (carts) => {
        const cartIndex = carts.findIndex(c => c.userId === userId);
        if (cartIndex !== -1) {
            const cart = carts[cartIndex];
            // Verifica se o item já existe no carrinho
            const existingItemIndex = cart.items.findIndex(item => item.id === newItem.id);
            if (existingItemIndex !== -1) {
                // Atualiza a quantidade se o item já existe
                cart.items[existingItemIndex].quantity += newItem.quantity;
            } else {
                // Adiciona um novo item ao carrinho
                cart.items.push(newItem);
            }
            // Atualiza o total do carrinho
            cart.total_amount += newItem.price * newItem.quantity;

            // Salva as alterações no arquivo
            writeDataToFile(cartsFile, carts, (success) => {
                if (success) {
                    res.json(cart);
                } else {
                    res.status(500).send('Erro ao adicionar item ao carrinho.');
                }
            });
        } else {
            res.status(404).send('Carrinho não encontrado.');
        }
    });
});

module.exports = router;
