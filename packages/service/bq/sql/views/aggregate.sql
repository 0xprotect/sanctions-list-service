SELECT  block_number,
        block_hash,
        UNIX_SECONDS(block_timestamp) AS block_timestamp_seconds,
        block_timestamp,
        builder,
        coinbase,
        `hash` AS tx_hash,
        SUM(CASE WHEN level = "transaction" THEN 1 ELSE 0 END) AS transaction_level_count,
        SUM(CASE WHEN level = "token_transfer" THEN 1 ELSE 0 END) AS token_transfer_level_count, 
        SUM(CASE WHEN level = "trace" THEN 1 ELSE 0 END) AS trace_level_count, 
        ARRAY_AGG(STRUCT(level, from_match, to_match)) AS level_overview
FROM `zerox-protect.public.overview`
GROUP BY block_number, block_hash, UNIX_SECONDS(block_timestamp), block_timestamp, builder, coinbase, `hash`  
ORDER BY block_timestamp ASC  