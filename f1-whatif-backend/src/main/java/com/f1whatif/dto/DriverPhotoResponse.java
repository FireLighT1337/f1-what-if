package com.f1whatif.dto;

/**
 * A freely licensed photo of a driver from Wikimedia Commons. photoUrl is null when there is
 * none; sourceUrl is the Commons page of the file (author and licence) and articleUrl the
 * driver's Wikipedia article.
 */
public record DriverPhotoResponse(
        String photoUrl,
        String sourceUrl,
        String articleUrl,
        Integer width,
        Integer height) {

    public static DriverPhotoResponse none() {
        return new DriverPhotoResponse(null, null, null, null, null);
    }
}
