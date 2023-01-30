# Install prerequisites

Make sure you have the following installed:

* The [Google Cloud SDK](https://cloud.google.com/sdk/install)

# Environment setup

```bash
# Authenticate using Google Cloud

gcloud auth login

# Create a google cloud configuration:

project=0xProtect

gcloud config configurations create $project

gcloud config set account <your_authenticated_email>

project_id=$(gcloud projects list --format='get(project_id)' --filter="name=$project")

gcloud config set project $project_id

gcloud config set run/region us-central1
```

# Deploy artifacts

```bash
# Ensure you are in the repo's root directory. From this location:

cd ..
```

## Service accounts

2 service accounts are required. One for the public api and another for the sync service. The public api service account will need read access to the public dataset and cloud storage blacklist file. The sync service will require permissions to read and write to all data sources, while also being able to invoke a cloud run service from cloud scheduler. Some of these permissions will be captured in custom roles while other will need to be assigned to specific resources once they're created.

```bash
# Create 2 service accounts; One for the readonly api and one for the service that updates the various data sources:

readonly_svc_name='blacklist-readonly'

gcloud iam service-accounts create $readonly_svc_name \
    --description="Service account with readonly access to the various blacklist datasources. Assigned to the blacklist api" \
    --display-name="$readonly_svc_name"

readwrite_svc_name='blacklist-sync-agent'

gcloud iam service-accounts create $readwrite_svc_name \
    --description="Service account with read and write access to the various blacklist datasources. Assigned to the blacklist sync service" \
    --display-name="$readwrite_svc_name"

# Create custom roles and assign them to their respective service account

readonly_role='blacklist_readonly'

gcloud iam roles create $readonly_role \
    --project=$project_id \
    --file=./deployment/role_blacklist_readonly.yaml

readwrite_role='blacklist_sync_agent'

gcloud iam roles create $readwrite_role \
    --project=$project_id \
    --file=./deployment/role_blacklist_sync_agent.yaml
    
# Get the email of the service account from the list

readonly_svc_email=$(gcloud iam service-accounts list --format='get(email)' --filter="displayName=$readonly_svc_name")

gcloud projects add-iam-policy-binding $project_id \
  --member serviceAccount:$readonly_svc_email \
  --role projects/$project_id/roles/$readonly_role

readwrite_svc_email=$(gcloud iam service-accounts list --format='get(email)' --filter="displayName=$readwrite_svc_name")

gcloud projects add-iam-policy-binding $project_id \
  --member serviceAccount:$readwrite_svc_email \
  --role projects/$project_id/roles/$readwrite_role
```

## Data sources

### Cloud storage

A bucket in cloud storage is used to house the most recent versions of all relevant sdn files available on the ofac site. It will also house a json version of the blacklist that is served from the api. The sync service service account will be granted `OWNER` on the bucket while the readonly-only service account will be granted `READER` solely to the `blacklist.json` file 

```bash
# Create a storage bucket

gcloud alpha storage buckets create gs://$project_id --project=$project_id --location=US --no-public-access-prevention

# Grant blacklist-sync-agent owner and blacklist-api read on bucket

gsutil acl ch -u $readwrite_svc_email:OWNER gs://$project_id
gsutil acl ch -u $readonly_svc_email:READER gs://$project_id

# List permissions on bucket to verify 

gsutil acl get gs://$project_id      
``` 

### Big query

Big query houses the materialised views, loaded daily from bigquery-public-data.crypto_ethereum, that the compliance overview and aggregate views use. Some auxillary tables are also located within bigquery to help with analytics.

`READER` is granted to all authenticated google accounts. This means anyone can view the data within the tables and views having their accounts billed to do so.

`WRITER` is granted to the sync service service account as it will load new data daily via a scheduled query. The same sync service will be checking for new blacklist entries every hour. If an entry is added or removed, the sync service service account will have the ability to reflect these changes in the blacklist table.

```bash
# Create a dataset

bq mk -d \
    --location "US" \
    --description "Dataset for housing all things 0xProtect" \
    public
    
# Create the tables

bq mk \
    --schema ./packages/service/bq/schemas/transactions.json \
    --time_partitioning_field block_timestamp \
    --table public.transactions

bq mk \
    --schema ./packages/service/bq/schemas/transactions.json \
    --time_partitioning_field block_timestamp \
    --table public.token_transfers

bq mk \
    --schema ./packages/service/bq/schemas/transactions.json \
    --time_partitioning_field block_timestamp \
    --table public.traces

bq mk \
    --schema ./packages/service/bq/schemas/blacklist.json \
    --table public.blacklist

bq mk \
    --schema ./packages/service/bq/schemas/builders.json \
    --table public.builders

# Create views to get data from bigquery-public-data.crypto_ethereum

bq mk \
    --use_legacy_sql=false \
    --view "`cat ./packages/service/bq/sql/views/crypto_ethereum_transactions.sql`"  \
    public.crypto_ethereum_transactions

bq mk \
    --use_legacy_sql=false \
    --view "`cat ./packages/service/bq/sql/views/crypto_ethereum_traces.sql`" \
    public.crypto_ethereum_traces

bq mk \
    --use_legacy_sql=false \
    --view "`cat ./packages/service/bq/sql/views/crypto_ethereum_token_transfers.sql`" \
    public.crypto_ethereum_token_transfers

# Create view to union transactions, traces and token transfers

bq mk \
    --use_legacy_sql=false \
    --view "`cat ./packages/service/bq/sql/views/overview.sql`" \
    public.overview

# Create view to aggregate data to tx hash level with counts of blacklisted address interactions

bq mk \
    --use_legacy_sql=false \
    --view "`cat ./packages/service/bq/sql/views/aggregate.sql`" \
     public.aggregate

# Enable BigQuery Data Transfer service

gcloud services enable bigquerydatatransfer.googleapis.com 

# Get current dataset permissions and dump to file

bq show \
    --format=prettyjson \
    $project_id:public > public_ds_permissions.json

# Add the following to the `access` section in `public_ds_permissions.json` NOTE (make sure you change $readwrite_svc_email variable with the actual value before pasting):    
```

```json
{
    "role": "WRITER",
    "userByEmail": $readwrite_svc_email
},
{  
    "role":"READER",
    "specialGroup":"allAuthenticatedUsers"    
}
```

```bash
# Update the dataset to include the new permissions:

bq update \
    --source public_ds_permissions.json \
    $project_id:public

# Deploy the scehduled queries: for more info on the approach taken here, see: https://stackoverflow.com/questions/72458984/create-scheduled-query-with-bq-mk-command-line-tool-from-a-sql-file

txs_query=$(tr -s '[:space:]' ' ' < ./packages/service/bq/sql/scheduled_queries/load_transactions_daily.sql | sed 's/"/\\"/g')
txs_params='{"query":"'$txs_query'","destination_table_name_template":"transactions","write_disposition":"WRITE_APPEND"}'
bq mk \
    --transfer_config \
    --target_dataset=public \
    --data_source=scheduled_query \
    --display_name='load-transactions-daily' \
    --schedule='every day 12:30' \
    --params="$txs_params" \
    --service_account_name=$readwrite_svc_email

xfers_query=$(tr -s '[:space:]' ' ' < ./packages/service/bq/sql/scheduled_queries/load_token_transfers_daily.sql | sed 's/"/\\"/g')
xfers_params='{"query":"'$xfers_query'","destination_table_name_template":"token_transfers","write_disposition":"WRITE_APPEND"}'
bq mk \
    --transfer_config \
    --target_dataset=public \
    --data_source=scheduled_query \
    --display_name='load_token_transfers-daily' \
    --schedule 'every day 12:30' \
    --params="$xfers_params" \
    --service_account_name=$readwrite_svc_email

traces_query=$(tr -s '[:space:]' ' ' < ./packages/service/bq/sql/scheduled_queries/load_traces_daily.sql | sed 's/"/\\"/g')
traces_params='{"query":"'$traces_query'","destination_table_name_template":"traces","write_disposition":"WRITE_APPEND"}'
bq mk \
    --transfer_config \
    --target_dataset=public \
    --data_source=scheduled_query \
    --display_name='load-traces-daily' \
    --schedule 'every day 12:30' \
    --params="$traces_params" \
    --service_account_name=$readwrite_svc_email
```

## Cloud run

Both the api and sync service are deployed as services to cloud run. The api can be invoked with authentication, allowing anyone to call the endpoints provided. Such requests will be executed under the read-only service account principal. The sync service can only be invoked by a principal with `cloud run invoker` within the project. It will be executed by the sync service service account via a cloud schedule instance. 

```bash
# Enable cloud run services. Both the api and sync agent are deployed here:

gcloud services enable run.googleapis.com

# Enable artifact registry and cloudbuild api

gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Api

```bash
blacklist_api_name="blacklist-api"

# Deploy public api

gcloud run deploy $blacklist_api_name \
    --source ./packages/api/. \
    --service-account $readonly_svc_email \
    --env-vars-file ./packages/api/.env.production.yaml \
    --allow-unauthenticated
```

### Sync service

```bash
# Enable the secrets manager api

gcloud services enable secretmanager.googleapis.com

# Create secret for smart contract updater pk

secret_name=blacklist-updater-pk
gcloud secrets create $secret_name    

# This is just a placeholder, we will add the value manually after deployment.

# Grant `$readwrite_svc_email` access to the secret

project_number=$(gcloud projects list --filter="projectId=$project_id" --format="get(projectNumber)")
secret_id="projects/$project_number/secrets/$secret_name"

gcloud secrets add-iam-policy-binding $secret_id \
  --member serviceAccount:$readwrite_svc_email \
  --role roles/secretmanager.secretAccessor

sync_service_name=blacklist-sync-service

# Get blacklist api url and updated BLACKLIST_API_URL value in ./packages/service/.env.production.yaml to point to the correct URL.

print $(gcloud run services list --filter="metadata.name=$blacklist_api_name" --format="value(status.address.url)")

# Deploy service

gcloud run deploy $sync_service_name \
    --source ./packages/service/. \
    --service-account $readwrite_svc_email \
    --env-vars-file ./packages/service/.env.production.yaml \
    --set-secrets UPDATER_PK=blacklist-updater-pk:latest \
    --no-allow-unauthenticated    
```

## Cloud schedule

Two schedules are created:
1. To execute the blacklist sync method hourly
2. To send a discord notification daily highlighting any transactions that included blacklist address in the last 24 hours

```bash
# Get service uri

blacklist_service_uri=`gcloud run services list --filter="metadata.name=$sync_service_name" --format="value(status.address.url)"`

# Create schedule

gcloud scheduler jobs create http blacklist-sync-hourly \
    --schedule "0 * * * *" \
    --uri "$blacklist_service_uri/sync" \
    --http-method POST \
    --location "us-central1" \
    --oidc-service-account-email $readwrite_svc_email

# Create daily discord notification push

gcloud scheduler jobs create http blacklist-discord-notification-daily \
    --schedule "0 15 * * *" \
    --uri "$blacklist_service_uri/notify/$builder/1" \
    --http-method GET \
    --location "us-central1" \
    --oidc-service-account-email $readwrite_svc_email
```

## Other permissions

```bash
# Once the sync service has run once and created `gs://$project_id/blacklist.json` we need to grant the blacklist api service account read access to it as it serves it on https://$blacklist_api_uri/blacklist

gsutil acl ch -u $readonly_svc_email:READER gs://$project_id/blacklist.json  
```

## Other things to do

The builders table needs to be seeded with known builder data. This is not a blocker but allows for users to search for builder data using their name via the blacklist api.

```bash
bq query --use_legacy_sql=false < ./packages/service/bq/scripts/seed_builders.sql
```

We should also backfill tables with data starting from the merge, we can do this once the `$project_id.$dataset_id.blacklist` has been populated by the sync service. Note, this will be performing a snapshot of blacklist transactions, traces and token_transfers using the most currentl representation of the blacklist. If an address was added yesterday, this will act as if it had been blacklisted from as far back as the merge. For zerox-protect, we will backfill using data from staging tables which have been populated using a live blacklist since mid October 2022.

For completeness, without staging tables, we run the following commands:

```bash
bq query --use_legacy_sql=false < ./packages/service/bq/scripts/backfill_transactions.sql
bq query --use_legacy_sql=false < ./packages/service/bq/scripts/backfill_traces.sql
bq query --use_legacy_sql=false < ./packages/service/bq/scripts/backfill_token_transfers.sql
```