(function () {
    "use strict";

    var CONSENT_KEY = "slitherooAdConsent";
    var CONSENT_VALUES = {
        PERSONALIZED: "personalized",
        NON_PERSONALIZED: "non_personalized"
    };
    var config = window.SLITHEROO_CONFIG || {};
    var adRequestInFlight = false;
    var gptInitialized = false;

    function emitRewardedEvent(eventName, metadata) {
        try {
            if (typeof window.onRewardedAdEvent === "function") {
                window.onRewardedAdEvent(eventName, metadata || {});
            }
        } catch (_err) {}
    }

    function getConsentChoice() {
        try {
            var saved = localStorage.getItem(CONSENT_KEY);
            if (saved === CONSENT_VALUES.PERSONALIZED || saved === CONSENT_VALUES.NON_PERSONALIZED) {
                return saved;
            }
        } catch (_err) {}
        return "";
    }

    function updateConsentMode(choice) {
        var personalized = choice === CONSENT_VALUES.PERSONALIZED;
        var consentPayload = {
            ad_storage: "granted",
            ad_user_data: personalized ? "granted" : "denied",
            ad_personalization: personalized ? "granted" : "denied",
            analytics_storage: "granted"
        };
        if (typeof window.gtag === "function") {
            window.gtag("consent", "update", consentPayload);
        }
        emitRewardedEvent("consent_updated", { choice: choice || CONSENT_VALUES.NON_PERSONALIZED });
    }

    function saveConsentChoice(choice) {
        try {
            localStorage.setItem(CONSENT_KEY, choice);
        } catch (_err) {}
        updateConsentMode(choice);
    }

    function renderConsentBannerIfNeeded() {
        if (getConsentChoice()) {
            return;
        }
        var banner = document.createElement("div");
        banner.className = "consent-banner";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-live", "polite");
        banner.innerHTML = [
            "<p>We use ads to fund the game. Choose your ad consent preference.</p>",
            "<div class=\"consent-actions\">",
            "<button type=\"button\" class=\"glass-btn consent-btn\" data-consent=\"personalized\">Allow Personalized Ads</button>",
            "<button type=\"button\" class=\"glass-btn consent-btn\" data-consent=\"non_personalized\">Non-Personalized Only</button>",
            "</div>"
        ].join("");
        document.body.appendChild(banner);

        banner.addEventListener("click", function (event) {
            var target = event.target;
            if (!(target instanceof HTMLElement)) return;
            var selected = target.getAttribute("data-consent");
            if (!selected) return;
            if (selected === "personalized") {
                saveConsentChoice(CONSENT_VALUES.PERSONALIZED);
            } else {
                saveConsentChoice(CONSENT_VALUES.NON_PERSONALIZED);
            }
            banner.remove();
        });
    }

    function applyConsentOnBoot() {
        var saved = getConsentChoice();
        if (saved) {
            updateConsentMode(saved);
            return;
        }
        updateConsentMode(CONSENT_VALUES.NON_PERSONALIZED);
        renderConsentBannerIfNeeded();
    }

    function withGptCommand(handler) {
        if (!window.googletag || !Array.isArray(window.googletag.cmd)) {
            return false;
        }
        window.googletag.cmd.push(handler);
        return true;
    }

    function initRewardedAds() {
        if (gptInitialized) return true;
        if (!window.googletag || !Array.isArray(window.googletag.cmd)) {
            emitRewardedEvent("gpt_missing", {});
            return false;
        }
        withGptCommand(function () {
            try {
                var pubads = window.googletag.pubads();
                var nonPersonalized = getConsentChoice() !== CONSENT_VALUES.PERSONALIZED;
                pubads.setRequestNonPersonalizedAds(nonPersonalized ? 1 : 0);
                window.googletag.enableServices();
                gptInitialized = true;
                emitRewardedEvent("gpt_initialized", { nonPersonalized: nonPersonalized });
            } catch (_err) {
                emitRewardedEvent("gpt_init_failed", {});
            }
        });
        return true;
    }

    function requestGptRewardedAd(timeoutMs) {
        return new Promise(function (resolve) {
            var settled = false;
            var rewardGranted = false;
            var timeoutId = 0;
            var slot = null;
            var listeners = [];

            function finish(result, reason) {
                if (settled) return;
                settled = true;
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                    timeoutId = 0;
                }

                try {
                    if (window.googletag) {
                        var pubads = window.googletag.pubads();
                        listeners.forEach(function (item) {
                            if (typeof pubads.removeEventListener === "function") {
                                pubads.removeEventListener(item.name, item.handler);
                            }
                        });
                        if (slot && typeof window.googletag.destroySlots === "function") {
                            window.googletag.destroySlots([slot]);
                        }
                    }
                } catch (_err) {}

                emitRewardedEvent("request_finished", {
                    success: result,
                    reason: reason || "",
                    rewardGranted: rewardGranted
                });
                resolve(Boolean(result));
            }

            function addPubadsListener(name, handler) {
                try {
                    var pubads = window.googletag.pubads();
                    pubads.addEventListener(name, handler);
                    listeners.push({ name: name, handler: handler });
                } catch (_err) {}
            }

            var pushed = withGptCommand(function () {
                try {
                    var adUnitPath = config.ADMGR_REWARDED_AD_UNIT_PATH || "";
                    if (!adUnitPath) {
                        finish(false, "missing_ad_unit_path");
                        return;
                    }

                    slot = window.googletag.defineOutOfPageSlot(
                        adUnitPath,
                        window.googletag.enums.OutOfPageFormat.REWARDED
                    );
                    if (!slot) {
                        finish(false, "slot_unavailable");
                        return;
                    }

                    slot.addService(window.googletag.pubads());

                    addPubadsListener("rewardedSlotReady", function (event) {
                        if (!event || event.slot !== slot) return;
                        emitRewardedEvent("rewarded_ready", {});
                        try {
                            event.makeRewardedVisible();
                            emitRewardedEvent("rewarded_shown", {});
                        } catch (_err) {
                            finish(false, "show_failed");
                        }
                    });

                    addPubadsListener("rewardedSlotGranted", function (event) {
                        if (!event || event.slot !== slot) return;
                        rewardGranted = true;
                        emitRewardedEvent("rewarded_granted", {});
                    });

                    addPubadsListener("rewardedSlotClosed", function (event) {
                        if (!event || event.slot !== slot) return;
                        finish(rewardGranted, rewardGranted ? "closed_after_reward" : "closed_without_reward");
                    });

                    addPubadsListener("slotRenderEnded", function (event) {
                        if (!event || event.slot !== slot) return;
                        if (event.isEmpty) {
                            finish(false, "no_fill");
                        }
                    });

                    try {
                        window.googletag.display(slot);
                    } catch (_err) {
                        finish(false, "display_failed");
                        return;
                    }

                    try {
                        window.googletag.pubads().refresh([slot]);
                        emitRewardedEvent("rewarded_requested", {});
                    } catch (_err) {
                        finish(false, "refresh_failed");
                    }
                } catch (_err) {
                    finish(false, "gpt_error");
                }
            });

            if (!pushed) {
                finish(false, "gpt_not_ready");
                return;
            }

            timeoutId = window.setTimeout(function () {
                finish(false, "timeout");
            }, timeoutMs);
        });
    }

    async function requestRewardedAd() {
        if (adRequestInFlight) {
            emitRewardedEvent("request_blocked", { reason: "in_flight" });
            return false;
        }
        adRequestInFlight = true;
        try {
            config = window.SLITHEROO_CONFIG || config || {};
            var enabled = Boolean(config.ADS_ENABLED);
            var adStack = String(config.AD_STACK || "").toLowerCase();
            var timeoutMs = Number(config.AD_REQUEST_TIMEOUT_MS) > 0
                ? Number(config.AD_REQUEST_TIMEOUT_MS)
                : 8000;

            if (!enabled) {
                emitRewardedEvent("request_blocked", { reason: "ads_disabled" });
                return false;
            }

            if (adStack !== "gpt_rewarded") {
                emitRewardedEvent("request_blocked", { reason: "stack_not_supported", stack: adStack });
                return false;
            }

            if (!initRewardedAds()) {
                return false;
            }

            return await requestGptRewardedAd(timeoutMs);
        } finally {
            adRequestInFlight = false;
        }
    }

    window.initRewardedAds = initRewardedAds;
    window.requestRewardedAd = requestRewardedAd;
    applyConsentOnBoot();
})();
