const express = require('express');
const router = express.Router();
const fs = require('fs');
const usersFile = './data/users.json';

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

// Endpoint para autenticar usuário (login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const users = await readDataFromFile(usersFile);
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Não retornar o campo de senha
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(401).json({ message: 'Email ou senha incorretos.' });
        }
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

// Obter todos os usuários
router.get('/', async (req, res) => {
    try {
        const users = await readDataFromFile(usersFile);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

// Obter um usuário específico
router.get('/:id', async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        const users = await readDataFromFile(usersFile);
        const user = users.find(u => u.id === userId);

        if (user) {
            res.json(user);
        } else {
            res.status(404).send('Usuário não encontrado.');
        }
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

// Adicionar um novo usuário
router.post('/', async (req, res) => {
    try {
        const users = await readDataFromFile(usersFile);
        const newUser = {
            id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
            ...req.body
        };
        users.push(newUser);
        await writeDataToFile(usersFile, users);
        res.json(newUser);
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

// Atualizar um usuário
router.put('/:id', async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        let users = await readDataFromFile(usersFile);
        const index = users.findIndex(u => u.id === userId);

        if (index !== -1) {
            const updatedUser = { ...users[index], ...req.body };
            users[index] = updatedUser;
            await writeDataToFile(usersFile, users);
            res.json(updatedUser);
        } else {
            res.status(404).send('Usuário não encontrado.');
        }
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

// Deletar um usuário
router.delete('/:id', async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        let users = await readDataFromFile(usersFile);
        const index = users.findIndex(u => u.id === userId);

        if (index !== -1) {
            users.splice(index, 1);
            await writeDataToFile(usersFile, users);
            res.send('Usuário excluído com sucesso.');
        } else {
            res.status(404).send('Usuário não encontrado.');
        }
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

module.exports = router;
