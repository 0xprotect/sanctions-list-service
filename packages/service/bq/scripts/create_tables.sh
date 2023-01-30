bq mk --schema ../bq/schemas/transactions.json --time_partitioning_field block_timestamp --table public.transactions
bq mk --schema ../bq/schemas/transactions.json --time_partitioning_field block_timestamp --table public.token_transfers
bq mk --schema ../bq/schemas/transactions.json --time_partitioning_field block_timestamp --table public.traces

bq mk --schema ../bq/schemas/blacklist.json --table public.blacklist