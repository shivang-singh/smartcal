/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    '@csstools/postcss-global-data': {
      files: ['./app/globals.css'],
    },
    'postcss-custom-media': {},
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
