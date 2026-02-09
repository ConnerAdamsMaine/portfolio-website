module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		es2022: true
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2022,
		extraFileExtensions: ['.svelte']
	},
	plugins: ['@typescript-eslint', 'svelte'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:svelte/recommended',
		'prettier'
	],
	ignorePatterns: ['node_modules/', '.svelte-kit/', 'build/', 'cms/', 'data/', 'error.log'],
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		}
	]
};
