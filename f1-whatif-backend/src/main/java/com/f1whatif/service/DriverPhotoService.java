package com.f1whatif.service;

import com.f1whatif.dto.DriverPhotoResponse;
import com.f1whatif.entity.Driver;
import com.f1whatif.repository.DriverRepository;
import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

/**
 * Finds a photo of a driver through Wikipedia: the driver's article link comes from the
 * database, Wikipedia's summary endpoint names the article's lead image, and only images
 * hosted on Wikimedia Commons are used because those are freely licensed.
 *
 * Wikimedia asks API users to identify themselves, so set app.wikimedia.contact (for example
 * a link to your GitHub profile or an email address).
 */
@Service
public class DriverPhotoService {

    private static final Logger log = LoggerFactory.getLogger(DriverPhotoService.class);
    private static final String SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";

    private final DriverRepository drivers;
    private final RestClient http;

    public DriverPhotoService(DriverRepository drivers, @Value("${app.wikimedia.contact:}") String contact) {
        this.drivers = drivers;

        JdkClientHttpRequestFactory factory =
                new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
        factory.setReadTimeout(Duration.ofSeconds(3));
        String userAgent = contact.isBlank() ? "F1WhatIf/0.0.1" : "F1WhatIf/0.0.1 (" + contact.trim() + ")";
        if (contact.isBlank()) {
            log.warn("app.wikimedia.contact is not set; Wikimedia asks API clients to include contact details");
        }
        this.http = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.USER_AGENT, userAgent)
                .build();
    }

    /**
     * "No photo" is a normal answer and is cached with the rest; a failed lookup throws
     * {@link PhotoLookupException}, which is not cached.
     */
    @Cacheable(cacheNames = "reference", key = "'photo:' + #driverId")
    public DriverPhotoResponse photo(long driverId) {
        Driver driver = drivers.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        Optional<String> title = WikipediaPhotos.articleTitle(driver.getWikipediaUrl());
        if (title.isEmpty()) {
            return DriverPhotoResponse.none();
        }
        try {
            WikipediaSummary summary = http.get()
                    .uri(URI.create(SUMMARY_URL + title.get()))
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(WikipediaSummary.class);
            return WikipediaPhotos.fromSummary(summary, WikipediaPhotos.articleUrl(title.get()));
        } catch (HttpClientErrorException.NotFound e) {
            return DriverPhotoResponse.none();
        } catch (RestClientException e) {
            throw new PhotoLookupException("Wikipedia lookup failed for driver " + driverId, e);
        }
    }
}
