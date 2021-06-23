const isDev = !!process.env.DEV;

module.exports = {
	'reporter': isDev ? ['html'] : ['cobertura'],
	'report-dir': './tests/.artifacts/coverage',
	'temp-dir': './tests/.artifacts/.nyc_output',
}