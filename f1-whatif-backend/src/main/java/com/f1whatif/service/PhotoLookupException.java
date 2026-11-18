package com.f1whatif.service;

/** Wikipedia could not be reached or answered with an error. Not cached, so the next request tries again. */
public class PhotoLookupException extends RuntimeException {

    public PhotoLookupException(String message, Throwable cause) {
        super(message, cause);
    }
}
