ALTER TABLE org_invites
    DROP CONSTRAINT org_invites_status_check,
    ADD CONSTRAINT org_invites_status_check
        CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED'));
