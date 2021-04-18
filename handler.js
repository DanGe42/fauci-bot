'use strict';

const fetch = require('node-fetch');
const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

/**
 * recordLatestTweet records a tweet ID (otherwise referred to as the
 * "SinceID") in our DynamoDB table for the given Twitter username.
 */
function recordLatestTweet(username, tweetID) {
  return ddb.put({
    TableName: 'fauci-bot',
    Item: {
      'twitter_username': username,
      TweetID: tweetID,
      RecordedDate: new Date().toISOString(),
    },
  }).promise();
}

/**
 * getLastTweet fetches the last tweet ID recorded for a given Twitter username
 * from DynamoDB.
 */
async function getLastTweet(username) {
  const data = await ddb.get({
    TableName: 'fauci-bot',
    Key: {
      'twitter_username': username,
    },
  }).promise();

  return data.Item.TweetID;
}

/**
 * getTweets fetches up to 50 of the latest tweets from a given username. This
 * function requires:
 *
 * + twAuthToken: the Bearer Token for your Twitter application
 * + username: the username of the Twitter account
 * + sinceID: only return results since (non-inclusive) this tweet ID
 */
async function getTweets(twAuthToken, username, sinceID) {
  const headers = {
    'Authorization': `Bearer ${twAuthToken}`,
    'Content-Type': 'application/json',
  };

  const getUsernameResp = await fetch(
    `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}`,
    { headers });
  if (!getUsernameResp.ok) {
    throw new Error(`Unable to look up ${username}`);
  }
  const twUserId = (await getUsernameResp.json()).data.id;

  const getTimelineResp = await fetch(
    `https://api.twitter.com/2/users/${twUserId}/tweets?` +
    `since_id=${encodeURIComponent(sinceID)}` +
    '&max_results=50&exclude=replies,retweets',
    { headers });
  if (!getTimelineResp.ok) {
    throw new Error('Unable to look up tweets');
  }
  const tweetIDs =
    ((await getTimelineResp.json()).data || [])
    .map(obj => obj.id);
  return tweetIDs;
}

function tweetIDsToURLs(username, tweetIDs) {
  return tweetIDs.map(tweetID => {
    const _username = encodeURIComponent(username);
    const _tweetID = encodeURIComponent(tweetID);
    return `https://twitter.com/${_username}/status/${_tweetID}`;
  });
}

/**
 * postToDiscord posts a list of tweetURLs to a Discord webhook.
 */
async function postToDiscord(webhookURL, tweetURLs) {
  const headers = { "Content-Type": "application/json" };
  const body = {
    content: tweetURLs.join('\n'),
  };
  const resp = await fetch(
    webhookURL,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  if (!resp.ok) {
    throw new Error(`Error posting to Discord: ${resp.statusText}`);
  }
}

module.exports.hello = async (event) => {
  const twAuthToken = process.env.TWITTER_AUTH_TOKEN;
  if (!twAuthToken) {
    throw new Error('TWITTER_AUTH_TOKEN not set');
  }
  const discordWebhookURL = process.env.DISCORD_WEBHOOK_URL
  if (!discordWebhookURL) {
    throw new Error('DISCORD_WEBHOOK_URL is not set');
  }

  const twUsername = 'CovidVaccineBA';
  const sinceID = await getLastTweet(twUsername);

  const tweets = await getTweets(twAuthToken, twUsername, sinceID);
  let latestID = null;
  if (tweets.length > 0) {
    const tweetURLs = tweetIDsToURLs(twUsername, tweets);
    await postToDiscord(discordWebhookURL, tweetURLs);
    latestID = tweets[0];
    await recordLatestTweet(twUsername, latestID);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        since_id: sinceID,
        latest_id: latestID,
      },
      null,
      2
    ),
  };
};
