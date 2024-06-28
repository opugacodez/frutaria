const express = require('express');
const router = express.Router();
const fs = require('fs');
const productsFile = './data/products.json';
const bodyParser = require('body-parser');
const multer = require('multer');

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

// Rotas para CRUD de produtos
// Obter todos os produtos
router.get('/products', (req, res) => {
    readDataFromFile(productsFile, (products) => {
        res.json(products);
    });
});

// Obter um produto específico
router.get('/products/:id', (req, res) => {
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
router.post('/products', upload.single('productImage'), (req, res) => {
    readDataFromFile(productsFile, (products) => {
        const newProduct = {
            id: products.length > 0 ? products[products.length - 1].id + 1 : 1,
            ...req.body,
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
router.put('/products/:id', (req, res) => {
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
router.delete('/products/:id', (req, res) => {
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

module.exports = router;
