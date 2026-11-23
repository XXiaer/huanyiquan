import { $, safeStoreSet } from "../../utils/desktop/dom.js";
import { renderLanding } from "./landing-desktop.js";
import { refreshNoticeCount } from "../messages/notices-desktop.js";

const homeActions = {
    "landing-menu": async ({ action: act }) => {
        var drawer = $('#landing-menu'), scrim = $('.land-scrim'), toggle = $('.land-menu-toggle');
        var opening = act === 'landing-menu' && drawer.hidden;
        drawer.hidden = !opening; scrim.hidden = !opening; toggle.setAttribute('aria-expanded', String(opening));
        if (opening) { drawer.querySelector('button').focus(); refreshNoticeCount(); } else toggle.focus();
        return;
    },
    "landing-how": async () => { $('#landing-how').scrollIntoView({behavior:'smooth'}); return; },
    "landing-lang": async ({ element: el }) => { safeStoreSet('hq.lang', el.dataset.lang); renderLanding(); return; },
};
homeActions["landing-menu-close"] = homeActions["landing-menu"];

export { homeActions };
