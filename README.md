# Conference Board #

Creates your own copy of a conference schedule as an _unbelievably useful_ Trello board.

![Example board](https://trello-attachments.s3.amazonaws.com/595d54870a2ec51739d5fa32/595d57e1e6633c571488dd09/68906c3bdf898162842d52166d5a1eaa/fullstack2017.png)

Your Trello board will become an invaluable resource for you and your teammates, helping you get the most from your time at the conference.

A handy tool for yourself, and it becomes even more fun when going to the conference as a group.

The conference board helps you before, during and after the conference:

- Before:
    - Use your board at [trello.com](https://trello.com) to plan to maximize your time, in partnership with your teammates
    - browse through the sessions on offer, and choose what interests you
    - add any questions you want to be answered in the sessions on the card, and you'll have it in front of you during the talk!
- During:
    - Use the board on your mobile or laptop
    - filter the board to show just the sessions you're going to
    - search sessions by text or labels
    - see the comments and content from your teammates in real time — no need to duplicate notes!
    - record details of people you meet
- After:
    - share the board with the rest of your company, or even make it public for the whole Twitterverse to enjoy
    - add video links to the session cards, once they're available
    - the board is a valuable resource to refer back to
    - you'll have boards from all your conferences in the one place. Search across all boards to find that talk you heard somewhere, but can't remember which conference it was at!

Each session at the conference is added as its own card

Assign yourself to the cards of the sessions you're going to

You can easily see the choice of sessions in each time slot, and choose which one you're interested in. See which your teammates have chosen too, helping you spread out to maximize the value for your company, or choose to join others for the shared learning.

The session card is a central place for all your notes, questions, links and photos.



The app scrapes the schedule from the conference website (or API, if available) and creates a new Trello board in your account.


## Current conferences supported:

 - [FullStack 2017, London](https://skillsmatter.com/conferences/8264-fullstack-2017-the-conference-on-javascript-node-and-internet-of-things)


## Add your conference!

It's easy to add a conference. You just need a module that gets the data from somewhere and returns an object like below, with an array of days, slots and sessions, and a list of all the labels in use.

```javascript
{
  days: [
    {
      title: 'Day 1: Wednesday 12th July',
      slots: [
        {
          time: '09:30',
          sessions: [
            {
              title: 'Opening Keynote',
              speakers: 'David Mitchell',
              avatars: [ 'https://example.com/amazing-image.png' ],
              blurb: 'Winner of the ‘Most like David Mitchell’ award 2012-2015, David is going to speak to us about JavaScript.',
              labels: [ 'javascript' ]
            }
          ]
        },
        {
          time: '10:30',
          sessions: [
            {
              title: 'Putting things on top of other Things',
              speakers: 'Graham Chapman and John Cleese',
              avatars: [ 'https://cdns-r-us.net/graham.jpg', 'https://cdns-r-us.net/john.jpg' ],
              blurb: 'With live demos and significant fire hazards, this pair are sure to entertain and inform.',
              labels: [ 'things', 'fire' ]
            },
            {
              title: 'Dust',
              speakers: 'Mary Magnuson',
              avatars: [ 'https://all-about-dust.org/dust.jpg' ],
              blurb: 'Dust. Dust — anyone?',
              labels: [ 'audio', 'music', 'dust' ]
            }
          ]
        },
        {
          time: '11:30',
          sessions: […]
        },
        …
      ]
    }
    {
      title: 'Day 2: Thursday 13th July',
      slots: […]
    }
  ],
  labels: [
    'javascript',
    'things',
    'fire',
    'audio',
    'music',
    'dust',
  ]
}
```

Add a module that fetches and returns an object of that form into the `conferences` folder. Then add an entry to the `conferences.json` file, with a key matching the filename of that fetching module.

Please open PRs to add other conferences!


## Remix on Glitch
Use Glitch to easily get a copy of this app to develop and change — or even if you just want to run your own instance.

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/remix/https://glitch.com/edit/#!/remix/conference-board)

You'll then just need to [get an API key from Trello](https://trello.com/app-key) and add it to the .env file as
```
TRELLO_KEY=<your Trello app key>
```
