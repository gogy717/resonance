import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 允许通过 127.0.0.1 访问开发资源（HMR / _next chunk），
  // 否则用 127.0.0.1:3000 打开时客户端 JS 会被拦、页面无法水合。
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
