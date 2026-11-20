package com.f1whatif.aspect;

/**
 * Works out which address belongs to the visitor.
 *
 * Every proxy that passes a request on adds the address it received it from to the end of the
 * X-Forwarded-For header, so the visitor is found counting from the right: the last entry was
 * added by the proxy closest to this app, the one before it by the next proxy, and so on.
 * Entries further left can be written by the visitor and are never trusted.
 */
final class ClientAddress {

    private ClientAddress() {
    }

    /**
     * @param proxiesToSkip how many entries at the end were added by proxies of your own that sit
     *                      in front of the visitor's real address (0 when the last entry is the visitor)
     * @return the visitor's address, or the address of the direct connection when the header is not
     *         trusted or does not have the expected shape
     */
    static String of(String forwardedFor, String remoteAddress, boolean trustForwardedFor, int proxiesToSkip) {
        if (trustForwardedFor && forwardedFor != null && !forwardedFor.isBlank()) {
            String[] hops = forwardedFor.split(",");
            int index = hops.length - 1 - Math.max(0, proxiesToSkip);
            if (index >= 0) {
                String hop = hops[index].trim();
                if (!hop.isEmpty()) {
                    return hop;
                }
            }
        }
        return remoteAddress;
    }
}
