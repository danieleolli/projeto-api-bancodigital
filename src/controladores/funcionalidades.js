const { banco, contas, saques, transferencias, depositos } = require('../bancodedados');

function verificarCpfExiste(cpf) {
    return contas.find(function (conta) {
        return conta.usuario.cpf === cpf;
    });
}

function verificarEmailExiste(email) {
    return contas.find(function (conta) {
        return conta.usuario.email === email;
    })
}

function validarCamposObrigatorios(reqbody) {
    const { nome, cpf, data_nascimento, telefone, email, senha } = reqbody;
    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return false;
    };
    return true;
};

function validarNumeroConta(contas, numeroConta) {
    const contaEncontrada = contas.find(function (conta) {
        return conta.numero === numeroConta;
    });
    return contaEncontrada;
};

function validarNumeroContaEValor(reqbody) {
    const { numero_conta, valor } = reqbody;
    if (!numero_conta || !valor) {
        return false;
    };
    return true;
};

function validarNumeroContaEValorESenha(reqbody) {
    const { numero_conta, valor, senha } = reqbody;
    if (!numero_conta || !valor || !senha) {
        return false;
    };
    return true;
};



const listarContas = function (req, res) {
    const { senha_banco } = req.query;

    if (!senha_banco) {
        return res.status(400).json({ mensagem: 'A senha do banco não foi informada.' })
    };

    if (senha_banco !== banco.senha) {
        return res.status(401).json({ mensagem: 'A senha do banco informada é inválida!' });
    }

    return res.status(200).json(contas);
}

let identificador = 0;


const criarContaBancaria = function (req, res) {

    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    if (!validarCamposObrigatorios(req.body)) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
    }


    if (verificarCpfExiste(cpf) && verificarEmailExiste(email)) {
        return res.status(400).json({ mensagem: 'Já existe uma conta com o cpf ou e-mail informado' })
    };

    identificador++;

    const contaCadastrada = {
        numero: identificador.toString(),
        saldo: 0,
        usuario: {
            nome,
            cpf,
            data_nascimento,
            telefone,
            email,
            senha
        }
    };

    contas.push(contaCadastrada);

    return res.status(201).send();

}


const atualizarUsuario = function (req, res) {

    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    const { numeroConta } = req.params;

    const contaAtualizada = validarNumeroConta(contas, numeroConta);

    if (!contaAtualizada) {
        return res.status(404).json({ mensagem: 'A conta informada não foi encontrada.' })
    };

    if (!validarCamposObrigatorios(req.body)) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
    };

    if (verificarCpfExiste(cpf) && verificarEmailExiste(email)) {
        return res.status(400).json({ mensagem: 'Já existe uma conta com o cpf ou e-mail informado' })
    };

    const usuario = contaAtualizada.usuario;
    usuario.nome = nome;
    usuario.cpf = cpf;
    usuario.data_nascimento = data_nascimento;
    usuario.telefone = telefone;
    usuario.email = email;
    usuario.senha = senha;

    res.status(204).send();
}


const excluirUsuario = function (req, res) {
    const { numeroConta } = req.params;

    const contaAtualizada = validarNumeroConta(contas, numeroConta);

    if (!contaAtualizada) {
        return res.status(404).json({ mensagem: 'A conta informada não foi encontrada.' });
    }

    if (contaAtualizada.saldo > 0) {
        return res.status(400).json({ mensagem: 'A conta só pode ser removida se o saldo for zero.' });
    }

    const indice = contas.findIndex((conta) => conta.numero === numeroConta.toString());

    if (indice === -1) {
        return res.status(404).json({ mensagem: 'A conta informada não foi encontrada.' });
    }

    if (contas[indice].saldo > 0) {
        return res.status(400).json({ mensagem: 'A conta só pode ser removida se o saldo for zero.' });
    }

    contas.splice(indice, 1);
    return res.status(204).send();
};


const depositarValor = function (req, res) {
    const { numero_conta, valor } = req.body;

    const contaEncontrada = contas.find(function (conta) {
        return conta.numero === numero_conta;
    });

    if (!contaEncontrada) {
        return res.status(404).json({ mensagem: 'A conta informada não foi encontrada.' });
    }

    if (!validarNumeroContaEValor(req.body)) {
        return res.status(400).json({ mensagem: 'O número da conta e o valor são obrigatórios.' });
    }

    if (valor < 0) {
        return res.status(400).json({ mensagem: 'Não é possível depositar valores negativos.' });
    }

    contaEncontrada.saldo += Number(valor);

    const depositoEfetuado = {
        data: new Date().toLocaleString(),
        numero_conta,
        valor: Number(valor)
    };

    depositos.push(depositoEfetuado);

    return res.status(204).send();
};


const sacarValor = function (req, res) {

    const { numero_conta, valor, senha } = req.body;

    const contaEncontrada = contas.find(function (conta) {
        return conta.numero === numero_conta;
    });

    if (!validarNumeroContaEValorESenha(req.body)) {
        return res.status(400).json({ mensagem: 'O numero da conta, valor e senha são campos obrigatórios.' });
    };

    if (!contaEncontrada) {
        return res.status(404).json({ mensagem: 'A conta informada não foi encontrada.' });
    };

    if (contaEncontrada.usuario.senha !== senha) {
        return res.status(400).json({ mensagem: 'A senha informada é inválida' })
    };

    if (contaEncontrada.saldo < valor) {
        return res.status(400).json({ mensagem: 'O saldo é insuficiente.' });
    };

    contaEncontrada.saldo -= valor;

    const saqueEfetuado = {
        data: new Date().toLocaleString(),
        numero_conta,
        valor
    };

    saques.push(saqueEfetuado);

    return res.status(204).send();
};


const transferirValor = function (req, res) {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;

    if (!numero_conta_destino || !numero_conta_origem, !valor, !senha) {
        return res.status(400).json({ mensagem: 'O numero da conta de origem, destino, valor e senha são campos obrigatórios.' });
    };

    const contaOrigemEncontrada = contas.find(function (conta) {
        return conta.numero === numero_conta_origem;
    });

    const contaDestinoEncontrada = contas.find(function (conta) {
        return conta.numero === numero_conta_destino;
    });

    if (!contaDestinoEncontrada || !contaOrigemEncontrada) {
        return res.status(404).json({ mensagem: 'Conta origem ou conta destino não encontradas.' });
    };

    if (contaOrigemEncontrada.usuario.senha !== senha) {
        return res.status(400).json({ mensagem: 'A senha informada é inválida.' });
    };

    if (contaOrigemEncontrada.saldo < valor) {
        return res.status(400).json({ mensagem: 'O saldo é insuficiente.' });
    };

    contaOrigemEncontrada.saldo -= valor;
    contaDestinoEncontrada.saldo += valor;

    const transferenciasEfetuadas = {
        data: new Date().toLocaleString(),
        numero_conta_origem,
        numero_conta_destino,
        valor
    }

    transferencias.push(transferenciasEfetuadas);

    return res.status(204).send();
};


const saldo = function (req, res) {
    const { numero_conta, senha } = req.query;

    if (!numero_conta || !senha) {
        res.status(400).json({ mensagem: 'O numero da conta e senha são obrigatórios' });
    };

    const contaEncontrada = contas.find(function (conta) {
        return conta.numero === numero_conta;
    });

    if (!contaEncontrada) {
        return res.status(404).json({ mensagem: 'A conta informada não foi encontrada.' });
    };

    if (contaEncontrada.usuario.senha !== senha) {
        return res.status(400).json({ mensagem: 'A senha informada é inválida.' });
    };

    return res.status(200).json({ saldo: contaEncontrada.saldo });
};


const extrato = function (req, res) {
    const { numero_conta, senha } = req.query;

    if (!numero_conta || !senha) {
        res.status(400).json({ mensagem: 'O numero da conta e senha são obrigatórios' });
    };

    const contaEncontrada = contas.find(function (conta) {
        return conta.numero === numero_conta;
    });

    if (!contaEncontrada) {
        return res.status(404).json({ mensagem: 'A conta informada não foi encontrada.' });
    };

    if (contaEncontrada.usuario.senha !== senha) {
        return res.status(400).json({ mensagem: 'A senha informada é inválida' });
    };

    const transferenciasEnviadas = transferencias.filter(function (transferencia) {
        return transferencia.numero_conta_origem === numero_conta;
    });

    const transferenciasRecebidas = transferencias.filter(function (transferencia) {
        return transferencia.numero_conta_destino === numero_conta;
    });

    const depositosEfetuados = depositos.filter(function (deposito) {
        return deposito.numero_conta === numero_conta;
    });

    const saquesEfetuados = saques.filter(function (saques) {
        return saques.numero_conta === numero_conta;
    });


    const extrato = {
        depositos: depositosEfetuados,
        saques: saquesEfetuados,
        transferenciasEnviadas,
        transferenciasRecebidas
    }

    return res.status(200).json(extrato);
}



module.exports = {
    listarContas,
    criarContaBancaria,
    atualizarUsuario,
    excluirUsuario,
    depositarValor,
    sacarValor,
    transferirValor,
    saldo,
    extrato
}