//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // pra testar de celular na mesma rede local em dev
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
};

module.exports = nextConfig;
