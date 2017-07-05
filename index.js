const _ = require('lodash');
const cheerio = require('cheerio');
const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const Trello = require('node-trello');
const rp = require('request-promise');

require('dotenv').config();
Promise.promisifyAll(Trello.prototype);

const conferences = require('./conferences.json');

const getConference = (name) =>
  (conferences[name] != null) ? _.extend(conferences[name], { name }) : null;

const labelColors = ['green', 'yellow', 'orange', 'red', 'purple', 'blue',
 'sky', 'lime', 'pink', 'black'];

const app = express();
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/:conference?', function(req, res) {
  const conference = getConference(req.query.conference || req.params.conference);

  if (conference == null) {
    if (req.params.conference != null) {
      res.redirect('/');
    } else {
      res.render('select_conference', {
        conferences
      });
    }
  } else {
    res.render('index', {
      appKey: process.env.TRELLO_KEY,
      conference: conference,
    });
  }
})

app.post('/', function(req, res){
  const { board_idOrg, token } = req.body;

  const board_name = req.body.board_name.trim()

  const conference = getConference(req.body.conference);

  if (conference == null) {
    res.redirect(303, '/');
    return;
  }

  conference.name = req.body.conference;

  const fetcher = require(`./conferences/${conference.name}.js`);

  try {
    if (!board_name) {
      throw new Error('You need to specify a board name');
    }
    if (!token) {
      throw new Error('You need to pass a Trello token');
    }
  }
  catch (err) {
    res.status(400).send(err.message);
    return;
  }

  const trello = new Trello(process.env.TRELLO_KEY, token);

  const write = (s, newLine = true) => res.write(s + (newLine ? "</p><p>" : ''));
  const willWrite = (s, newLine = true) => () => write(s, newLine)

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf8' });

  write('​<html><head><title>Creating conference board</title>\
    <link rel="stylesheet" href="/style.css" />\
    <style>body { font-family: monospace; word-wrap: break-word; }</style>\
    </head><body><article><p>');

  write(`Downloading ${conference.scheduleUrl}... `, false)

  fetcher(conference.scheduleUrl)
  .then(({ days, labels }) => {
    const labelIds = {};

    write("done")

    write(`Creating "${board_name}" board... `, false)

    return trello.postAsync('/1/boards', {
      name: board_name,
      idOrganization: board_idOrg,
      defaultLabels: false,
      defaultLists: false,
    })
    .tap(board => write(`done — <a href="${board.url}" target="_blank">watch it grow!</a>`))
    // add 'how to use' list
    .then(board =>
      trello.postAsync('/1/lists', {
        idBoard: board.id,
        name: 'How to use this board',
      })
      .tap(willWrite("Setting up the board... "))
      .tap(willWrite("  - instruction cards", false))
      .then(list =>
        Promise.each([
            '** BEFORE THE CONFERENCE **',
            'Add all your team mates that are going the conference to this board.',
            'Choose which session you\'re going to in each slot by adding yourself to the card.',
            '** DURING THE CONFERENCE **',
            'Use this board on your laptop, iPhone, iPad or Android device with Trello\'s mobile apps.',
            'You can write notes as comments on the session\'s card, and attach any photos or links to elsewhere to the card too.',
            'Press `q` to see your personal schedule.',
            'Press `f` to filter by a label or some text.',
            '** AFTER THE CONFERENCE **',
            'You have a central resource with all the details of the conference, including your whole team\'s notes, photos and links.',
            'When the conference videos are released, link to each one on its card.',
            'Share the board with everyone else at your company so they can learn too, including your notes on how this can apply to your situation!',
          ],
          name =>
            trello.postAsync('/1/cards', { name, idList: list.id })
            .tap(willWrite('.', false))
        )
        .tap(willWrite(' ✓'))
        .then(() => board)
      )
    )
    .tap(willWrite(`  - ${labels.length} labels`, false))
    // create labels
    .tap(board =>
      Promise.each(labels, (name, index) =>
        trello.postAsync(`/1/boards/${board.id}/labels`, {
          name,
          color: labelColors[index % labelColors.length+1]
        })
        .then(label =>
          labelIds[name] = label.id
        )
        .tap(willWrite('.', false))
      )
    )
    .tap(willWrite(' ✓'))
    .tap(willWrite('Creating lists and cards for each day... '))
    // add each day's slots and sessions
    .tap(board =>
      Promise.each(days, day =>
        trello.postAsync('/1/lists', {
          idBoard: board.id,
          name: day.title,
          pos: 'bottom',
        })
        .tap(dayList => trello.postAsync('/1/cards', { name: 'Goals for this day', idList: dayList.id }))
        .tap(dayList => trello.postAsync('/1/cards', { name: 'Key takeaways', idList: dayList.id }))
        .tap(willWrite(`  ${day.title}`))
        .then(() =>
          Promise.each(day.slots, slot =>
            trello.postAsync('/1/lists', {
              idBoard: board.id,
              name: slot.time,
              pos: 'bottom',
            })
            .tap(willWrite(`    ${slot.time}`, false))
            .then(list =>
              Promise.each(slot.sessions, session =>
                trello.postAsync('/1/cards', {
                  name: `${session.title} — ${session.speakers}`,
                  desc: session.blurb,
                  idLabels: session.labels.map(label => labelIds[label]).join(','),
                  idList: list.id
                })
                .then(card =>
                  Promise.each(session.avatars.reverse(), avatarUrl =>
                    trello.postAsync(`/1/cards/${card.id}/attachments`, { url: avatarUrl })
                  ) // Promise.each
                ) // then card
                .tap(willWrite('.', false))
              ) // each session
            ) // then list
            .tap(willWrite(' ✓'))
          ) // each slot
        ) // then dayList
      ) // each day
    )
    .then(board => {
      res.write(`\n\nAll Done! <a href="${board.url}">${board.url}</a></p></article></body></html>`)
      res.end();
    })
  })
  .catch(err => {
    console.error(err);
    res.write(`</p><p style="color: red">Error: ${err.message}</p><p>You might want to close the board in Trello and refresh this page to try again.</p></article></body></html>`);
    res.end()
    throw err;
  })
});

const port = process.env.PORT || 3002;
app.listen(port);

console.log(`listening on ${port}`)
