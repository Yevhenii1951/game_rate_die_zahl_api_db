// src/utils/storage.ts
// In dev: Vite proxies /api → http://localhost:3001
// In prod: Use VITE_API_URL environment variable
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export type Highscore = {
	id?: number
	name: string
	attempts: number
	date?: string
}

/** Lädt Top-10 Highscores vom Backend */
export async function loadHighscores(): Promise<Highscore[]> {
	const res = await fetch(`${API_BASE}/highscores`)
	if (!res.ok) throw new Error('Fehler beim Laden der Highscores')
	return res.json()
}

/** Speichert ein neues Ergebnis im Backend */
export async function saveHighscore(
	name: string,
	attempts: number,
): Promise<Highscore> {
	const res = await fetch(`${API_BASE}/highscores`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, attempts }),
	})
	if (!res.ok) throw new Error('Fehler beim Speichern des Ergebnisses')
	return res.json()
}
