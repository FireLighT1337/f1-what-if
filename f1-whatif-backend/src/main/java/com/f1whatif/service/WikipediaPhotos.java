package com.f1whatif.service;

import com.f1whatif.dto.DriverPhotoResponse;
import java.net.URI;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Pure helpers for turning a Wikipedia link and its summary into a photo reference. */
final class WikipediaPhotos {

    /** Characters that can appear in an encoded article title; anything else is not used in a request. */
    private static final Pattern SAFE_TITLE = Pattern.compile("^[\\p{L}\\p{N}_%().,'~!*:&+-]+$");

    /** Images on Wikimedia Commons are freely licensed; locally uploaded Wikipedia images often are not. */
    private static final Pattern COMMONS_FILE =
            Pattern.compile("/wikipedia/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/]+)");

    private WikipediaPhotos() {
    }

    /** "http://en.wikipedia.org/wiki/Max_Verstappen" -> "Max_Verstappen". */
    static Optional<String> articleTitle(String wikipediaUrl) {
        if (wikipediaUrl == null || wikipediaUrl.isBlank()) {
            return Optional.empty();
        }
        try {
            URI uri = URI.create(wikipediaUrl.trim());
            String path = uri.getRawPath();
            if (!"en.wikipedia.org".equalsIgnoreCase(uri.getHost()) || path == null || !path.startsWith("/wiki/")) {
                return Optional.empty();
            }
            String title = path.substring("/wiki/".length());
            return SAFE_TITLE.matcher(title).matches() ? Optional.of(title) : Optional.empty();
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /** The link to the article over https, without any query or fragment. */
    static String articleUrl(String title) {
        return "https://en.wikipedia.org/wiki/" + title;
    }

    static DriverPhotoResponse fromSummary(WikipediaSummary summary, String articleUrl) {
        if (summary == null || "disambiguation".equals(summary.type())) {
            return DriverPhotoResponse.none();
        }
        WikipediaSummary.Image thumbnail = summary.thumbnail();
        if (thumbnail == null || thumbnail.source() == null) {
            return DriverPhotoResponse.none();
        }
        Matcher file = COMMONS_FILE.matcher(thumbnail.source());
        if (!file.find()) {
            return DriverPhotoResponse.none();
        }
        String sourceUrl = "https://commons.wikimedia.org/wiki/File:" + file.group(1);
        return new DriverPhotoResponse(thumbnail.source(), sourceUrl, articleUrl, thumbnail.width(), thumbnail.height());
    }
}
