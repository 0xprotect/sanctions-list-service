SELECT 1 AS level_id,
        'transaction' AS level,
        COALESCE(b.name, bt.coinbase) AS builder,
        bt.*, 
       (SELECT address FROM `zerox-protect.public.blacklist` WHERE address = from_address) AS from_match,
       (SELECT address FROM `zerox-protect.public.blacklist` WHERE address = to_address) AS to_match
FROM `zerox-protect.public.transactions` bt
LEFT JOIN `zerox-protect.public.builders` b ON b.address = bt.coinbase
UNION ALL
SELECT  2 AS level_id,
        'token_transfer' AS level, 
        COALESCE(b.name, bttt.coinbase) AS builder,
        bttt.*, 
       (SELECT address FROM `zerox-protect.public.blacklist` WHERE address = from_address) AS from_match,
       (SELECT address FROM `zerox-protect.public.blacklist` WHERE address = to_address) AS to_match
FROM `zerox-protect.public.token_transfers` bttt
LEFT JOIN `zerox-protect.public.builders` b ON b.address = bttt.coinbase
UNION ALL
SELECT  3 AS level_id,
        'trace' AS level,
        COALESCE(b.name, btt.coinbase) AS builder,
        btt.*, 
       (SELECT address FROM `zerox-protect.public.blacklist` WHERE address = from_address) AS from_match,
       (SELECT address FROM `zerox-protect.public.blacklist` WHERE address = to_address) AS to_match
FROM `zerox-protect.public.traces` btt
LEFT JOIN `zerox-protect.public.builders` b ON b.address = btt.coinbase
ORDER BY block_timestamp DESC, `hash`, 1 ASC