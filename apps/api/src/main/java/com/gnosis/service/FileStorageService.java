package com.gnosis.service;

import java.io.InputStream;
import java.util.UUID;

public interface FileStorageService {

    String upload(UUID mindId, UUID documentId, String fileName, InputStream inputStream, long contentLength, String contentType);

    InputStream download(String r2Key);

    void delete(String r2Key);
}
