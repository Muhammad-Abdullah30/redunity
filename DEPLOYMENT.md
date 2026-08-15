# Hostinger deployment setup

This repository is configured for GitHub Actions deployment to Hostinger.

## What to add in GitHub

Create these repository secrets under Settings > Secrets and variables > Actions:

- `HOSTINGER_FTP_SERVER`
- `HOSTINGER_FTP_USERNAME`
- `HOSTINGER_FTP_PASSWORD`
- `HOSTINGER_FTP_PORT`
- `HOSTINGER_FTP_REMOTE_DIR`

## Values to use

- `HOSTINGER_FTP_SERVER`: your Hostinger FTP host, usually shown in hPanel FTP account details
- `HOSTINGER_FTP_USERNAME`: your FTP username
- `HOSTINGER_FTP_PASSWORD`: your FTP password
- `HOSTINGER_FTP_PORT`: usually `21` for FTP/FTPS
- `HOSTINGER_FTP_REMOTE_DIR`: the target folder on Hostinger, usually `/public_html/`

## How it deploys

Every push to `main` uploads the contents of `redunity_recover/redunity.org/` to Hostinger.

If you want the files to live directly at the domain root, keep `HOSTINGER_FTP_REMOTE_DIR` pointed at `/public_html/`.
