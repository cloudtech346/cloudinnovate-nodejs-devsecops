# Securing Node.js with AWS CodePipeline

This starter project follows the supplied course PDF: GitHub source control, AWS CodePipeline/CodeBuild, Snyk SCA + SAST, OWASP ZAP DAST, and security reports stored in S3.

## What is included

- A small Express Node.js API with a health endpoint and a unit test.
- GitHub Actions workflow (`.github/workflows/devsecops.yml`) that runs tests, Snyk SCA, Snyk SAST, and OWASP ZAP baseline DAST.
- AWS CodeBuild specification (`buildspec.yml`) to run the same checks from CodePipeline and optionally copy reports to S3.

> The PDF's objective mentions GitHub Actions, while its task list asks for AWS CodePipeline. This starter includes both: GitHub Actions provides repository-level checks, and CodePipeline is the AWS release orchestration path. The sample does not deploy to production; it validates the app and publishes scan artifacts.

## Step 1 — Prepare accounts and tools

You need:
1. A GitHub account and a new repository for this project.
2. An AWS account in one region.
3. A Snyk account and API token.
4. Permission to create CodePipeline, CodeBuild, IAM roles, S3 buckets, and a GitHub connection.
5. Docker enabled in the CodeBuild environment for the ZAP container.

Do not commit tokens, AWS keys, passwords, or `.env` files.

## Step 2 — Run the Node.js application locally

Install Node.js 20 or later, then run:

```bash
npm install
npm test
npm start
```

Open `http://localhost:3000/health`. Expected response:

```json
{"status":"healthy"}
```

## Step 3 — Push the project to GitHub

Create an empty GitHub repository, then from this folder:

```bash
git init
git add .
git commit -m "Add Node.js DevSecOps starter"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

Replace the repository URL with your own.

## Step 4 — Configure GitHub Actions

In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**.
- Name: `SNYK_TOKEN`
- Value: your Snyk API token

The workflow runs on pushes and pull requests targeting `main`. Open **Actions** and inspect the `Node.js DevSecOps` run. It performs:
- `npm test`
- Snyk `test` (SCA: third-party dependency vulnerabilities)
- Snyk `code test` (SAST: source-code findings)
- OWASP ZAP baseline scan against the running demo app

The ZAP baseline scan is a non-destructive baseline scan, not an unrestricted penetration test. Run active scans only against systems you own or are explicitly authorized to test.

## Step 5 — Create an S3 bucket for reports

In the AWS Console:
1. Open S3 and create a globally unique bucket name, e.g. `cloudinnovate-devsecops-reports-ACCOUNT-REGION`.
2. Keep **Block all public access** enabled.
3. Keep bucket encryption enabled (SSE-S3 or your approved KMS key).
4. Enable versioning if required by your retention policy.
5. Record the bucket name; you will use it as `REPORTS_BUCKET`.

## Step 6 — Create the CodeBuild project

In AWS Console → CodeBuild → Build projects → Create build project:
1. Project name: `cloudinnovate-nodejs-security`.
2. Source provider: GitHub. Connect using the AWS-managed GitHub connection flow (recommended).
3. Environment: Managed image, Linux, standard image, latest supported version.
4. Enable **Privileged** mode so Docker can run the OWASP ZAP container.
5. Service role: create a new role or use a dedicated least-privilege role.
6. Buildspec: use `buildspec.yml` from this repository.
7. Add environment variables:
   - `SNYK_TOKEN` — value from Snyk; mark as a Secrets Manager or Parameter Store reference (recommended), not plaintext.
   - `REPORTS_BUCKET` — your private S3 report bucket name.
8. Save the project.

### Required IAM permissions

The CodeBuild service role needs:
- CloudWatch Logs permissions for its log group/stream.
- Read access to its source and artifact locations.
- `s3:PutObject` (and, if using KMS, the required KMS permissions) limited to `arn:aws:s3:::YOUR-REPORTS-BUCKET/*`.
- Permission to read the Snyk token from the secret store if you store it there.

Do not grant `s3:*` on all buckets or broad administrator permissions. The CodeBuild role also needs the normal permissions AWS configures for its source/artifact integration.

## Step 7 — Create AWS CodePipeline

In AWS Console → CodePipeline → Create pipeline:
1. Pipeline name: `cloudinnovate-nodejs-devsecops`.
2. Choose a new or existing pipeline service role.
3. Artifact store: choose a private S3 bucket (separate from the report bucket is recommended).
4. Source stage:
   - Provider: GitHub (via GitHub App connection / CodeStar connection).
   - Select your repository and `main` branch.
   - Enable change detection.
5. Build stage:
   - Provider: AWS CodeBuild.
   - Select `cloudinnovate-nodejs-security`.
6. Skip the Deploy stage for this course project unless you have a separate authorized test/staging environment and a defined deployment target.
7. Create the pipeline and release a change.

## Step 8 — Validate the security checks

Make a small code change and push it to `main`. Verify:
- GitHub Actions run completed and its logs show test, SCA, SAST, and DAST steps.
- CodePipeline source and build stages succeeded.
- CodeBuild logs contain the Snyk and ZAP scan steps.
- CodeBuild artifacts include `reports/snyk-sca.json`, `reports/snyk-sast.json`, and ZAP reports when the scanners complete.
- S3 contains a folder named after the CodeBuild build ID, with uploaded reports.

A scan may fail the pipeline when it finds vulnerabilities at or above the configured `high` severity threshold. Investigate findings, upgrade or replace vulnerable dependencies, fix code issues, and rerun. Do not suppress findings just to make the build green.

## Step 9 — Review and improve

- Review Snyk findings and remediate vulnerable packages/code.
- Review the ZAP HTML report and triage alerts; baseline alerts can include false positives.
- Protect `main` with branch protection and require successful checks.
- Pin third-party GitHub Actions to reviewed commit SHAs for production use.
- Use Secrets Manager/Parameter Store, least-privilege IAM, encrypted private S3, and a retention policy.
- Add a real staging deployment and authenticated DAST configuration only when the target environment is approved for testing.

## Troubleshooting

- **Snyk says authentication is missing:** verify `SNYK_TOKEN` exists in GitHub Secrets and CodeBuild's secret-backed environment variable.
- **ZAP cannot connect:** confirm the app starts on port 3000 and Docker privileged mode is enabled in CodeBuild.
- **CodeBuild cannot upload to S3:** check the service role's scoped `s3:PutObject` permission and bucket/KMS policy.
- **Pipeline cannot access GitHub:** check the CodeStar connection status and repository authorization.
- **No Snyk JSON report after a failing scan:** Snyk may stop on the configured severity threshold; inspect CodeBuild logs and consider a separate non-blocking reporting run if your course rubric requires reports for failing scans.

## Scope and assumptions

The PDF specifies the tools and six implementation tasks but does not provide an application repository URL, AWS region, deployment target, IAM policy, or account-specific settings. This is therefore a working starter implementation and console walkthrough, not a deployment into your AWS account. The sample app is intentionally minimal; replace it with the actual Node.js application before treating scan results as meaningful.
