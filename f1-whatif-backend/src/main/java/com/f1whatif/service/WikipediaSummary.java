package com.f1whatif.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** The part of Wikipedia's page summary response that is needed to find a photo. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record WikipediaSummary(String type, Image thumbnail) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Image(String source, Integer width, Integer height) {
    }
}
