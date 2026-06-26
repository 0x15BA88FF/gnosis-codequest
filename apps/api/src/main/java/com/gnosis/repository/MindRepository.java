package com.gnosis.repository;

import com.gnosis.domain.Mind;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MindRepository extends JpaRepository<Mind, UUID> {
}
