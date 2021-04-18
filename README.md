# Fauci Bot

This is a simple [Serverless](https://www.serverless.com/) function that posts
the latest tweets (in our case,
[@CovidVaccineBA](https://twitter.com/CovidVaccineBA)) to a Discord channel.

The serverless.yml file is excluded here because it contains secrets. Sorry, I
didn't want to spend the time digging into Serverless documentation to figure
out how to do it the right way. (But feel free to ask for help if you need it!)

## Local testing

Serverless probably provides a way to do this easily, but I simply do this:

```
AWS_SDK_LOAD_CONFIG=true TWITTER_AUTH_TOKEN=... DISCORD_WEBHOOK_URL=... node run.js
```
