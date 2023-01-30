# Blacklist Service

Service for checking and synchronising new entries/deletions from ofac sdn and non-sdn lists. 

## Endpoints

### Sync

[post] `sync-service-uri/sync`

**Description**

Pulls latest files from ofac website, extracts any eth addresses and creates a distinct/ordered list of addresses (the blacklist). The sha256 hash of this list is taken and compared to different persistence instances:

- cloud storage (blacklist.json)
- table in BigQuery
- smart contract (can be used for realtime filtering at the builder & relay level)

Any instance(s) that result in a different hash to that of the latest pull are updated accordingly. This endpoint is called every hour by a cloud schedule

**example response**

status code 200:
```json
{
    "local": {
        "updated": false,
        "actions": {
            "add": [],
            "delete": []
        }
    },
    "db": {
        "updated": false,
        "actions": {
            "add": [],
            "delete": []
        }
    },
    "smartContract": {
        "updated": false,
        "actions": {
            "add": [],
            "delete": []
        }
    }
}
```

status code 500:
```json
{
    "error" : "check the logs"
}
```

||

```json
{
    "error" : "system error message..."
}
```

### Notify

[post] `sync-service-uri/notify/:builder/:days`

**Description**

Called daily at 3pm UTC by a cloud schedule, `builder` and `days` are set at the schedule level; this is a permissioned call and is setup to notify the relevant discord channel as per the discord webhook provided during setup.

Example:

`sync-service-uri/builder/eden/1`

This checks if any non compliant transactions have been included in blocks produced by any builder with a name containing the word `eden`. A discord notification is sent to the team with the results.

**example response**

status code 200:
```json
{
    "success": true,
    "data": {
        "blacklistedTxsFound": 0
    }
}
```

status code 500:
```json
{
    "error" : "Error fetching blacklist from ${blacklistApiUrl}"
}
```

||

```json
{
    "error" : "system error message..."
}
```

### Cloud run service deployment

```bash
# to deploy the solution as a new cloud run service:

gcloud config set run/region {region}

# assumes secret has already been created and the service account granted access to it. See ../../deployment/DEPLOY.md for more details

gcloud run deploy $sync_service_name \
    --source ./packages/service/. \
    --service-account $readwrite_svc_email \
    --env-vars-file ./packages/service/.env.production.yaml \
    --set-secrets UPDATER_PK=blacklist-updater-pk:latest \
    --no-allow-unauthenticated    

# to deploy updates to an existing service

gcloud run deploy $sync_service_name --source .
```

### example .env.yaml file

```yaml
PROJECT_ID: project
DATASET_ID: dataset
TABLE_ID: table_id
DB_LOCATION: db_location
OFAC_DOWNLOADS_URL: ofac_url
OFAC_SHA256_CHECKSUM_URL: ofac_checksum_url
DISCORD_WEBHOOK: webhook
PROVIDER_URL: provider_url
BLACKLIST_SMART_CONTRACT_ADDRESS: sc_address
CHAIN_ID: chain_id
GS_BUCKET_NAME: bucket
GS_FILE_NAME: blacklist.json
ETHERSCAN_URL: etherscan_url
BLACKLIST_API_URL: blacklist_api_url
SERVICE_NAME: service-name
```