package com.huanyiquan.servlet;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Locale;
import java.util.regex.Pattern;

final class PageRoutes {
    private static final Pattern PAGE = Pattern.compile("^/(?:"
            + "(?:market(?:/(?:quotes|discover))?|search|appraisals|offers|login(?:/qr-confirm)?|register|help|scan)"
            + "|item/[0-9]+(?:/edit)?"
            + "|auctions(?:/(?:[0-9]+|create|mine))?"
            + "|community(?:/(?:arcade|city-wheel|lost-and-found))?"
            + "|exchange-relays(?:/(?:conversations|matches)/[0-9]+)?"
            + "|exchanges(?:/[0-9]+)?"
            + "|messages(?:/conversations/[0-9]+)?"
            + "|notifications(?:/[a-z][a-z-]*)?"
            + "|wishes(?:/[0-9]+)?"
            + "|listings/(?:create(?:/[a-z-]+)?|published/[0-9]+)"
            + "|users(?:/(?:credit/[0-9]+|[0-9]+(?:/[a-z-]+)?))?"
            + "|account(?:/(?:[a-z][a-z-]*|settings/[a-z][a-z-]*))?"
            + "|admin(?:/[a-z][a-z-]*)?"
            + "|services/campus-delivery"
            + ")/?$");
    private static final Pattern MOBILE_ONLY = Pattern.compile("^/(?:"
            + "scan|login/qr-confirm|help|services/campus-delivery|community/lost-and-found|market/(?:quotes|discover)"
            + "|users(?:/(?:credit/[0-9]+|[0-9]+/[a-z-]+))?"
            + "|account/(?:following|offers|sold-items|exchanges|settings/[a-z-]+)|notifications/[a-z-]+|admin/[a-z-]+"
            + "|listings/create/(?!(?:idle|wish)(?:/|$))[a-z-]+"
            + ")/?$");
    private static final Pattern DESKTOP_ONLY = Pattern.compile(
            "^/(?:auctions/(?:create|mine)|listings/published/[0-9]+|account/(?:email|auctions|campus-auctions|wishes|channels|appraise|vouchers|quota|credit|relay|arcade|security|notices))/?$");

    private PageRoutes() {}

    static boolean matches(String path) {
        return "/".equals(path) || PAGE.matcher(path).matches();
    }

    static String entry(HttpServletRequest request, String path) {
        if (MOBILE_ONLY.matcher(path).matches()) return "mobile/index.html";
        if (DESKTOP_ONLY.matcher(path).matches()) return "index.html";
        String preference = request.getParameter("view");
        if ("desktop".equals(preference)) return "index.html";
        if ("mobile".equals(preference)) return "mobile/index.html";

        String userAgent = request.getHeader("User-Agent");
        boolean mobile = "?1".equals(request.getHeader("Sec-CH-UA-Mobile"));
        if (userAgent != null) {
            String ua = userAgent.toLowerCase(Locale.ROOT);
            mobile |= ua.contains("android") || ua.contains("iphone") || ua.contains("ipad") || ua.contains("ipod");
        }
        return mobile ? "mobile/index.html" : "index.html";
    }
}
