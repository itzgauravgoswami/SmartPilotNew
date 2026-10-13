# Security Policy

## Supported Versions

The following table lists the security support status for versions of the Smart Pilot platform:

| Version | Supported          |
| :---    | :---               |
| 2.0.x   | Yes                |
| < 2.0.0 | No                 |

Only the latest release branch receives active security updates and vulnerability patches.

---

## Reporting a Vulnerability

The Smart Pilot team takes the security of our platform and user data seriously. If you discover a security vulnerability, we appreciate your cooperation in disclosing it to us in a responsible manner.

### Reporting Procedure

1. **Do not create public issues**: Please refrain from opening public GitHub issues, discussions, or pull requests regarding suspected security vulnerabilities.
2. **Contact information**: Send an email directly to the repository maintainer with detailed vulnerability technical details.
   - Contact: Gaurav Goswami
   - Email: contact via GitHub security advisory or maintainer email associated with the repository.
3. **Report content**:
   - Detailed description of the vulnerability.
   - Exact steps to reproduce the issue (including proof-of-concept scripts or HTTP request payloads where applicable).
   - Affected endpoints, modules, or dependencies.
   - Assessment of potential impact and risk severity.

---

## Response Process and Timeline

Upon receiving a security report:

- **Acknowledgment**: The maintainers will acknowledge receipt within 48 to 72 hours.
- **Assessment**: The issue will be investigated and severity determined in accordance with Common Vulnerability Scoring System (CVSS) guidelines.
- **Remediation**: If validated, a patch will be prepared and thoroughly verified in a private development environment.
- **Release and Disclosure**: Once deployed to production or packaged in a new release, public credit and advisories will be published in coordination with the reporter.

---

## Security Architecture Highlights

Smart Pilot implements multiple layers of security to safeguard user data:

- **Session Limiting**: Enforcement of strict device concurrency quotas (1 active session on Starter, 2 on Premium) with remote device revocation.
- **Password Security**: Strong hashing with bcrypt (salt factor 12) before persistence in MongoDB.
- **Network Protection**: HTTP security headers configured through Helmet, cross-origin resource sharing controls, and tiered IP rate limiting via Express Rate Limit.
- **Token Security**: Cryptographically signed JSON Web Tokens (JWT) verified against active database sessions on every protected operation.
- **Payment Verification**: Cryptographic HMAC-SHA256 signature verification for Razorpay payment receipts prior to entitlement elevation.
