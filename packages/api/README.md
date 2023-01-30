# Blacklist Api

Api for blacklist read-only data

## Endpoints

### Blacklist

[get] `blacklist-api-uri/blacklist`

**Description**

Endpoint for pulling the blacklist from cloud storage bucket as json file

**Example response**

status code 200:
```json
[
    "0x01e2919679362dfbc9ee1644ba9c6da6d6245bb1",
    "0x03893a7c7463ae47d46bc7f091665f1893656003",
    "0x04dba1194ee10112fe6c3207c0687def0e78bacf",
    "0x05e0b5b40b7b66098c2161a5ee11c5740a3a7c45",
    "0x07687e702b410fa43f4cb4af7fa097918ffd2730",
    "0x0836222f2b2b24a3f36f98668ed8f0b38d1a872f",
    "0x08723392ed15743cc38513c4925f5e6be5c17243",
    "0x08b2efdcdb8822efe5ad0eae55517cf5dc544251",
    "0x09193888b3f38c82dedfda55259a82c0e7de875e",
    "0x098b716b8aaf21512996dc57eb0615e2383e2f96",
    "0x0e3a09dda6b20afbb34ac7cd4a6881493f3e7bf7",
    "0x0ee5067b06776a89ccc7dc8ee369984ad7db5e06",
    "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc",
    ...
]
```

status code 500:
```json
{
    "error" : "soemthing went wrong"
}
```

### Non compliant txs for builder

[get] `blacklist-api-uri/builder/:builder/:days`

**Description**

Endpoint for pulling non compliant transactions for a given builder|address `builder` within the last n days `days`

**example response**

status code 200:
```json
[
    {
        "blockNumber": 16058486,
        "blockHash": "0x7f662197243fbbfa6f58ec375058496f0e61c8d7e80e76a608fadd01b60ff91e",
        "blockTimestampUnix": 1669517951,
        "blockTimestamp": {
            "value": "2022-11-27T02:59:11.000Z"
        },
        "builder": "Generic: Builder",
        "transactionHash": "0x1186fd3e80fc2464dee6fd5d2ee766bde5446b6684aea900a9e476dcf35ea60c",
        "transactionLevelCount": 0,
        "tokenTransferLevelCount": 1,
        "traceLevelCount": 0,
        "levelOverview": [
            {
                "level": "token_transfer",
                "fromMatch": null,
                "toMatch": "0xdd4c48c0b24039969fc16d1cdf626eab821d3384"
            }
        ]
    },
    {
        "blockNumber": 16065419,
        "blockHash": "0x29cc34da0a5d18350dd70362a993edd7bcdbe3715d6ea900bc41be7915be4273",
        "blockTimestampUnix": 1669601603,
        "blockTimestamp": {
            "value": "2022-11-28T02:13:23.000Z"
        },
        "builder": "Generic: Builder",
        "transactionHash": "0x72f7f3f050d28e66382ce0b204dd35d8c6ec577907aeaf92c2ad32c491504bca",
        "transactionLevelCount": 0,
        "tokenTransferLevelCount": 1,
        "traceLevelCount": 0,
        "levelOverview": [
            {
                "level": "token_transfer",
                "fromMatch": null,
                "toMatch": "0x8589427373d6d84e98730d7795d8f6f8731fda16"
            }
        ]
    }
]
```

||

```json
{ 
    "message": "no ofac txs found" 
}
```

status code 400:
```json
{
    "error" : "days parameter needs to be a number"
}
```

status code 500:
```json
{
    "error" : "soemthing went wrong"
}
```

### Details for a specific non compliant transaction

[get] `blacklist-api-uri/tx/:txHash/:blockTimestampUnix`

**Description**

Endpoint for a specific non compliant transaction using the transaction hash `txHash` and unix timestamp for the associated block`blockTimestampUnix`

**example response**

status code 200:
```json
{
    "blockNumber": 15932356,
    "blockHash": "0x8bf6a9c30c6415d4170443d6af5ef704a087bfc516a766e79060cbdbb9caf41c",
    "blockTimestampUnix": 1667995511,
    "blockTimestamp": {
        "value": "2022-11-09T12:05:11.000Z"
    },
    "builder": "Generic: Builder",
    "transactionHash": "0x00a3cc09bf2913b2b850b6c5e50a8ba2b01942a48a7788bc3f467eccec6ee30a",
    "transactionLevelCount": 0,
    "tokenTransferLevelCount": 0,
    "traceLevelCount": 3,
    "levelOverview": [
        {
            "level": "trace",
            "fromMatch": null,
            "toMatch": "0x77777feddddffc19ff86db637967013e6c6a116c"
        },
        {
            "level": "trace",
            "fromMatch": null,
            "toMatch": "0x77777feddddffc19ff86db637967013e6c6a116c"
        },
        {
            "level": "trace",
            "fromMatch": null,
            "toMatch": "0x77777feddddffc19ff86db637967013e6c6a116c"
        }
    ]
}
```

status code 404:
```json
{ 
    "error": "transaction not found" 
}
```

status code 400:
```json
{
    "error" : "invalid tx hash"
}
```

||

```json
{
    "error" : "blockTimestampUnix parameter needs to be a number"
}
```

status code 500:
```json
{
    "error" : "blockTimestampUnix parameter needs to be a number"
}
```

### Cloud run service deployment

```bash

# to deploy the solution as a new cloud run service:

gcloud config set run/region {region}

gcloud run deploy $blacklist_api_name \
    --source ./packages/api/. \
    --service-account $readonly_svc_email \
    --env-vars-file ./packages/api/.env.production.yaml \
    --allow-unauthenticated

# to deploy updates to an existing service

gcloud run deploy $blacklist_api_name --source .
```

### example .env.yaml file

```yaml
PROJECT_ID: project
DATASET_ID: dataset
BLACKLISTED_TXS_DETAIL_TABLE_ID: table_id
DB_LOCATION: location
GS_BUCKET_NAME: bucket
GS_FILE_NAME: blacklist.json
```
