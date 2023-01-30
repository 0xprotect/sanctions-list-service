SELECT t.block_number,
       t.block_hash,
       t.block_timestamp,
       t.transaction_hash AS `hash`,
       b.miner AS coinbase,       
       t.from_address,
       t.to_address
FROM `bigquery-public-data.crypto_ethereum.traces` t
JOIN `bigquery-public-data.crypto_ethereum.blocks` b ON b.`timestamp` = t.block_timestamp
WHERE t.block_timestamp >= TIMESTAMP("2022-09-15 06:42:59.000")
  AND ( EXISTS (SELECT * 
              FROM `zerox-protect.public.blacklist` oa 
              WHERE LOWER(oa.address) = LOWER(t.from_address))
        OR 
        EXISTS (SELECT * 
              FROM `zerox-protect.public.blacklist` oa
              WHERE LOWER(oa.address) = LOWER(t.to_address)))