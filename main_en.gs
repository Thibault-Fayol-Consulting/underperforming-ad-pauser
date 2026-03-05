/**
 * --------------------------------------------------------------------------
 * underperforming-ad-pauser - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Author: Thibault Fayol - Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */
var CONFIG = { TEST_MODE: true, MIN_IMPRESSIONS: 1000, MIN_ADS: 2 };
function main() {
    Logger.log("Evaluating Ad Group winners and losers...");
    var agIter = AdsApp.adGroups().withCondition("Status = ENABLED").get();
    while(agIter.hasNext()) {
        var ag = agIter.next();
        var adIter = ag.ads().withCondition("Status = ENABLED").forDateRange("LAST_30_DAYS").get();
        var ads = [];
        while(adIter.hasNext()) {
            var ad = adIter.next();
            var stats = ad.getStatsFor("LAST_30_DAYS");
            if (stats.getImpressions() > CONFIG.MIN_IMPRESSIONS) {
                ads.push({ ad: ad, cpa: (stats.getConversions()>0 ? stats.getCost()/stats.getConversions() : 9999) });
            }
        }
        if (ads.length >= CONFIG.MIN_ADS) {
            ads.sort(function(a,b) { return a.cpa - b.cpa; });
            var worst = ads[ads.length - 1];
            if (worst.cpa > ads[0].cpa * 1.5) { // 50% worse than best
                Logger.log("Pausing worst ad in " + ag.getName() + " (CPA: " + worst.cpa.toFixed(2) + ")");
                if (!CONFIG.TEST_MODE) worst.ad.pause();
            }
        }
    }
}
