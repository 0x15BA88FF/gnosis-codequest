package com.gnosis.service;

import com.gnosis.domain.Document;
import com.gnosis.exception.BadRequestException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ExtractionServiceTest {

    @Autowired
    private ExtractionService extractionService;

    @Test
    void extractFromText() {
        Document doc = new Document();
        doc.setMediaType("text/plain");
        String content = "Hello, this is a test document.";
        InputStream input = new ByteArrayInputStream(content.getBytes());
        String result = extractionService.extract(doc, input);
        assertThat(result).isEqualTo(content);
    }

    @Test
    void extractFromMarkdown() {
        Document doc = new Document();
        doc.setMediaType("text/markdown");
        String content = "# Heading\n\nThis is **bold** text.";
        InputStream input = new ByteArrayInputStream(content.getBytes());
        String result = extractionService.extract(doc, input);
        assertThat(result).isEqualTo(content);
    }

    @Test
    void extractFromPdf() throws IOException {
        byte[] pdfBytes = createMinimalPdf("Extract this PDF text");
        Document doc = new Document();
        doc.setMediaType("application/pdf");
        InputStream input = new ByteArrayInputStream(pdfBytes);
        String result = extractionService.extract(doc, input);
        assertThat(result).contains("Extract this PDF text");
    }

    @Test
    void extractFromDocx() throws IOException {
        byte[] docxBytes = createMinimalDocx("Extract this DOCX text");
        Document doc = new Document();
        doc.setMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        InputStream input = new ByteArrayInputStream(docxBytes);
        String result = extractionService.extract(doc, input);
        assertThat(result).contains("Extract this DOCX text");
    }

    @Test
    void extractFromPdfDirect() throws IOException {
        byte[] pdfBytes = createMinimalPdf("Direct PDF call");
        String result = extractionService.extractFromPdf(new ByteArrayInputStream(pdfBytes));
        assertThat(result).contains("Direct PDF call");
    }

    @Test
    void extractFromDocxDirect() throws IOException {
        byte[] docxBytes = createMinimalDocx("Direct DOCX call");
        String result = extractionService.extractFromDocx(new ByteArrayInputStream(docxBytes));
        assertThat(result).contains("Direct DOCX call");
    }

    @Test
    void extractFromTextDirect() throws IOException {
        String result = extractionService.extractFromText(
                new ByteArrayInputStream("plain text".getBytes()));
        assertThat(result).isEqualTo("plain text");
    }

    @Test
    void unknownMediaTypeFailsBecauseGeminiUnavailable() {
        Document doc = new Document();
        doc.setMediaType("image/png");
        InputStream input = new ByteArrayInputStream("fake-image-data".getBytes());
        assertThatThrownBy(() -> extractionService.extract(doc, input))
                .isInstanceOf(BadRequestException.class);
    }

    private byte[] createMinimalPdf(String text) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText(text);
                cs.endText();
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] createMinimalDocx(String text) throws IOException {
        try (XWPFDocument document = new XWPFDocument()) {
            XWPFParagraph paragraph = document.createParagraph();
            XWPFRun run = paragraph.createRun();
            run.setText(text);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.write(baos);
            return baos.toByteArray();
        }
    }
}
