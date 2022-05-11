![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

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

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://fabianmoronzirfas.me/"><img src="https://avatars.githubusercontent.com/u/315106?v=4?s=64" width="64px;" alt=""/><br /><sub><b>Fabian Morón Zirfas</b></sub></a><br /><a href="https://github.com/technologiestiftung/flusshygiene-berlin-data-transfer/commits?author=ff6347" title="Code">💻</a> <a href="https://github.com/technologiestiftung/flusshygiene-berlin-data-transfer/commits?author=ff6347" title="Documentation">📖</a></td>
    <td align="center"><a href="http://www.sebastianmeier.eu/"><img src="https://avatars.githubusercontent.com/u/302789?v=4?s=64" width="64px;" alt=""/><br /><sub><b>Sebastian Meier</b></sub></a><br /><a href="https://github.com/technologiestiftung/flusshygiene-berlin-data-transfer/commits?author=sebastian-meier" title="Code">💻</a> <a href="https://github.com/technologiestiftung/flusshygiene-berlin-data-transfer/commits?author=sebastian-meier" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/vogelino"><img src="https://avatars.githubusercontent.com/u/2759340?v=4?s=64" width="64px;" alt=""/><br /><sub><b>Lucas Vogel</b></sub></a><br /><a href="https://github.com/technologiestiftung/flusshygiene-berlin-data-transfer/commits?author=vogelino" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Credits

### Partners network

<table>
  <tr>
    <td>
      <a src="https://www.berlin.de/lageso/">
        <img width="150" src="https://logos.citylab-berlin.org/logo-lageso.svg" />
      </a>
    </td>
    <td>
      <a src="https://www.bwb.de/de/index.php">
        <img width="120" src="https://logos.citylab-berlin.org/logo-berliner-wasserbetriebe.svg" />
      </a>
    </td>
    <td>
      <a src="https://www.kompetenz-wasser.de/en">
        <img width="120" src="https://logos.citylab-berlin.org/logo-kwb.svg" />
      </a>
    </td>
    <td>
      <a src="https://www.technologiestiftung-berlin.de/en/">
        <img width="120" src="https://logos.citylab-berlin.org/logo-technologiestiftung-berlin-en.svg" />
      </a>
    </td>
  </tr>
</table>

### Developed in the project

<table>
  <tr>
    <td>
      <a src="https://www.kompetenz-wasser.de/en">
        <img width="150" src="https://logos.citylab-berlin.org/logo-flusshygiene.png" />
      </a>
    </td>
</table>

### Supported by

<table>
  <tr>
    <td>
      <a src="https://www.bmbf.de/bmbf/en/home/home_node.html">
        <img width="120" src="https://logos.citylab-berlin.org/logo-bbf.svg" />
      </a>
    </td>
    <td>
      <a src="https://bmbf.nawam-rewam.de/en/">
        <img width="160" src="https://logos.citylab-berlin.org/logo-nawam.jpg" />
      </a>
    </td>
  </tr>
</table>
