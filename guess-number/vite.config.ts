import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	// base: './', (- for workflow and render)
	base: './', // Use relative paths for assets
	plugins: [react()],
	server: {
		proxy: {
			// Alle /api/* Anfragen werden an den Express-Backend weitergeleitet
			'/api': 'http://localhost:3001',
		},
	},
})
