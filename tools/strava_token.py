#!/usr/bin/env python3
"""
Retrieve a Strava access token using credentials stored in AWS SSM Parameter Store.

Dynamic Prefix:
    The environment variable AWS_SSM_APP_PATH provides the SSM parameter prefix
    (e.g. /APPLICATION/MY_APP). A trailing slash is stripped if present.

Parameters expected (constructed at runtime):
    <PREFIX>/STRAVA_CLIENT_ID
    <PREFIX>/STRAVA_CLIENT_SECRET
    <PREFIX>/STRAVA_REFRESH_TOKEN

Flow:
1. Resolve prefix from AWS_SSM_APP_PATH and build full parameter names.
2. Fetch the three secure parameters with decryption.
3. Call Strava OAuth token endpoint (grant_type=refresh_token).
4. If a different refresh_token is returned, overwrite the existing one in SSM.
5. Print only the access_token by default (ideal for CI capture) or full JSON with --json.

Environment / Assumptions:
    - AWS credentials & region already configured (profile / SSO / OIDC / env vars).
    - Dependencies: boto3, botocore, requests.

Exit codes:
    0 Success
    2 Missing SSM parameter or empty value
    3 HTTP/network error from Strava
    4 Unexpected / invalid JSON response
    5 Missing AWS_SSM_APP_PATH env var

Usage Examples:
    python tools/strava_token.py               # prints access token only
    python tools/strava_token.py --json        # prints full JSON from Strava
    python tools/strava_token.py --debug --json
    export STRAVA_ACCESS_TOKEN=$(python tools/strava_token.py)
"""
from __future__ import annotations
import argparse
import json
import os
import sys
from typing import Any, Dict

import boto3
import botocore
import requests

# Placeholder; populated dynamically in main() after reading AWS_SSM_APP_PATH
SSM_PARAMS = {}

def build_param_map(prefix: str):
    # No trailing slash expected in prefix; enforce
    if prefix.endswith('/'):
        prefix = prefix.rstrip('/')
    return {
        "client_id": f"{prefix}/STRAVA_CLIENT_ID",
        "client_secret": f"{prefix}/STRAVA_CLIENT_SECRET",
        "refresh_token": f"{prefix}/STRAVA_REFRESH_TOKEN",
    }

def get_prefix() -> str:
    val = os.environ.get("AWS_SSM_APP_PATH")
    if not val:
        print("ERROR: AWS_SSM_APP_PATH environment variable is required (e.g. /APPLICATION/MY_APP)", file=sys.stderr)
        sys.exit(5)
    return val

STRAVA_TOKEN_URL = "https://www.strava.com/api/v3/oauth/token"


def fetch_parameters(ssm_client) -> Dict[str, str]:
    values: Dict[str, str] = {}
    for key, name in SSM_PARAMS.items():
        try:
            resp = ssm_client.get_parameter(Name=name, WithDecryption=True)
        except botocore.exceptions.ClientError as e:
            print(f"ERROR: Failed to retrieve parameter {name}: {e}", file=sys.stderr)
            sys.exit(2)
        param_val = resp.get("Parameter", {}).get("Value")
        if param_val is None:
            print(f"ERROR: Parameter {name} had no value", file=sys.stderr)
            sys.exit(2)
        values[key] = param_val.strip()
    return values


def refresh_strava_token(client_id: str, client_secret: str, refresh_token: str) -> Dict[str, Any]:
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }
    try:
        r = requests.post(STRAVA_TOKEN_URL, data=data, timeout=15)
    except requests.RequestException as e:
        print(f"ERROR: Network error talking to Strava: {e}", file=sys.stderr)
        sys.exit(3)
    if r.status_code != 200:
        print(f"ERROR: Strava token endpoint returned {r.status_code}: {r.text}", file=sys.stderr)
        sys.exit(3)
    try:
        payload = r.json()
    except ValueError:
        print("ERROR: Strava response was not JSON", file=sys.stderr)
        sys.exit(4)
    return payload


def maybe_update_refresh_token(ssm_client, old_token: str, new_token: str):
    if not new_token or new_token == old_token:
        return False
    # Overwrite existing SecureString parameter
    ssm_client.put_parameter(
        Name=SSM_PARAMS["refresh_token"],
        Value=new_token,
        Type="SecureString",
        Overwrite=True,
    )
    return True


def parse_args():
    p = argparse.ArgumentParser(description="Get Strava access token via AWS SSM stored credentials")
    p.add_argument("--json", action="store_true", help="Emit full Strava JSON response instead of just access token")
    p.add_argument("--debug", action="store_true", help="Print debug info to stderr")
    return p.parse_args()


def main():
    args = parse_args()
    ssm_client = boto3.client("ssm")

    prefix = get_prefix()
    global SSM_PARAMS  # redefine with dynamic prefix
    SSM_PARAMS = build_param_map(prefix)
    params = fetch_parameters(ssm_client)
    if args.debug:
        print("Fetched SSM parameter names only (values hidden)", file=sys.stderr)

    payload = refresh_strava_token(
        client_id=params["client_id"],
        client_secret=params["client_secret"],
        refresh_token=params["refresh_token"],
    )

    access_token = payload.get("access_token")
    new_refresh = payload.get("refresh_token")

    if not access_token:
        print("ERROR: No access_token in Strava response", file=sys.stderr)
        if args.debug:
            print(json.dumps(payload, indent=2), file=sys.stderr)
        sys.exit(4)

    updated = False
    if new_refresh:
        try:
            updated = maybe_update_refresh_token(ssm_client, params["refresh_token"], new_refresh)
        except botocore.exceptions.ClientError as e:
            print(f"WARNING: Could not update refresh token in SSM: {e}", file=sys.stderr)

    if args.debug:
        print(f"Refresh token updated: {updated}", file=sys.stderr)

    if args.json:
        # Include whether we updated refresh token
        payload["_refresh_token_updated"] = updated
        print(json.dumps(payload, indent=2))
    else:
        # Print only access token for easy capture
        print(access_token)

if __name__ == "__main__":
    main()
