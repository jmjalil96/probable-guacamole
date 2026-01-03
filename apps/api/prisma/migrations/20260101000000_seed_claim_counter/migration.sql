-- Seed claim_number counter with current MAX or 0 if no claims exist
INSERT INTO global_counters (id, value, "updatedAt")
VALUES ('claim_number', COALESCE((SELECT MAX("claimNumber") FROM claims), 0), NOW())
ON CONFLICT (id) DO NOTHING;
