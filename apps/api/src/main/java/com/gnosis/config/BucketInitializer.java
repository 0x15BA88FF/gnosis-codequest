package com.gnosis.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Component
public class BucketInitializer {

    private static final Logger log = LoggerFactory.getLogger(BucketInitializer.class);

    private final S3Client s3Client;
    private final String bucket;

    public BucketInitializer(S3Client s3Client, @Value("${r2.bucket}") String bucket) {
        this.s3Client = s3Client;
        this.bucket = bucket;
    }

    @PostConstruct
    public void ensureBucketExists() {
        try {
            s3Client.headBucket(b -> b.bucket(bucket));
            log.info("Bucket '{}' already exists", bucket);
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                try {
                    s3Client.createBucket(b -> b.bucket(bucket));
                    log.info("Created bucket '{}'", bucket);
                } catch (Exception ex) {
                    log.warn("Could not create bucket '{}': {}", bucket, ex.getMessage());
                }
            } else {
                log.warn("Could not check bucket '{}': {}", bucket, e.getMessage());
            }
        } catch (SdkClientException e) {
            log.warn("MinIO not available, skipping bucket check for '{}': {}", bucket, e.getMessage());
        }
    }
}
