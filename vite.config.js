import { defineConfig } from 'vite'
import postCssNested from 'postcss-nested'
import customMedia from 'postcss-custom-media'

export default defineConfig({
	css: {
		postcss: {
			plugins: [postCssNested, customMedia],
		},
	},
})
