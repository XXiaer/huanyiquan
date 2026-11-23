import { bindDesktopInteractions } from "./events.js";
import { startDesktopRouter } from "./navigation.js";
import { bindMessageGestures } from "../../views/messages/desktop.js";
import { bindNoticePopup } from "../../views/messages/notices-desktop.js";
import { initializeTheme } from "../../views/users/desktop.js";

if (!siteRoutes.canonicalize()) {
    siteRoutes.title();
    siteRoutes.watchLinks();
    initializeTheme();
    bindNoticePopup();
    bindMessageGestures();
    bindDesktopInteractions();
    startDesktopRouter();
}
