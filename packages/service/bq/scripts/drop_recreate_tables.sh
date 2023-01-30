bq rm --table --force public.transactions && bq mk --table public.transactions ../schemas/transactions.json
bq rm --table --force public.token_transfers && bq mk --table public.token_transfers ../bq/schemas/transactions.json
bq rm --table --force public.traces && bq mk --table public.traces ../bq/schemas/transactions.json

bq rm --table --force public.blacklist && bq mk --table public.blacklist ../bq/schemas/blacklist.json