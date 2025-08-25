ALTER TABLE router_firewall ADD COLUMN protocol VARCHAR(20);
ALTER TABLE router_firewall ADD COLUMN port VARCHAR(50);
ALTER TABLE router_firewall ADD COLUMN action VARCHAR(20);
ALTER TABLE router_firewall ADD COLUMN chain VARCHAR(20);
