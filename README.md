<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/tidtulabs/tidtu/">
    <img src=".github/images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">TIDTU</h3>

  <p align="center">
    Tra cứu thông tin lịch thi Đại học Duy Tân
    <br />
    <a href="https://tidtu.pages.dev"><strong>🌐 Xem Live »</strong></a>
    <br />
    <br />
    <a href="https://github.com/tidtulabs/tidtu/issues/new?labels=bug">Report Bug</a>
    ·
    <a href="https://github.com/tidtulabs/tidtu/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
        <li><a href="#monorepo-structure">Monorepo Structure</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started-with-developer">Getting Started With Developer</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#environment-variables">Environment Variables</a></li>
        <li><a href="#running-locally">Running Locally</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

---

<!-- ABOUT THE PROJECT -->
## About The Project
[![TIDTU Screenshot](https://github.com/user-attachments/assets/c5e9f2c6-f17e-42b2-a50a-9f5a376e057f)](https://tidtu.pages.dev)
**TIDTU** là ứng dụng web giúp sinh viên Đại học Duy Tân lịch thi. Dự án được xây dựng theo kiến trúc monorepo với Turborepo, gồm frontend Vue 3 và các Cloudflare Workers phục vụ backend.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![Vue.js][Vue.js]][Vue-url]
* [![Vite][Vite]][Vite-url]
* [![TailwindCSS][TailwindCSS]][Tailwind-url]
* [![Hono][Hono]][Hono-url]
* [![Cheerio.js][Cheerio.js]][Cheerio-url]
* [![Cloudflare][Cloudflare]][Cloudflare-url]
* [![Turborepo][Turborepo]][Turborepo-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Monorepo Structure

```
tidtu/
├── apps/
│   ├── website/          # Frontend — Vue 3 + Vite + TailwindCSS
│   ├── worker-cache/     # Cache service — Express + Cheerio + Cloudflare KV
│   ├── worker-gateway/   # API Gateway — Hono trên Cloudflare Workers
│   └── worker-pdaotao/   # Scraper Worker — Cloudflare Workers
└── packages/             # Shared packages (reserved)
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- GETTING STARTED -->
## Getting Started With Developer

### Prerequisites

* **Node.js** >= 18
* [pnpm][Pnpm-install] >= 9 (recommended)

  ```sh
  npm install -g pnpm
  ```

* **Wrangler CLI** (để phát triển Cloudflare Workers)

  ```sh
  pnpm add -g wrangler
  ```

### Installation

1. Clone the repo

   ```sh
   git clone https://github.com/tidtulabs/tidtu.git
   cd tidtu
   ```

2. Install all dependencies (từ root của monorepo)

   ```sh
   pnpm install
   ```

3. Change git remote url to avoid accidental pushes to base project

   ```sh
   git remote set-url origin github_username/repo_name
   git remote -v # confirm the changes
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Environment Variables

Mỗi app có file `.env.example` / `.dev.vars.example` riêng. Cần copy và điền giá trị thật trước khi chạy.

#### `apps/website`

```sh
cp apps/website/.env.example apps/website/.env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_GATEWAY_SERVICE` | `http://localhost:3001` | URL tới worker-gateway (local) |
| `VITE_CACHE_SERVICE` | `http://localhost:3000` | URL tới worker-cache (local) |

#### `apps/worker-gateway`

```sh
cp apps/worker-gateway/.dev.vars.example apps/worker-gateway/.dev.vars
```

| Variable | Description |
|---|---|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL (để nhận notification) |

> [!NOTE]
> Với môi trường production, secrets được set qua `wrangler secret put <NAME>` thay vì file `.dev.vars`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Running Locally

#### Chạy toàn bộ monorepo (recommended)

Lệnh này khởi động đồng thời tất cả apps (website + workers):

```sh
pnpm dev
```

> [!TIP]
> `pnpm dev` tự động kill các port đang dùng (`5173`, `3000`, `3001`) trước khi khởi động lại.

#### Chạy từng app riêng lẻ

| App | Command | Port |
|---|---|---|
| `website` | `pnpm --filter website dev` | `5173` |
| `worker-cache` | `pnpm --filter worker-cache dev` | `3000` |
| `worker-gateway` | `pnpm --filter worker-gateway dev` | `3001` |

#### Chạy với remote Workers (staging)

```sh
pnpm dev:remote
```

#### Build production

```sh
pnpm build
```

#### Lint & Format

```sh
pnpm lint
pnpm format
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- ROADMAP -->
## Roadmap

- [x] Tra cứu lịch thi
- [x] Cloudflare Workers API Gateway
- [x] Cache với Cloudflare KV
- [ ] Thông báo có đã có lịch
- [ ] Multi-language Support
    - [ ] English

Xem [open issues](https://github.com/tidtulabs/tidtu/issues) để biết thêm các tính năng đang đề xuất và lỗi đã biết.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

### Top contributors:

<a href="https://github.com/tidtulabs/tidtu/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tidtulabs/tidtu" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- MARKDOWN LINKS & IMAGES -->
[product-screenshot]: images/screenshot.png

[Vue.js]: https://img.shields.io/badge/Vue%203-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white&color=black
[Vue-url]: https://vuejs.org/

[Vite]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=646CFF&color=black
[Vite-url]: https://vite.dev/

[TailwindCSS]: https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4&color=black
[Tailwind-url]: https://tailwindcss.com/

[Hono]: https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=E36002&color=black
[Hono-url]: https://hono.dev/

[Cheerio.js]: https://img.shields.io/badge/Cheerio-E88C1F?style=for-the-badge&logo=cheerio&logoColor=E88C1F&color=black
[Cheerio-url]: https://cheerio.js.org/

[Cloudflare]: https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=F38020&color=black
[Cloudflare-url]: https://workers.cloudflare.com/

[Turborepo]: https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=EF4444&color=black
[Turborepo-url]: https://turbo.build/repo

[Pnpm-install]: https://pnpm.io/installation
