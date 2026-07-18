# Project Setup Auth DB 运行逻辑 Walkthrough

这份 walkthrough 按程序真实运行顺序走一遍：从你执行命令，到浏览器请求进入 Next.js，再到 Clerk auth、多租户组织选择、页面渲染、数据库查询。每一步都对应当前 codebase 的文件和行号。

对应的主要提交是：

- `cd3c8b4 Initial commit from Create Next App`
- `c9e8908 01projectsetup auth&database`
- `3264333 Remove CLAUDE.md and AGENTS.md from version control`

其中 `c9e8908` 是这节课的核心提交。

## 0. 先看这节课加了哪些东西

`c9e8908 01projectsetup auth&database` 覆盖了这些类别：

1. 项目依赖和脚本
   - `package.json`
   - `package-lock.json`

2. shadcn/ui 设计系统
   - `components.json`
   - `src/app/globals.css`
   - `src/lib/utils.ts`
   - `src/components/ui/*`
   - `src/hooks/use-mobile.ts`

3. 全局 App shell
   - `src/app/layout.tsx`
   - `src/app/page.tsx`

4. Clerk auth 和 organization flow
   - `src/proxy.ts`
   - `src/app/sign-in/[[...sign-in]]/page.tsx`
   - `src/app/sign-up/[[...sign-up]]/page.tsx`
   - `src/app/org-selection/page.tsx`

5. Prisma/Postgres 数据库
   - `prisma.config.ts`
   - `prisma/schema.prisma`
   - `prisma/migrations/20260705051701_init/migration.sql`
   - `prisma/migrations/migration_lock.toml`
   - `src/lib/env.ts`
   - `src/lib/db.ts`
   - `src/app/test/page.tsx`

6. 部署/平台配置
   - `prisma.compute.ts`
   - `.gitignore`
   - `next.config.ts`
   - `eslint.config.mjs`

7. 本地 IDE / agent 相关文件
   - `.idea/*`
   - `AGENTS.md`
   - `CLAUDE.md`

后来的 `3264333` 把 `AGENTS.md` 和 `CLAUDE.md` 从版本控制中移除，并把它们加入 `.gitignore`。这属于仓库卫生清理，不影响应用运行。

## 1. 从命令开始：`npm run dev`

入口在 `package.json`：

- `package.json:5-10`

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

当你运行：

```bash
npm run dev
```

实际执行的是：

```bash
next dev
```

这会启动 Next.js dev server。Next 会读取：

- `src/app/layout.tsx` 作为根布局
- `src/app/page.tsx` 作为 `/`
- `src/proxy.ts` 作为请求进入页面前的拦截层
- `src/app/**/page.tsx` 作为 App Router 页面

这节课新增的依赖主要在 `package.json:11-56`：

- `@clerk/nextjs`：认证、用户、组织
- `@prisma/client`：Prisma runtime client
- `@prisma/adapter-pg`：Prisma 连接 Postgres 的 adapter
- `@t3-oss/env-nextjs` 和 `zod`：环境变量校验
- `sonner`：toast
- `class-variance-authority`、`clsx`、`tailwind-merge`、`lucide-react`、`radix-ui`：shadcn/ui 基础依赖

注意：当前 `package.json` 还没有课程后半段提到的：

```json
"postinstall": "prisma generate"
```

因为 `src/generated/prisma` 被 gitignore，如果部署环境没有生成 Prisma Client，构建可能失败。

## 2. 请求进入应用：先经过 `src/proxy.ts`

当浏览器访问：

```text
http://localhost:3000/
```

请求不是直接进入 `src/app/page.tsx`。它先经过：

- `src/proxy.ts:34-43`

```ts
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js...)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
```

这段 matcher 决定哪些请求要被 proxy 处理。

它的作用：

- 跳过 `_next` 和静态资源，例如 js、css、图片、字体。
- API routes 和 trpc routes 总是经过 proxy。
- Clerk 自己的 frontend API routes 也经过 proxy。

为什么要跳过静态资源：

- 图片、字体、构建产物不需要认证。
- 如果每个静态文件都走 auth，会浪费性能，也可能导致资源加载异常。

## 3. Proxy 引入 Clerk server helpers

文件开头：

- `src/proxy.ts:1-2`

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
```

这两个 Clerk helper 的角色：

- `clerkMiddleware`：把请求交给 Clerk，使你能读取当前请求的 auth 信息。
- `createRouteMatcher`：用路径规则判断当前请求属于哪类 route。

`NextResponse` 是 Next.js 提供的 response helper：

- `NextResponse.next()`：继续往后执行，让请求进入页面。
- `NextResponse.redirect()`：重定向到另一个 URL。

## 4. Proxy 定义哪些路由是公开的

- `src/proxy.ts:5`

```ts
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
```

这表示：

- `/sign-in`
- `/sign-in/...`
- `/sign-up`
- `/sign-up/...`

都是 public route。

为什么登录/注册页必须 public：

- 未登录用户也要能访问登录页。
- 如果登录页也被保护，会出现“没登录所以不能访问登录页”的死循环。

`(.*)` 是为了覆盖 Clerk 多步骤 auth flow。Clerk 登录不一定只停留在 `/sign-in`，可能还有验证码、OAuth callback、reset password 等路径。

组织选择页单独定义：

- `src/proxy.ts:7`

```ts
const isOrgSelectionRoute = createRouteMatcher(["/org-selection(.*)"]);
```

为什么不把它放进 public route：

- 组织选择应该只给已登录用户用。
- 未登录用户没有 userId，也没有组织上下文，不能选择组织。

## 5. Proxy 读取当前请求的登录态和组织态

- `src/proxy.ts:9-10`

```ts
export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
```

这里是整个认证逻辑的核心。

`userId` 表示：

- 当前请求有没有登录用户。

`orgId` 表示：

- 当前请求有没有选中的 organization。

这节课不是只做“登录才可访问”，而是做：

```text
必须登录 + 必须选择组织
```

这就是 multi-tenant app 的基础。

## 6. Proxy 第一关：public route 直接放行

- `src/proxy.ts:12-15`

```ts
if (isPublicRoute(req)) {
  return NextResponse.next();
}
```

如果请求是 `/sign-in` 或 `/sign-up`，直接放行。

之后 Next.js 会根据 URL 渲染：

- `/sign-in` -> `src/app/sign-in/[[...sign-in]]/page.tsx`
- `/sign-up` -> `src/app/sign-up/[[...sign-up]]/page.tsx`

## 7. Proxy 第二关：非 public route 必须登录

- `src/proxy.ts:17-20`

```ts
if (!userId) {
  await auth.protect();
}
```

如果当前请求没有 `userId`，说明没登录。`auth.protect()` 会让 Clerk 接管，跳转到登录流程。

运行路径示例：

```text
访问 /
-> proxy.ts
-> 不是 public route
-> 没有 userId
-> auth.protect()
-> Clerk 跳转到 /sign-in
```

为什么要在 proxy 做，而不是在页面里做：

- 覆盖所有受保护页面。
- 请求还没进页面就能拦住。
- 后面新增页面时，不用每个页面都重复写 auth check。

## 8. Proxy 第三关：组织选择页给已登录用户放行

- `src/proxy.ts:22-25`

```ts
if (isOrgSelectionRoute(req)) {
  return NextResponse.next();
}
```

注意它在 `auth.protect()` 后面。

这表示：

- 未登录用户访问 `/org-selection` 会先被 `auth.protect()` 拦住。
- 已登录用户访问 `/org-selection` 会被放行。

为什么必须放行：

- 如果用户已登录但还没有 orgId，他们正是需要这个页面来创建/选择组织。
- 如果这里不放行，下一步的 `userId && !orgId` 会不断把用户重定向回 `/org-selection`，但页面自己又无法正常进入，容易形成逻辑问题。

## 9. Proxy 第四关：普通页面必须有 orgId

- `src/proxy.ts:27-31`

```ts
if (userId && !orgId) {
  const orgSelection = new URL("/org-selection", req.url);
  return NextResponse.redirect(orgSelection);
}
```

这段表达的是：

```text
你已经登录了，但你没有选择组织，所以不能进入真正的 app。
```

为什么要强制 orgId：

- 后面所有业务数据都应该属于某个 organization。
- 这样你的 SaaS 从第一天就是 team-based。
- 即使是单人用户，也可以有一个 solo organization。

完整运行分支：

```text
访问 /
-> proxy.ts
-> 不是 /sign-in 或 /sign-up
-> 有 userId
-> 不是 /org-selection
-> 没有 orgId
-> redirect /org-selection
```

如果用户既有 `userId` 又有 `orgId`，proxy 没有返回 redirect，请求继续进入目标页面。

## 10. 进入根布局：`src/app/layout.tsx`

通过 proxy 后，Next.js 开始渲染 App Router。

根布局文件：

- `src/app/layout.tsx:1-5`

```ts
import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
```

这些 import 分别负责：

- `Metadata`：页面 title/description 类型。
- `Inter`、`Geist_Mono`：通过 Next font 加载字体。
- `globals.css`：全局 Tailwind/theme CSS。
- `Toaster`：全局 toast 容器。
- `ClerkProvider`：给整个 React tree 提供 Clerk auth context。

字体配置：

- `src/app/layout.tsx:7-15`

```ts
const inter = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-inter-mono", subsets: ["latin"] });
```

metadata：

- `src/app/layout.tsx:17-20`

```ts
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};
```

这个现在还是默认值，后面可以改成产品名。

## 11. RootLayout 真正包住页面

- `src/app/layout.tsx:22-40`

```tsx
export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
          {children}
          <Toaster></Toaster>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

这里的运行逻辑：

1. `ClerkProvider` 包住整个 app。
2. `<html>` 和 `<body>` 是 Next.js root layout 必须输出的结构。
3. `children` 是当前 URL 对应的页面。
4. `Toaster` 始终挂载在 body 里。

为什么要加 `ClerkProvider`：

- `SignIn`、`SignUp`、`UserButton`、`OrganizationSwitcher` 等 Clerk React 组件都依赖它。
- 没有 provider，组件无法正常读取 Clerk 状态。

为什么要加 `Toaster`：

- `sonner` 的 toast 需要一个全局渲染容器。
- 以后任意 client component 调用 `toast.success()` 才能显示。

## 12. 全局 CSS 如何影响所有组件

全局 CSS：

- `src/app/globals.css:1-5`

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));
```

作用：

- 引入 Tailwind v4。
- 引入动画支持。
- 引入 shadcn 的 Tailwind 样式基础。
- 定义 `.dark` class 作为 dark mode variant。

主题 token：

- `src/app/globals.css:7-48`

这里把 CSS variables 映射成 Tailwind theme token，例如：

```css
--color-background: var(--background);
--color-primary: var(--primary);
--radius-lg: var(--radius);
```

light theme：

- `src/app/globals.css:50-83`

dark theme：

- `src/app/globals.css:85-117`

基础样式：

- `src/app/globals.css:119-126`

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

这就是为什么页面里写 `bg-background`、`text-foreground` 能生效。

## 13. shadcn 配置如何告诉 CLI 文件放哪

`components.json`：

- `components.json:1-23`

重点：

- `components.json:3`：style 是 `new-york`
- `components.json:4-5`：启用 RSC 和 TSX
- `components.json:6-12`：Tailwind CSS 文件是 `src/app/globals.css`
- `components.json:13`：icon library 是 `lucide`
- `components.json:15-21`：路径别名

```json
"aliases": {
  "components": "@/components",
  "utils": "@/lib/utils",
  "ui": "@/components/ui",
  "lib": "@/lib",
  "hooks": "@/hooks"
}
```

为什么这个文件重要：

- 以后运行 `npx shadcn add xxx`，CLI 会根据这里把组件放进正确目录。
- 组件内部 import `@/lib/utils`、`@/components/ui/...` 也是根据这里生成。

## 14. `cn()` 是 shadcn 组件的 class 合并工具

`src/lib/utils.ts`：

- `src/lib/utils.ts:1-6`

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

作用：

- `clsx` 处理条件 class。
- `tailwind-merge` 处理 Tailwind 冲突。

例如：

```ts
cn("px-2", condition && "bg-red-500", "px-4")
```

最终 `px-4` 会覆盖 `px-2`。

为什么要加：

- shadcn 组件大量需要组合默认 class 和外部传入的 `className`。
- 如果不用 `twMerge`，可能出现 `px-2 px-4` 这种冲突。

## 15. Button 组件如何体现 shadcn 方法论

`src/components/ui/button.tsx` 是课程里最典型的 shadcn 组件。

导入：

- `src/components/ui/button.tsx:1-5`

```ts
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"
```

`cva` 定义组件变体：

- `src/components/ui/button.tsx:7-39`

这里定义：

- `variant`: `default`、`destructive`、`outline`、`secondary`、`ghost`、`link`
- `size`: `default`、`xs`、`sm`、`lg`、`icon` 等

真正组件：

- `src/components/ui/button.tsx:41-64`

```tsx
function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

为什么要这样写：

- `variant` 和 `size` 让按钮风格可复用。
- `className` 允许局部扩展。
- `cn()` 保证默认 class 和外部 class 合并时不冲突。
- `asChild` 让 Button 可以把样式套到其他元素上，例如 link。

这就是 shadcn 的核心思想：组件源码在你的项目里，你可以理解它、改它、扩展它。

## 16. Toaster 组件为什么是 client component

`src/components/ui/sonner.tsx`：

- `src/components/ui/sonner.tsx:1`

```tsx
"use client"
```

因为 toast、theme hook 都依赖浏览器/客户端状态。

核心逻辑：

- `src/components/ui/sonner.tsx:13-40`

```tsx
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      icons={{ ... }}
      style={{ ... }}
      {...props}
    />
  )
}
```

为什么 layout 可以 import client component：

- Server Component 可以渲染 Client Component 边界。
- `layout.tsx` 本身不用变成 client component。
- 只有 `Toaster` 这一小块在客户端运行。

## 17. 如果用户没登录：进入 SignIn 页面

访问 `/sign-in` 时：

1. 先经过 `src/proxy.ts:34-43` matcher。
2. 进入 `src/proxy.ts:9-10` 读取 auth。
3. `src/proxy.ts:13-15` 判断是 public route，放行。
4. Next 渲染 `src/app/sign-in/[[...sign-in]]/page.tsx`。

SignIn 页面：

- `src/app/sign-in/[[...sign-in]]/page.tsx:1-16`

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <SignIn appearance={{ elements: { rootBox: "mx-auto", card: "shadow-lg" } }} />
    </div>
  );
}
```

每个部分的作用：

- `SignIn`：Clerk 提供的完整登录 UI 和流程。
- 外层 `div`：负责居中和背景。
- `appearance`：给 Clerk 内部元素传样式。

为什么路径是 `[[...sign-in]]`：

- Clerk 登录流程可能有多个内部步骤。
- optional catch-all 允许 `/sign-in` 和 `/sign-in/...` 都渲染同一个 SignIn 组件。

## 18. 如果用户要注册：进入 SignUp 页面

访问 `/sign-up` 时流程类似：

1. proxy 判断 public route。
2. 放行。
3. Next 渲染注册页。

文件：

- `src/app/sign-up/[[...sign-up]]/page.tsx:1-16`

```tsx
import { SignUp } from "@clerk/nextjs";
```

它和 SignIn 页面结构一致，只是使用 `SignUp`。

为什么登录和注册分开：

- Clerk 官方组件不同。
- 两个流程可能有不同 URL、文案、OAuth callback。
- 分开后后续定制更清晰。

## 19. 如果用户登录了但没有组织：进入 Org Selection

访问 `/` 时，如果有 `userId` 但没有 `orgId`：

- `src/proxy.ts:28-30`

```ts
const orgSelection = new URL("/org-selection", req.url);
return NextResponse.redirect(orgSelection);
```

然后浏览器进入 `/org-selection`。

组织选择页：

- `src/app/org-selection/page.tsx:1-20`

核心组件：

- `src/app/org-selection/page.tsx:6-16`

```tsx
<OrganizationList
  hidePersonal
  afterCreateOrganizationUrl={"/"}
  afterSelectOrganizationUrl={"/"}
  appearance={{ ... }}
/>
```

每个 prop 的作用：

- `hidePersonal`：隐藏个人账户模式，强制用户使用组织。
- `afterCreateOrganizationUrl="/"`：创建组织后回到首页。
- `afterSelectOrganizationUrl="/"`：选择组织后回到首页。
- `appearance`：统一样式。

为什么要强制 organization：

- 后续数据都可以用 `orgId` 隔离。
- 单人用户也可以是一个 solo org。
- 以后邀请成员、权限、billing 都能挂在 org 上。

## 20. 如果用户已登录且有组织：进入首页

用户满足：

```text
userId exists
orgId exists
```

proxy 不重定向，请求进入 `/`。

首页文件：

- `src/app/page.tsx:1-15`

```tsx
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
```

渲染：

- `src/app/page.tsx:4-14`

```tsx
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-3xl font-bold">Welcome to Resonance</h1>
      <div className="flex items-center gap-4 mt-4">
        <OrganizationSwitcher />
        <UserButton />
      </div>
    </div>
  );
}
```

`OrganizationSwitcher` 的作用：

- 切换当前组织。
- 管理组织。
- 接受组织邀请。

`UserButton` 的作用：

- 打开用户菜单。
- 管理账号。
- 退出登录。

为什么这两个组件重要：

- 它们让你不用自己实现账户设置、组织切换、邀请入口。
- 这是 Clerk 作为完整 user management system 的价值。

## 21. `/test` 页面如何查询数据库

访问 `/test` 时，也先走 `src/proxy.ts`。

所以它同样要求：

- 已登录
- 已选择组织

通过后进入：

- `src/app/test/page.tsx:1-23`

第 1 行：

```ts
import { prisma } from "@/lib/db";
```

这里引入统一的 Prisma Client。

第 3 行：

```ts
export default async function TestPage() {
```

App Router 的 page 默认是 Server Component，所以可以是 async。

第 4 行：

```ts
const voices = await prisma.voice.findMany();
```

这行在服务端查询数据库。

第 6-21 行把查询结果渲染成 HTML。

为什么这是安全的：

- Prisma 查询在服务端执行。
- 浏览器只收到渲染后的页面，不会拿到 `DATABASE_URL`。

但要注意：

- 这是测试页，所以 `findMany()` 没有加 `orgId` 过滤。
- 真实业务页面应该按 `orgId` 限制数据范围。

## 22. `/test` 触发 `src/lib/db.ts`

`src/app/test/page.tsx:1` import `prisma` 后，会执行：

- `src/lib/db.ts:1-16`

第 1 行：

```ts
import { PrismaClient } from "@/generated/prisma/client";
```

这个 client 不是手写的，是 `prisma generate` 根据 `prisma/schema.prisma` 生成的。

第 2 行：

```ts
import { PrismaPg } from "@prisma/adapter-pg";
```

这是 Prisma 连接 Postgres 的 adapter。

第 4 行：

```ts
import { env } from "./env";
```

不用 `process.env.DATABASE_URL`，而是从经过校验的 `env` 里拿。

第 6-8 行：

```ts
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
})
```

这里创建数据库连接 adapter。

第 10-14 行：

```ts
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

这是 Next.js + Prisma 常见 singleton pattern。

为什么要这样写：

- Next.js dev server 会 hot reload。
- 如果每次 reload 都 `new PrismaClient()`，会不断创建连接。
- 连接太多会导致数据库 connection pool exhaustion。
- 把实例挂在 `global` 上，开发环境热更新后可以复用。

第 16 行：

```ts
export { prisma };
```

以后所有数据库查询都应该从这里 import，不要到处 new PrismaClient。

## 23. `src/lib/env.ts` 如何提前发现环境变量问题

`src/lib/db.ts:4` import `env`，会执行：

- `src/lib/env.ts:1-10`

第 1-2 行：

```ts
import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";
```

`zod` 定义规则，`createEnv` 把规则应用到环境变量。

第 4-10 行：

```ts
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
  },
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

作用：

- 要求 `DATABASE_URL` 必须存在且非空。
- 如果 `.env` 没有 `DATABASE_URL`，dev server 会尽早报错。
- `SKIP_ENV_VALIDATION` 用于某些部署构建阶段跳过校验。

为什么要加它：

- 避免写错 `process.env.DATABSE_URL` 这种 TypeScript 不报错的问题。
- 避免数据库代码运行到很深才发现 env 缺失。

## 24. Prisma schema 是类型和数据库结构的源头

Prisma schema：

- `prisma/schema.prisma:1-77`

client generator：

- `prisma/schema.prisma:6-9`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

这表示生成的 Prisma Client 放到：

```text
src/generated/prisma
```

datasource：

- `prisma/schema.prisma:11-13`

```prisma
datasource db {
  provider = "postgresql"
}
```

这里声明数据库类型是 Postgres。实际 URL 在 `prisma.config.ts` 里读取。

## 25. VoiceVariant 和 VoiceCategory 为什么用 enum

- `prisma/schema.prisma:15-33`

```prisma
enum VoiceVariant {
  SYSTEM
  CUSTOM
}
```

`VoiceVariant` 表达声音来源：

- `SYSTEM`：平台内置声音。
- `CUSTOM`：组织自定义声音。

`VoiceCategory` 表达声音分类：

- audiobook
- conversational
- customer service
- podcast
- advertising
- 等等

为什么用 enum：

- 避免数据库里出现拼写不一致，例如 `podcast`、`Podcast`、`POD_CAST`。
- Prisma Client 会生成类型，代码里可自动补全。

## 26. Voice 模型如何表达系统声音和组织声音

- `prisma/schema.prisma:35-54`

关键字段：

- `id`：`prisma/schema.prisma:36`
- `orgId`：`prisma/schema.prisma:38`
- `name`、`description`：`prisma/schema.prisma:40-41`
- `category`、`language`、`variant`：`prisma/schema.prisma:42-44`
- `r2ObjectKey`：`prisma/schema.prisma:45`
- `generations` relation：`prisma/schema.prisma:47`
- timestamps：`prisma/schema.prisma:49-50`
- indexes：`prisma/schema.prisma:52-53`

为什么 `orgId` 可选：

```prisma
orgId String?
```

因为系统内置 voice 不属于某个组织。

设计含义：

```text
orgId = null  -> system voice
orgId = value -> custom voice owned by org
```

为什么有 `variant`：

- `orgId` 表达 ownership。
- `variant` 表达业务类型。
- 两者结合让查询和 UI 判断更清楚。

为什么给 `variant` 和 `orgId` 建索引：

- 后面常见查询会是“找全部 system voices”。
- 或者“找某个 org 的 custom voices”。
- index 可以提高这类查询性能。

## 27. Generation 模型如何表达一次 TTS 生成

- `prisma/schema.prisma:56-77`

关键字段：

- `id`：`prisma/schema.prisma:57`
- `orgId`：`prisma/schema.prisma:58`
- `voiceId`：`prisma/schema.prisma:60`
- `voice` relation：`prisma/schema.prisma:61`
- `voiceName`：`prisma/schema.prisma:63`
- `text`：`prisma/schema.prisma:64`
- `r2ObjectKey`：`prisma/schema.prisma:65`
- AI 参数：`prisma/schema.prisma:67-70`
- timestamps：`prisma/schema.prisma:72-73`
- indexes：`prisma/schema.prisma:75-76`

为什么 `orgId` 必填：

- 一次生成必须属于某个组织。
- 这是 multi-tenancy 的数据边界。

为什么 `voiceId` 可选：

```prisma
voiceId String?
voice Voice? @relation(..., onDelete: SetNull)
```

因为 voice 以后可能被删除。

为什么 `onDelete: SetNull`：

- 删除 voice 后，不删除 generation 历史。
- 只把 `voiceId` 置空。

为什么还要 `voiceName`：

- 即使 voice 被删除，历史记录仍能显示“当时使用的声音名字”。
- 这是历史记录/审计系统常见的快照字段。

为什么 `r2ObjectKey` 可选：

- generation 记录可以先创建。
- 音频生成和上传可能稍后完成。
- 上传完成后再写入 R2 object key。

## 28. Migration 是 Prisma schema 落到数据库的结果

Migration 文件：

- `prisma/migrations/20260705051701_init/migration.sql:1-54`

它把 schema 变成 SQL：

- 创建 enum：`migration.sql:1-5`
- 创建 `Voice` 表：`migration.sql:7-21`
- 创建 `Generation` 表：`migration.sql:23-39`
- 创建 indexes：`migration.sql:41-51`
- 创建 foreign key：`migration.sql:53-54`

关键 SQL：

```sql
FOREIGN KEY ("voiceId") REFERENCES "Voice"("id") ON DELETE SET NULL
```

这对应 schema 里的：

```prisma
onDelete: SetNull
```

为什么 migration 要提交：

- 它是数据库变更历史。
- 其他机器/部署环境需要靠 migration 重放数据库结构。

为什么 generated client 不提交：

- 它可以根据 `schema.prisma` 重新生成。
- 当前 `.gitignore` 已经忽略 `/src/generated/prisma`。

## 29. Prisma 配置文件如何找到 schema 和 DATABASE_URL

`prisma.config.ts`：

- `prisma.config.ts:1-14`

关键部分：

- `prisma.config.ts:6-13`

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

当你运行：

```bash
npx prisma migrate dev
npx prisma generate
```

Prisma 会根据这个文件知道：

- schema 在 `prisma/schema.prisma`
- migration 放在 `prisma/migrations`
- 数据库连接字符串来自 `DATABASE_URL`

## 30. `use-mobile` 为什么把 breakpoint 改成 1024

`src/hooks/use-mobile.ts`：

- `src/hooks/use-mobile.ts:1-19`

关键行：

- `src/hooks/use-mobile.ts:3`

```ts
const MOBILE_BREAKPOINT = 1024
```

这个 hook 的运行逻辑：

- `src/hooks/use-mobile.ts:6`：保存 `isMobile` state。
- `src/hooks/use-mobile.ts:8-16`：浏览器里监听 media query。
- `src/hooks/use-mobile.ts:18`：返回 boolean。

为什么是 client hook：

- 它用到了 `window.matchMedia` 和 `window.innerWidth`。
- 只能在浏览器环境运行。

为什么改到 1024：

- 课程后续 UI 可能把 tablet 以下都当 mobile layout。
- 这不是技术必须，是产品设计 breakpoint 决策。

## 31. `src/components/ui/*` 全套组件在运行中是什么角色

`c9e8908` 添加了大量 `src/components/ui/*` 文件。

它们不是当前首页全部都用到了，但它们构成后续开发的 UI 基础设施。

当前已经直接参与运行的：

- `src/components/ui/sonner.tsx`：被 `src/app/layout.tsx:4` import，并在 `src/app/layout.tsx:34` 渲染。
- `src/components/ui/button.tsx`：课程中用来测试 shadcn，当前首页已不直接使用，但它代表 shadcn variant 模式。

后续会用到的组件类别：

- form/input/select/textarea/checkbox/radio：表单输入
- dialog/sheet/drawer/popover/dropdown-menu/tooltip：浮层交互
- table/card/badge/tabs/sidebar/navigation-menu：dashboard UI
- skeleton/progress/spinner/empty：加载和空状态
- chart/calendar/carousel/pagination：复杂展示

为什么课程一次性 add all：

- 教程后面不需要反复停下来安装组件。
- AI agent 能直接读取本地组件源码。
- 但真实项目中也可以按需添加，维护面更小。

## 32. `.gitignore` 和 secret/generated 文件

这节课还修改了 `.gitignore`，核心目的：

- 不提交 `.env*`
- 不提交 `.clerk/`
- 不提交 `.next/`
- 不提交 generated Prisma client

这很重要，因为：

- `.env` 里有 Clerk secret 和 DATABASE_URL。
- `.clerk/` 可能包含 keyless mode 配置。
- `src/generated/prisma` 是生成产物。

你之前贴过包含 secret 的日志。只要这些内容离开本地私密环境，就应该旋转 Clerk secret 和数据库凭据。

## 33. 整体运行路径：未登录用户访问 `/`

```text
npm run dev
-> package.json:5-10
-> next dev starts
-> browser GET /
-> src/proxy.ts:34-43 matcher decides proxy runs
-> src/proxy.ts:9-10 reads userId/orgId
-> src/proxy.ts:13-15 not public, continue
-> src/proxy.ts:18-20 no userId, auth.protect()
-> Clerk redirects to /sign-in
-> src/proxy.ts:13-15 allows public route
-> src/app/layout.tsx:28-37 wraps app in ClerkProvider
-> src/app/sign-in/[[...sign-in]]/page.tsx:5-13 renders <SignIn />
```

## 34. 整体运行路径：已登录但没组织访问 `/`

```text
browser GET /
-> src/proxy.ts:9-10 reads userId yes, orgId no
-> src/proxy.ts:13-15 not public
-> src/proxy.ts:18-20 userId exists, pass
-> src/proxy.ts:23-25 not org-selection
-> src/proxy.ts:28-30 redirect /org-selection
-> browser GET /org-selection
-> src/proxy.ts:23-25 allows org-selection
-> src/app/layout.tsx:28-37 wraps app
-> src/app/org-selection/page.tsx:6-16 renders <OrganizationList />
-> user creates/selects org
-> afterCreateOrganizationUrl/afterSelectOrganizationUrl sends user to /
```

## 35. 整体运行路径：已登录且有组织访问 `/`

```text
browser GET /
-> src/proxy.ts:9-10 reads userId yes, orgId yes
-> src/proxy.ts:13-15 not public
-> src/proxy.ts:18-20 passes auth
-> src/proxy.ts:23-25 not org-selection
-> src/proxy.ts:28-31 no redirect
-> Next renders app
-> src/app/layout.tsx:28-37 wraps page
-> src/app/page.tsx:4-14 renders home
-> src/app/page.tsx:9 renders OrganizationSwitcher
-> src/app/page.tsx:10 renders UserButton
```

## 36. 整体运行路径：访问 `/test` 查询数据库

```text
browser GET /test
-> src/proxy.ts auth/org checks
-> pass
-> src/app/layout.tsx wraps page
-> src/app/test/page.tsx:1 imports prisma
-> src/lib/db.ts:4 imports env
-> src/lib/env.ts:4-10 validates DATABASE_URL
-> src/lib/db.ts:6-8 creates PrismaPg adapter
-> src/lib/db.ts:10-14 creates/reuses PrismaClient singleton
-> src/app/test/page.tsx:4 prisma.voice.findMany()
-> Prisma generated client uses schema types
-> Postgres returns Voice rows
-> src/app/test/page.tsx:7-18 renders list
```

## 37. 这套代码为什么鲁棒

它的鲁棒性来自几个边界：

1. 请求边界
   - `src/proxy.ts` 在页面渲染前保护路由。

2. 用户边界
   - `ClerkProvider` 和 Clerk components 管理用户会话。

3. 租户边界
   - `orgId` 是进入 app 和查询业务数据的核心条件。

4. 数据边界
   - `prisma/schema.prisma` 集中描述模型。
   - migration 记录数据库历史。

5. 配置边界
   - `src/lib/env.ts` 提前验证 `DATABASE_URL`。

6. 连接边界
   - `src/lib/db.ts` 避免开发环境重复创建 PrismaClient。

7. UI 边界
   - shadcn 组件放在 `src/components/ui/`，基础 UI 和业务逻辑分离。

## 38. 你复习时应该怎么走

建议你按这个顺序手动打开文件：

1. `package.json:5-10`
   - 理解命令如何启动 Next。

2. `src/proxy.ts:1-43`
   - 理解请求为什么先被 auth gate 拦截。

3. `src/app/layout.tsx:1-40`
   - 理解全局 provider 和 children。

4. `src/app/sign-in/[[...sign-in]]/page.tsx:1-16`
   - 理解 Clerk 登录页。

5. `src/app/org-selection/page.tsx:1-20`
   - 理解 organization-first 设计。

6. `src/app/page.tsx:1-15`
   - 理解登录后首页依赖 Clerk 用户/组织组件。

7. `src/app/test/page.tsx:1-23`
   - 理解 Server Component 直接查询数据库。

8. `src/lib/env.ts:1-10`
   - 理解 env validation。

9. `src/lib/db.ts:1-16`
   - 理解 Prisma singleton。

10. `prisma/schema.prisma:1-77`
   - 理解数据库模型。

11. `prisma/migrations/20260705051701_init/migration.sql:1-54`
   - 理解 schema 如何变成 SQL。

12. `src/components/ui/button.tsx:1-64`
   - 理解 shadcn 组件的 variant 模式。

13. `src/lib/utils.ts:1-6`
   - 理解 class 合并工具。

## 39. 最短心智模型

```text
browser request
-> proxy checks auth and org
-> layout provides Clerk + toast + global styles
-> page renders Clerk/user/org/database UI
-> database access goes through env.ts + db.ts
-> Prisma schema defines generated client and migrations
```

这就是当前程序的运行逻辑。

如果你以后加新功能，应该优先问：

- 这个页面是否需要登录？
- 这个数据是否必须属于 org？
- 查询是否用了当前 orgId？
- 组件是 server 还是 client？
- 数据库访问是否统一从 `src/lib/db.ts` 走？
- 新 env 是否加入 `src/lib/env.ts`？
- schema 变化是否生成 migration？
