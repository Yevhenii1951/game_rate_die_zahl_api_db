require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

// On Render, DATABASE_URL is set automatically (internal URL).
// Locally, fall back to individual env vars.
const pool = process.env.DATABASE_URL
	? new Pool({
			connectionString: process.env.DATABASE_URL,
			ssl: { rejectUnauthorized: false },
		})
	: new Pool({
			user: process.env.DB_USER || 'dci-student',
			host: process.env.DB_HOST || 'localhost',
			database: process.env.DB_NAME || 'guess-number',
			password: process.env.DB_PASSWORD || '',
			port: Number(process.env.DB_PORT) || 5432,
		})

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok' })
})

app.get('/api/db-check', async (_req, res) => {
	try {
		const result = await pool.query('SELECT NOW() as time')
		res.json({
			db: 'ok',
			time: result.rows[0].time,
			database_url_set: !!process.env.DATABASE_URL,
		})
	} catch (err) {
		res
			.status(500)
			.json({
				db: 'error',
				message: err.message,
				database_url_set: !!process.env.DATABASE_URL,
			})
	}
})

app.get('/api/highscores', async (_req, res) => {
	try {
		const result = await pool.query(`
      SELECT
        gr.id,
        p.username  AS name,
        gr.attempts,
        gr.played_at AS date
      FROM game_results gr
      JOIN players p ON p.id = gr.player_id
      ORDER BY gr.attempts ASC, gr.played_at ASC
      LIMIT 10
    `)
		res.json(result.rows)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Database error' })
	}
})

app.post('/api/highscores', async (req, res) => {
	const { name, attempts } = req.body

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		return res.status(400).json({ error: 'name is required' })
	}
	if (!Number.isInteger(attempts) || attempts < 1) {
		return res
			.status(400)
			.json({ error: 'attempts must be a positive integer' })
	}

	const username = name.trim()

	try {
		await pool.query(
			`INSERT INTO players (username) VALUES ($1) ON CONFLICT (username) DO NOTHING`,
			[username],
		)
		const playerResult = await pool.query(
			`SELECT id FROM players WHERE username = $1`,
			[username],
		)
		const playerId = playerResult.rows[0].id

		const insertResult = await pool.query(
			`INSERT INTO game_results (player_id, attempts) VALUES ($1, $2) RETURNING id, attempts, played_at`,
			[playerId, attempts],
		)

		res.status(201).json({
			id: insertResult.rows[0].id,
			name: username,
			attempts: insertResult.rows[0].attempts,
			date: insertResult.rows[0].played_at,
		})
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Database error' })
	}
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
	console.log(`Backend läuft auf http://localhost:${PORT}`)
})
