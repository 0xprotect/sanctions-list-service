SELECT *
FROM `zerox-protect.public.crypto_ethereum_token_transfers`
WHERE block_timestamp >= TIMESTAMP(CONCAT(CAST(DATE_ADD(CURRENT_DATE('UTC'),INTERVAL -1 DAY) AS STRING),' 12:00:00.000'))
  AND block_timestamp < TIMESTAMP(CONCAT(CAST(CURRENT_DATE('UTC') AS STRING),' 12:00:00.000'))