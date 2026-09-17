# Vendored from upstream

This skill is a partial copy of [asklokesh/loki-mode](https://github.com/asklokesh/loki-mode).

- **Version:** 9.51.1
- **Upstream commit:** `ea8af7ec421f71e1494948684b5c62a905bee84a`
- **Vendored:** 2026-09-17
- **Contents:** `SKILL.md`, `skills/`, `references/`, `VERSION` only.

The upstream repo is ~98MB; everything else (CLI runtime, MCP server, dashboard,
tests) is omitted. The `loki` CLI that `SKILL.md` refers to is a separate install
(`bun install -g loki-mode`) and is not vendored here.

To update: re-copy those four paths from a fresh clone at the desired tag.
