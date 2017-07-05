const _ = require('lodash');
const cheerio = require('cheerio');
const rp = require('request-promise');

module.exports = (url) =>
  rp(url).then((html) => {
    const $ = cheerio.load(html);

    const processDay = (dayEl) => {
      $dayEl = $(dayEl);
      return {
        title: $('.conference-program__day__header h1', $dayEl).text(),
        slots: _.compact(processSlots($('.conference_program > tbody > tr', $dayEl)))
      }
    };

    const processSlots = ($slotEls) =>
      $slotEls.get().map((slotEl) => {
        $slotEl = $(slotEl);
        const $sessionEls = $('[data-session-slug]', $slotEl);
        // there will be rows without sessions — lunch etc
        if ($sessionEls.length === 0) return;

        return {
          time: $('td.time', $slotEl).text(),
          sessions: processSessions($sessionEls)
        };
      })

    const processSessions = ($sessionEls) =>
      $sessionEls.get().map((sessionEl) => {
        $sessionEl = $(sessionEl);
        return {
          title: $('h4', $sessionEl).first().text().trim(),
          speakers: $('.speakers', $sessionEl).text().trim(),
          avatars: $('.listing-avatar', $sessionEl).get().map(img => $(img).attr('src')),
          blurb: $('.reveal-modal .row:nth-child(2) .columns p', $sessionEl).text().trim(),
          labels: _.uniq($('.label', $sessionEl).get().map(labelEl => $(labelEl).text().trim()))
        }
      })


    const days = $('.show-for-medium-up .conference-program__day').get().map(processDay);
    const labels = _.uniq(
      _.flattenDeep(
        days.map(day => day.slots.map(slot => slot.sessions.map(session => session.labels)))
      )
    )

    return { days, labels };
  });
