# Fauci Bot

This is a simple [Serverless](https://www.serverless.com/) function that posts
the latest tweets (in our case,
[@CovidVaccineBA](https://twitter.com/CovidVaccineBA)) to a Discord channel.

The serverless.yml file is excluded here because it contains secrets. Sorry, I
didn't want to spend the time digging into Serverless documentation to figure
out how to do it the right way. (But feel free to ask for help if you need it!)

## Pre-requisites

* An AWS account.
* A DynamoDB table named 'fauci-bot' (it's hardcoded in the function, but you
  can change this of course) with the primary key `twitter_username` that is a
  string.
* An IAM role that has basic AWS Lambda permissions and access to GetItem and
  PutItem for that specific DynamoDB table.
* Twitter Developer access so you can create an application to get a Bearer
  Token.
* A Discord server on which you have permissions to create a webhook.

## Local testing

Serverless probably provides a way to do this easily, but I simply do this:

```
AWS_SDK_LOAD_CONFIG=true TWITTER_AUTH_TOKEN=... DISCORD_WEBHOOK_URL=... node run.js
```

Local testing requires AWS credentials to be set up locally. Serverless sets
this up automatically.
