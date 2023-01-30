INSERT INTO `zerox-protect.public.traces`
SELECT *
FROM `zerox-protect.public.crypto_ethereum_traces`
WHERE block_timestamp >= TIMESTAMP("2022-09-15 06:42:59.000")
  AND block_timestamp < TIMESTAMP(CONCAT(CAST(CURRENT_DATE("UTC") AS STRING)," 12:00:00.000"))