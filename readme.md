<div id="top"></div>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
<h3 align="center">Axios Client Builder</h3>

  <p align="center">
    This is a http client builder that is based around the <a href="https://github.com/axios/axios">Axios</a> http client. The package provides an interface that can extend the axios client for some use cases such as: common error handling, logging and dynamic authorization.
    <br />
    <br />
    <a href="https://github.com/alexburley/axios-client-builder/issues">Report Bug</a>
    ·
    <a href="https://github.com/alexburley/axios-client-builder/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>

## Getting Started

### Installation

1. `npm i axios-client-builder`

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

```ts
import { ClientBuilder } from 'axios-client-builder';

const client = new ClientBuilder({
    config: { baseURL: env.getUrl() }, // OPTIONAL Axios config object
})
    .addDefaultHeader(key, value)
    .addDefaultHeader(key, fn)
    .addAuthorizationHeader(fn)
    .addErrorHandling(statuses[], fn[])
    .addRequestLogging(logger) // Log requests and timing of requests
    .addErrorLogging(logger) // Log any request error that does not match axios validateStatus
    .build();
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Alex Burley - [@burlzad](https://twitter.com/burlzad) - alex@askconsult.io

Project Link: [https://github.com/alexburley/axios-client-builder](https://github.com/alexburley/axios-client-builder

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

-   [othneildrew - BEST-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/alexburley/axios-client-builder.svg?style=for-the-badge
[contributors-url]: https://github.com/alexburley/axios-client-builder/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/alexburley/axios-client-builder.svg?style=for-the-badge
[forks-url]: https://github.com/alexburley/axios-client-builder/network/members
[stars-shield]: https://img.shields.io/github/stars/alexburley/axios-client-builder.svg?style=for-the-badge
[stars-url]: https://github.com/alexburley/axios-client-builder/stargazers
[issues-shield]: https://img.shields.io/github/issues/alexburley/axios-client-builder.svg?style=for-the-badge
[issues-url]: https://github.com/alexburley/axios-client-builder/issues
[license-shield]: https://img.shields.io/github/license/alexburley/axios-client-builder.svg?style=for-the-badge
[license-url]: https://github.com/alexburley/axios-client-builder/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/alex-burley/
[product-screenshot]: images/screenshot.png
