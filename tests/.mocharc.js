const path = require("path");

const isDev = !!process.env.DEV;
module.exports = {
	spec: './tests/**/*.spec.ts',
	require: [path.resolve('./tests/ts-hook.js'), 'source-map-support/register'],
	reporter: '@netatwork/mocha-utils/dist/JunitSpecReporter.js',
	reporterOptions: {
		mochaFile: './tests/.artifacts/results.xml'
	},
	...(isDev ? { watch: true, 'watch-files': './**/*.ts' } : {})
};