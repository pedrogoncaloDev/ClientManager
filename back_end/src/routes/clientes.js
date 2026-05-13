const express = require('express');
const { pool } = require('../db');
const { z } = require('zod');

const router = express.Router();

// --------- Schemas (Zod) ----------
const baseSchema = z.object({
    idUsuario: z.coerce.number().int().positive(),   // OBRIGATÓRIO
    Codigo: z.string().min(1).max(15),               // OBRIGATÓRIO
    Nome: z.string().min(1).max(150),                // OBRIGATÓRIO
    CPF_CNPJ: z.string().min(1).max(20),             // OBRIGATÓRIO
    CEP: z.coerce.number().int().nullable().optional(),
    Logradouro: z.string().max(100).nullable().optional(),
    Endereco: z.string().max(120).nullable().optional(),
    Numero: z.string().max(20).nullable().optional(),
    Bairro: z.string().max(50).nullable().optional(),
    Cidade: z.string().max(60).nullable().optional(),
    UF: z.string().length(2).nullable().optional(),
    Complemento: z.string().max(150).nullable().optional(),
    Fone: z.string().max(20).nullable().optional(),
    LimiteCredito: z.coerce.number().nullable().optional(),
    Validade: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
}).strict();

const createSchema = baseSchema;
const updateSchema = baseSchema.partial(); // PUT/PATCH parcial

// ---------- Helpers ----------
function pickFields(payload) {
    return [
        payload.idUsuario,
        payload.Codigo,
        payload.Nome,
        payload.CPF_CNPJ,
        payload.CEP ?? null,
        payload.Logradouro ?? null,
        payload.Endereco ?? null,
        payload.Numero ?? null,
        payload.Bairro ?? null,
        payload.Cidade ?? null,
        payload.UF ?? null,
        payload.Complemento ?? null,
        payload.Fone ?? null,
        payload.LimiteCredito ?? null,
        payload.Validade ?? null
    ];
}

// ---------- Rotas ----------

// GET /clientes?search=&page=1&limit=20
router.get('/', async (req, res, next) => {
    try {
        const search = String(req.query.search || '').trim();
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
        const offset = (page - 1) * limit;

        const where = [];
        const params = [];

        if (search) {
            where.push(`(Codigo LIKE ? OR Nome LIKE ? OR CPF_CNPJ LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM clientes ${whereSql}`,
            params
        );

        const [rows] = await pool.query(
            `SELECT *
         FROM clientes
         ${whereSql}
         ORDER BY ID DESC
         LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({ page, limit, total, rows });
    } catch (err) {
        next(err);
    }
});

// GET /clientes/:id
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });

        const [rows] = await pool.query(`SELECT * FROM clientes WHERE ID = ?`, [id]);
        if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

// POST /clientes
router.post('/', async (req, res, next) => {
    try {
        const payload = createSchema.parse(req.body);

        const sql = `
            INSERT INTO clientes (
                idUsuario, Codigo, Nome, CPF_CNPJ, CEP, Logradouro, Endereco, Numero,
                Bairro, Cidade, UF, Complemento, Fone, LimiteCredito, Validade
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        // Monta o endereço completo
        const endereco = [
            payload.Logradouro,
            payload.Numero ? `nº ${payload.Numero}` : null,
            payload.Bairro,
            payload.Cidade
        ]
        .filter(Boolean) 
        .join(', ');

        const params = [
            payload.idUsuario,
            payload.Codigo,
            payload.Nome,
            payload.CPF_CNPJ,
            payload.CEP ?? null,
            payload.Logradouro ?? null,
            endereco || null,
            payload.Numero ?? null,
            payload.Bairro ?? null,
            payload.Cidade ?? null,
            payload.UF ?? null,
            payload.Complemento ?? null,
            payload.Fone ?? null,
            payload.LimiteCredito ?? null,
            payload.Validade ?? null
        ];

        const [result] = await pool.query(sql, params);
        const [rows] = await pool.query(`SELECT * FROM clientes WHERE ID = ?`, [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
         // Se for erro do Zod, retorna 400 com os detalhes
        if (err.errors) {
            return res.status(400).json({
                error: "Erro de validação",
                details: err.errors
            });
        }

        // Outros erros (DB, etc.)
        console.error("Erro inesperado:", err);
        res.status(500).json({
            error: "Erro interno no servidor"
        });
    }
});

// PUT /clientes/:id  (atualização total ou parcial)
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const data = updateSchema.parse(req.body);
        if (!Object.keys(data).length) {
            return res.status(400).json({ error: 'Nada para atualizar' });
        }

        const columnsMap = {
            idUsuario: 'idUsuario',
            Codigo: 'Codigo',
            Nome: 'Nome',
            CPF_CNPJ: 'CPF_CNPJ',
            CEP: 'CEP',
            Logradouro: 'Logradouro',
            Endereco: 'Endereco',
            Numero: 'Numero',
            Bairro: 'Bairro',
            Cidade: 'Cidade',
            UF: 'UF',
            Complemento: 'Complemento',
            Fone: 'Fone',
            LimiteCredito: 'LimiteCredito',
            Validade: 'Validade'
        };

        const sets = [];
        const params = [];
        for (const [k, v] of Object.entries(data)) {
            if (columnsMap[k]) {
                sets.push(`${columnsMap[k]} = ?`);
                params.push(v ?? null);
            }
        }

        if (!sets.length) {
            return res.status(400).json({ error: 'Campos inválidos' });
        }

        const sql = `UPDATE clientes SET ${sets.join(', ')} WHERE ID = ?`;
        params.push(id);

        const [result] = await pool.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Não encontrado' });
        }

        const [rows] = await pool.query(`SELECT * FROM clientes WHERE ID = ?`, [id]);
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

// DELETE /clientes/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });

        const [result] = await pool.query(`DELETE FROM clientes WHERE ID = ?`, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Não encontrado' });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
