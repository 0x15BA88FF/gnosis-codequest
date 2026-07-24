package com.gnosis.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.InputStream;
import java.util.UUID;

@Service
public class R2FileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final String bucket;

    public R2FileStorageService(S3Client s3Client, @Value("${r2.bucket}") String bucket) {
        this.s3Client = s3Client;
        this.bucket = bucket;
    }

    @Override
    public String upload(UUID mindId, UUID documentId, String fileName,
                         InputStream inputStream, long contentLength, String contentType) {
        String key = "minds/" + mindId + "/docs/" + documentId + "/" + fileName;
        System.out.println("R2FileStorageService.upload: bucket=" + bucket + ", key=" + key + ", contentLength=" + contentLength);

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();

        try {
            s3Client.putObject(putRequest, RequestBody.fromInputStream(inputStream, contentLength));
            System.out.println("R2FileStorageService.upload: SUCCESS, returning key=" + key);
        } catch (Exception e) {
            System.err.println("R2FileStorageService.upload: ERROR - " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
        return key;
    }

    @Override
    public InputStream download(String r2Key) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(r2Key)
                .build();
        return s3Client.getObject(getRequest);
    }

    @Override
    public void delete(String r2Key) {
        s3Client.deleteObject(builder -> builder.bucket(bucket).key(r2Key));
    }
}
