package com.gnosis.repository;

import com.gnosis.domain.Chunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChunkRepository extends JpaRepository<Chunk, UUID> {
    List<Chunk> findByDocumentIdOrderByChunkIndex(UUID documentId);
    void deleteByDocumentId(UUID documentId);

    @Modifying
    @Query("delete from Chunk c where c.mind.org.id = :orgId")
    void deleteByOrgId(@Param("orgId") UUID orgId);

    @Query(value = """
            SELECT c.id, 1 - (c.embedding <=> CAST(:queryVector AS vector)) AS similarity
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE c.mind_id IN (:mindIds)
              AND d.deleted_at IS NULL
            ORDER BY similarity DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findSimilarChunkIds(@Param("mindIds") List<UUID> mindIds,
                                       @Param("queryVector") String queryVector,
                                       @Param("limit") int limit);
}
