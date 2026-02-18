// src/App.tsx
import { useEffect, useState } from 'react'
import { GameView } from './components/GameView'
import { HighscoreList } from './components/HighscoreList'
import { WinView } from './components/WinView'
import { loadHighscores, saveHighscore, type Highscore } from './utils/storage'

// Generator für Zufallszahl von min bis max einschließlich
function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

const MIN = 1
const MAX = 20

export default function App() {
	// 1) Geheime Zahl
	const [secretNumber, setSecretNumber] = useState<number>(() =>
		randomInt(MIN, MAX),
	)

	// 2) Spielstatus
	const [guess, setGuess] = useState<string>('')
	const [attempts, setAttempts] = useState<number>(0)
	const [message, setMessage] = useState<string>('')

	// 3) Gewinn
	const [isWon, setIsWon] = useState<boolean>(false)

	// 4) Highscore
	const [playerName, setPlayerName] = useState<string>('')
	const [highscores, setHighscores] = useState<Highscore[]>([])

	// Nachricht auf dem Gewinnbildschirm (z.B. "Geben Sie Ihren Namen ein")
	const [winMessage, setWinMessage] = useState<string>('')

	// Laden Sie Highscores einmal beim Start
	useEffect(() => {
		loadHighscores()
			.then(setHighscores)
			.catch(() => setHighscores([]))
	}, [])

	function handleSubmitGuess() {
		// String in Zahl umwandeln
		const numberGuess = Number(guess)

		// Überprüfung: Ist dies eine Zahl und zwischen 1..20?
		if (
			!Number.isInteger(numberGuess) ||
			numberGuess < MIN ||
			numberGuess > MAX
		) {
			setMessage(`Bitte gib eine ganze Zahl von ${MIN} bis ${MAX} ein.`)
			return
		}

		// Dies ist ein gültiger Versuch → Zähler erhöhen
		setAttempts(prev => prev + 1)

		// Vergleich mit dem Geheimnis
		if (numberGuess > secretNumber) {
			setMessage('Zu groß')
			return
		}
		if (numberGuess < secretNumber) {
			setMessage('Zu klein')
			return
		}

		// Richtig geraten
		setMessage('Gewonnen!')
		setIsWon(true)
		setWinMessage('')
	}

	async function handleSaveScore() {
		const name = playerName.trim()

		if (name.length === 0) {
			setWinMessage('Bitte gib deinen Namen ein.')
			return
		}

		try {
			await saveHighscore(name, attempts)
			// Highscores neu laden (Top-10 kommt vom Server, bereits sortiert)
			const updated = await loadHighscores()
			setHighscores(updated)
			setWinMessage('Gespeichert ✅')
		} catch {
			setWinMessage('Fehler beim Speichern ❌')
		}
	}

	function handleNewGame() {
		setSecretNumber(randomInt(MIN, MAX))
		setGuess('')
		setAttempts(0)
		setMessage('')
		setIsWon(false)
		setPlayerName('')
		setWinMessage('')
	}

	// Render
	return (
		<div>
			{!isWon ? (
				<GameView
					attempts={attempts}
					guess={guess}
					message={message}
					onGuessChange={setGuess}
					onSubmit={handleSubmitGuess}
				/>
			) : (
				<WinView
					attempts={attempts}
					secretNumber={secretNumber}
					playerName={playerName}
					onNameChange={setPlayerName}
					onSave={handleSaveScore}
					onNewGame={handleNewGame}
					message={winMessage}
				/>
			)}

			{/* Highscore-Tabelle immer anzeigen */}
			<HighscoreList highscores={highscores} />

			{/* Schaltfläche zum Neuladen der Highscores */}
			<div style={{ textAlign: 'center', marginBottom: 24 }}>
				<button
					onClick={async () => {
						console.log('Button clicked, loading highscores...')
						try {
							const scores = await loadHighscores()
							console.log('Loaded highscores:', scores)
							setHighscores(scores)
						} catch (err) {
							console.error('Error loading highscores:', err)
						}
					}}
					style={{ padding: '10px 16px', cursor: 'pointer' }}
				>
					Highscores neu laden
				</button>
			</div>
		</div>
	)
}
