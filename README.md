![](https://img.shields.io/badge/Build%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiesitftung%20Berlin-blue)

# flusshygiene-berlin-data-transfer
[![Build Status](https://travis-ci.org/technologiestiftung/flusshygiene-berlin-data-transfer.svg?branch=master)](https://travis-ci.org/technologiestiftung/flusshygiene-berlin-data-transfer)
Aggregate, clean and store data required for the modelling of bathing water in Berlin, through the respective flusshygiene plattform

## What this does

This script downloads data from Berlin's SenUVK and transforms it into standardized machine-readable data, which is then uploaded to an AWS S3 instance.

## Install

```
npm install
```

## Configure

Create an .env file, based on the .env-sample and fill in your AWS credentials.
Check config.json and modify the list of stations to transform, if required.

## Run

```
npm ci
npm run build
node build/index.js
```
