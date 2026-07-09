# Security Policy

## Supported Versions

This starter is in early framework development. Security updates apply to the current `main` branch unless a release policy is introduced later.

## Reporting a Vulnerability

Do not create a public issue for security vulnerabilities.

Report privately through the repository owner or GitHub private vulnerability reporting if enabled.

Please include:

- A clear description of the issue
- Steps to reproduce
- Affected package, module, or configuration
- Potential impact
- Suggested fix, if known

## Security Principles

- Secrets must not be committed.
- Client-exposed environment variables must use the `EXPO_PUBLIC_` prefix intentionally.
- Tokens and sensitive values must not be stored in plain MMKV.
- Platform storage, database, and network access must stay behind platform services.
