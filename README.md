# Track your peas...

Like a lot of people, I use VS Code. I spend a lot of term there, and after a while you like to set things up the way you like them. I have for some time wanted to track the time I spend, mostly to prove that I am providing value to the people I work for, but also to see for my self when I work, for how long, that kind of thing. And I have two machines and alternate between them so need something that tracks activity across all instances.

So track my peas is a personal tool to track my work. There are plenty of trackers out there but they either sit only on the local machine or you need to get an API key and pay a subscription. That is way overkill for me, and I don't want to pay for stuff like this. 

## Features

Track your peas is a simple time tracker, with a start/stop/pause toggle that sits unobtrusively in your activity bar at the bottom. It stores the times in a Gist as a markdown table of the time you have spent each session with the name of the repository and branch, so you will need a personal access token to make it work, and have access t'internet (obvs). If you don't want people to see what you are doing, you will need a private Gist I guess.

On stopping the timer, a summary of the last session will be published to a gist called `summary.md`

It looks like this:

## Summary

| Date       | Time       | Session Start Time | Session End Time | Session Duration | Repository | Branch     |
|------------|------------|--------------------|------------------|------------------|------------|------------|
| Wed Dec 25 2024    | 12:28:06    | Wed Dec 25 2024 12:28:06 GMT+0000 (Greenwich Mean Time)       | Wed Dec 25 2024 12:28:06 GMT+0000 (Greenwich Mean Time)       | 00:00:12   | rcpch-nhs-organisations| live |

## Requirements

A personal access token scoped to read/write access to Gists
Otherwise, all in the package.json...

## Extension Settings

This should not add anything else to your machine, apart from Axios.

You will need a personal access token to get it working. To do this go to your github settings > developer > personal access tokens. Create a new token with the key: `GITHUB_TOKEN_TRACK_YOUR_PEAS` and save in a new `.env` file in the `envs`

[!IMPORTANT]
DO NOT COMMIT THIS TO GIT. ADD THE FILE TO .GITIGNORE

## Known Issues

Intial commit!

## Release Notes

Initial commit!

---

This is still very much in trial phase. Please do not use for anything important yet.
**Track them peas...**
