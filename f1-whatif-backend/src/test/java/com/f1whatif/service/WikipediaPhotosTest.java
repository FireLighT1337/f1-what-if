package com.f1whatif.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.f1whatif.dto.DriverPhotoResponse;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class WikipediaPhotosTest {

    private static final String COMMONS_THUMB =
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Max_Verstappen_2023.jpg/320px-Max_Verstappen_2023.jpg";

    @Test
    void takesTheArticleTitleFromAnHttpOrHttpsLink() {
        assertEquals(Optional.of("Max_Verstappen"), WikipediaPhotos.articleTitle("http://en.wikipedia.org/wiki/Max_Verstappen"));
        assertEquals(Optional.of("Max_Verstappen"), WikipediaPhotos.articleTitle("https://en.wikipedia.org/wiki/Max_Verstappen"));
    }

    @Test
    void keepsEncodedCharactersAndParenthesesInTheTitle() {
        assertEquals(Optional.of("Nico_H%C3%BClkenberg"), WikipediaPhotos.articleTitle("http://en.wikipedia.org/wiki/Nico_H%C3%BClkenberg"));
        assertEquals(Optional.of("Mike_Thackwell_(racing_driver)"),
                WikipediaPhotos.articleTitle("https://en.wikipedia.org/wiki/Mike_Thackwell_(racing_driver)"));
    }

    @Test
    void ignoresLinksThatAreNotEnglishWikipediaArticles() {
        assertTrue(WikipediaPhotos.articleTitle(null).isEmpty());
        assertTrue(WikipediaPhotos.articleTitle("").isEmpty());
        assertTrue(WikipediaPhotos.articleTitle("https://example.com/wiki/Max_Verstappen").isEmpty());
        assertTrue(WikipediaPhotos.articleTitle("https://en.wikipedia.org/w/index.php?title=Max").isEmpty());
        assertTrue(WikipediaPhotos.articleTitle("not a url").isEmpty());
    }

    @Test
    void refusesTitlesThatCouldChangeTheRequestPath() {
        assertTrue(WikipediaPhotos.articleTitle("https://en.wikipedia.org/wiki/../../evil").isEmpty());
        assertTrue(WikipediaPhotos.articleTitle("https://en.wikipedia.org/wiki/a/b").isEmpty());
    }

    @Test
    void usesAThumbnailHostedOnCommonsAndLinksToItsFilePage() {
        WikipediaSummary summary = new WikipediaSummary("standard", new WikipediaSummary.Image(COMMONS_THUMB, 320, 427));

        DriverPhotoResponse photo = WikipediaPhotos.fromSummary(summary, "https://en.wikipedia.org/wiki/Max_Verstappen");

        assertEquals(COMMONS_THUMB, photo.photoUrl());
        assertEquals("https://commons.wikimedia.org/wiki/File:Max_Verstappen_2023.jpg", photo.sourceUrl());
        assertEquals("https://en.wikipedia.org/wiki/Max_Verstappen", photo.articleUrl());
        assertEquals(Integer.valueOf(320), photo.width());
    }

    @Test
    void doesNotUseImagesUploadedOnlyToEnglishWikipedia() {
        String local = "https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Some_Driver.jpg/220px-Some_Driver.jpg";
        WikipediaSummary summary = new WikipediaSummary("standard", new WikipediaSummary.Image(local, 220, 300));

        assertNull(WikipediaPhotos.fromSummary(summary, "x").photoUrl());
    }

    @Test
    void givesNoPhotoForADisambiguationPageOrAPageWithoutImage() {
        assertNull(WikipediaPhotos.fromSummary(new WikipediaSummary("disambiguation", new WikipediaSummary.Image(COMMONS_THUMB, 1, 1)), "x").photoUrl());
        assertNull(WikipediaPhotos.fromSummary(new WikipediaSummary("standard", null), "x").photoUrl());
        assertNull(WikipediaPhotos.fromSummary(null, "x").photoUrl());
    }
}
