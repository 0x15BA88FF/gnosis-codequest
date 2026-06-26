package com.gnosis.repository;

import com.gnosis.domain.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByMindId(UUID mindId);

    @Query("SELECT COALESCE(SUM(d.fileSizeBytes), 0) FROM Document d WHERE d.mind.id = :mindId AND d.deletedAt IS NULL")
    long sumFileSizeByMindId(UUID mindId);
}
