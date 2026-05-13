// middleware/error.js

// Função para formatar erros do Zod
function formatZodErrors(errors) {
    return errors.map(e => {
        const field = e.path.join('.') || 'campo_desconhecido';

        // Traduz mensagens mais técnicas para algo mais amigável
        let message = e.message;
        if (e.code === 'invalid_type' && e.expected === 'number') {
            message = 'O valor deve ser um número válido.';
        }

        return `Campo "${field}": ${message}`;
    });
}

function errorHandler(err, req, res, _next) {
    console.error(err);

    // MySQL duplicate key
    if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            error: 'Registro já existe (chave única violada).'
        });
    }

    // Zod
    if (err && err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Payload inválido',
            details: formatZodErrors(err.errors)  // usa a função definida acima
        });
    }

    // Outros erros
    res.status(500).json({ error: 'Erro interno' });
}

module.exports = { errorHandler };
