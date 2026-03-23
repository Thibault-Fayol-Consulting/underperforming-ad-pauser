/**
 * --------------------------------------------------------------------------
 * Underperforming Ad Pauser — Script Google Ads
 * --------------------------------------------------------------------------
 * Met automatiquement en pause la pire annonce de chaque groupe d'annonces
 * lorsque son CPA depasse celui de la meilleure annonce selon un multiplicateur.
 *
 * Auteur:  Thibault Fayol — Thibault Fayol Consulting
 * Site:    https://thibaultfayol.com
 * Licence: MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  TEST_MODE: true,
  EMAIL: 'vous@exemple.com',
  MIN_IMPRESSIONS: 1000,
  MIN_ADS: 2,
  CPA_THRESHOLD_MULTIPLIER: 1.5,
  DATE_RANGE: 'LAST_30_DAYS'
};

function main() {
  try {
    Logger.log('=== Underperforming Ad Pauser ===');
    Logger.log('TEST_MODE: ' + CONFIG.TEST_MODE);

    var query =
      'SELECT ad_group.name, ad_group_ad.ad.id, ad_group_ad.status, ' +
      'metrics.impressions, metrics.cost_micros, metrics.conversions, campaign.name ' +
      'FROM ad_group_ad ' +
      'WHERE ad_group_ad.status = "ENABLED" ' +
      'AND campaign.status = "ENABLED" ' +
      'AND ad_group.status = "ENABLED" ' +
      'AND metrics.impressions >= ' + CONFIG.MIN_IMPRESSIONS + ' ' +
      'AND segments.date DURING ' + CONFIG.DATE_RANGE;

    var rows = AdsApp.search(query);
    var adGroups = {};

    while (rows.hasNext()) {
      var row = rows.next();
      var agName = row.adGroup.name;
      var cost = row.metrics.costMicros / 1e6;
      var conversions = row.metrics.conversions;
      var cpa = conversions > 0 ? cost / conversions : 999999;

      if (!adGroups[agName]) adGroups[agName] = [];
      adGroups[agName].push({
        adId: row.adGroupAd.ad.id,
        campaign: row.campaign.name,
        agName: agName,
        cpa: cpa,
        cost: cost,
        conversions: conversions,
        impressions: row.metrics.impressions
      });
    }

    var paused = [];

    for (var agName in adGroups) {
      var ads = adGroups[agName];
      if (ads.length < CONFIG.MIN_ADS) continue;

      ads.sort(function(a, b) { return a.cpa - b.cpa; });
      var best = ads[0];
      var worst = ads[ads.length - 1];

      if (worst.cpa > best.cpa * CONFIG.CPA_THRESHOLD_MULTIPLIER) {
        Logger.log('Mise en pause annonce ' + worst.adId + ' dans "' + agName +
          '" — CPA ' + worst.cpa.toFixed(2) + ' vs meilleur ' + best.cpa.toFixed(2));

        if (!CONFIG.TEST_MODE) {
          var adIter = AdsApp.ads()
            .withCondition('Id = ' + worst.adId)
            .get();
          if (adIter.hasNext()) adIter.next().pause();
        }

        paused.push(worst);
      }
    }

    Logger.log('Total annonces signalees : ' + paused.length);

    if (paused.length > 0) {
      sendSummaryEmail_(paused);
    }

  } catch (e) {
    Logger.log('ERREUR : ' + e.message);
    MailApp.sendEmail(CONFIG.EMAIL, 'Underperforming Ad Pauser — Erreur', e.message);
  }
}

function sendSummaryEmail_(paused) {
  var subject = (CONFIG.TEST_MODE ? '[TEST] ' : '') +
    'Underperforming Ad Pauser — ' + paused.length + ' annonce(s) signalees';

  var body = 'Les annonces suivantes ont ete ' +
    (CONFIG.TEST_MODE ? 'signalees (MODE TEST)' : 'mises en pause') + ' :\n\n';

  for (var i = 0; i < paused.length; i++) {
    var a = paused[i];
    body += '- Campagne : ' + a.campaign + ' | Groupe : ' + a.agName +
      ' | ID : ' + a.adId + ' | CPA : ' + a.cpa.toFixed(2) + '\n';
  }

  body += '\nMultiplicateur seuil : ' + CONFIG.CPA_THRESHOLD_MULTIPLIER + 'x';
  MailApp.sendEmail(CONFIG.EMAIL, subject, body);
}
