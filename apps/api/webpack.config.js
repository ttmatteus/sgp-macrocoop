const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  externals: [
    { argon2: 'commonjs argon2' },
    // @nestjs/microservices importa todos os transportes (grpc, kafka, mqtt...)
    // mesmo so usando RMQ. sem isso o webpack tenta empacotar tudo
    { '@grpc/grpc-js': 'commonjs @grpc/grpc-js' },
    { '@grpc/proto-loader': 'commonjs @grpc/proto-loader' },
    { '@nestjs/websockets/socket-module': 'commonjs @nestjs/websockets/socket-module' },
    { ioredis: 'commonjs ioredis' },
    { kafkajs: 'commonjs kafkajs' },
    { mqtt: 'commonjs mqtt' },
    { nats: 'commonjs nats' },
  ],
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
      mergeExternals: true,
    }),
  ],
};
