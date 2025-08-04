# Custom Contentful TinyMCE App

## Getting Started

This will only run inside the Contentful app framework.

### Update env variables and constants

TODO use public envs to avoid public envs

```bash
yarn dev
```

## Building

Builds the app then replaces relative paths (Next.js default) to absolute urls

TODO rebuild app with vite instead to avoid manual path updates (also much faster build time)

```bash
yarn build
. ./force_absolute_paths.sh
```

Then copy the `out` folder into the file drop in the app configuration page in Contentful.
