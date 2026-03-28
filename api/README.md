<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Project Update - 2026-02-24

- Seed pipeline updated to support full marketplace taxonomy (`agroline`, `autoline`, `machineryline`) with subcategory trees and leaf template generation.
- Seed cleanup hardened with guarded delete handling to prevent cleanup-stage blockers from failing `seed:all`.
- Verification snapshot:
  - `pnpm run seed:all` passing
  - `pnpm run seed:verify` passing
  - `pnpm run test` passing
  - `pnpm run test:security` passing
  - `pnpm run build` passing.

## Project Update - 2026-03-05

- Listing moderation/draft validation was aligned with the "important-only" required policy for dynamic attributes:
  - required dynamic keys enforced in validation: `brand`, `model`, `year_of_manufacture_year` (and `year` alias), `condition`.
- Submit-for-moderation contact validation was hardened:
  - now requires at least one contact channel (email or phone), checking both direct listing fields and linked seller contact relation.
- Motorized template defaults now support future validity years for technical inspection:
  - `technical_inspection_year` switched to a future-inclusive year set (`current year + 15`).

### Verification snapshot (2026-03-05)
- `pnpm run test` passing
- `pnpm run test:security` passing
- `pnpm run test:e2e` passing
- build-equivalent compile flow passing:
  - `DATABASE_URL=postgresql://dummy pnpm exec prisma generate && pnpm exec nest build`

## Project Update - 2026-03-28

- Updated seed/runtime marketplace behavior:
  - moved `Transportation machinery` from Agro market to Auto market
  - refreshed local seed data to match the visible marketplace taxonomy.
- Simplified listing publication workflow:
  - new listings now publish directly as `ACTIVE`
  - submit/resubmit paths activate listings immediately.
- Fixed admin category deletion:
  - subtree delete now clears dependent template and brand-category links
  - deletion is blocked only when listings still exist in that subtree.
- Updated inquiry routing:
  - listing inquiry conversations now resolve to Alcor admin first (`admin@alcor.com`)
  - first-message inquiries generate `NEW_MESSAGE` notifications for admin
  - messages, conversations, and notifications remain persisted in PostgreSQL.
- Template wording updates:
  - `Runs and drives` -> `Drives`
  - `Condition` -> `Стан`.

### Local runtime note
- API dev server: `http://localhost:3000`
- OpenSearch still requires `OPENSEARCH_INITIAL_ADMIN_PASSWORD` in `docker-compose.yml` for a clean local start.
- full branch status: `REBUILD_CHANGELOG.md` and `docs/project_status.md`
